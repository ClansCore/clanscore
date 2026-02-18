import { ButtonInteraction, MessageFlags } from "discord.js";
import { replyWithDeferredError } from "../../../errors/dsicordAdapter";
import { ErrorType, getErrorMessage, ErrorDetails } from "@clanscore/shared";
import { api } from "../../../api/apiClient";
import { disableButtons } from "../../../utils-discord/guild";

export async function handleClaimTask(interaction: ButtonInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    if (!interaction.isButton()) return;

    const [action, taskId] = interaction.customId.split(":");
    if (action !== "claim_task" || !taskId) return;

    const userDiscordId = interaction.user.id;

    const taskResult = await api.getTaskById(taskId);
    const taskName = taskResult.ok ? taskResult.value.name : taskId;

    const result = await api.claimTask(taskId, userDiscordId);

    if (result.ok) {
        if (result.value.maxReached && interaction.guild) {
            if (interaction.message) {
                try {
                    await interaction.message.edit({
                        components: disableButtons(interaction.message, ["claim_task"], {
                            claim_task: "Maximale Teilnehmer erreicht",
                        }),
                    });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                const errorDetails: ErrorDetails = {
                    type: ErrorType.UnknownError,
                    details: {
                        message: `Failed to disable button after max reached: ${errorMessage}`,
                    }
                };
                getErrorMessage(errorDetails);
            }
            }
        }

        return interaction.editReply({
            content: `✅ Aufgabe "${taskName}" wurde erfolgreich beansprucht.`,
        });
    }

    if (result.error.type === ErrorType.TaskAlreadyClaimed) {
        return replyWithDeferredError(interaction, result.error);
    }

    let shouldDisableButton = [
        ErrorType.TaskDeadlineReached,
        ErrorType.MaxParticipantsAmountReached,
    ].includes(result.error.type);

    if (result.error.type === ErrorType.TaskAlreadyCompleted) {
        const taskCheckResult = await api.getTaskById(taskId);
        if (taskCheckResult.ok) {
            const participantsResult = await api.getTaskParticipants(taskId);
            if (participantsResult.ok) {
                const currentParticipants = participantsResult.value.length;
                const maxParticipants = taskCheckResult.value.maxParticipants;
                if (currentParticipants >= maxParticipants) {
                    shouldDisableButton = true;
                }
            }
        } else {
            shouldDisableButton = false;
        }
    }

    if (shouldDisableButton) {
        let buttonLabel = "Nicht verfügbar";
        
        switch (result.error.type) {
            case ErrorType.TaskDeadlineReached:
                buttonLabel = "Deadline erreicht";
                break;
            case ErrorType.TaskAlreadyCompleted:
                buttonLabel = "Aufgabe abgeschlossen";
                break;
            case ErrorType.MaxParticipantsAmountReached:
                buttonLabel = "Maximale Teilnehmer erreicht";
                break;
        }

        await interaction.message.edit({
            components: disableButtons(interaction.message, ["claim_task"], {
                claim_task: buttonLabel,
            }),
        });
    }

    return replyWithDeferredError(interaction, result.error);
}
