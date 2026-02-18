import {
    ActionRowBuilder,
    ButtonInteraction,
    MessageFlags,
    ModalBuilder,
    ModalSubmitInteraction,
    TextInputBuilder,
    TextInputStyle,
    TextChannel,
    ComponentType,
    ActionRow,
    MessageActionRowComponent,
    ButtonComponent,
    EmbedBuilder,
} from "discord.js";
import {
    ErrorType,
    getErrorMessage,
    PersonDTO,
    TaskDTO,
    TaskParticipantDTO,
    ChannelNames,
    ErrorDetails,
} from "@clanscore/shared";
import {
    replyWithDeferredError,
    replyWithError,
} from "../../../errors/dsicordAdapter";
import { sendDm } from "../../../utils-discord/sendDm";
import { disableButtons, getChannelByName } from "../../../utils-discord/guild";
import { updateLeaderboards } from "../../../intergration/leaderboard-discord.service";
import { api } from "../../../api/apiClient";
import { config } from "../../../config";

export async function processTaskCompletionButton(
    interaction: ButtonInteraction,
) {
    const [action, taskParticipantId] = interaction.customId.split(":");

    let completed = false;
    if (action === "accept_task_completion") {
        completed = true;
    }

    await showFeedbackModal(interaction, completed, taskParticipantId);
}

async function showFeedbackModal(
    interaction: ButtonInteraction,
    completed: boolean,
    taskParticipantId: string,
) {
    try {
        let completionStatus = "deny";
        if (completed) {
            completionStatus = "accept";
        }
        const modal = new ModalBuilder()
            .setCustomId(
                `feedback_modal:${completionStatus}:${taskParticipantId}`,
            )
            .setTitle("Feedback für die Aufgabe");

        const feedbackInput = new TextInputBuilder()
            .setCustomId("feedback")
            .setLabel("Feedback")
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(200);

        modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                feedbackInput,
            ),
        );

        await interaction.showModal(modal);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDetails: ErrorDetails = {
            type: ErrorType.ModalOpeningFailure,
            details: {
                message: `Error showing modal: ${errorMessage}`,
            }
        };
        getErrorMessage(errorDetails);
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp({
                content: getErrorMessage({
                    type: ErrorType.ModalOpeningFailure,
                }),
                flags: MessageFlags.Ephemeral,
            });
        } else {
            await interaction.reply({
                content: getErrorMessage({
                    type: ErrorType.ModalOpeningFailure,
                }),
                flags: MessageFlags.Ephemeral,
            });
        }
    }
}

export async function handleFeedbackModal(interaction: ModalSubmitInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const guildId = interaction.guildId;
    if (!guildId) {
        await replyWithError(interaction, {
            type: ErrorType.NotAServer,
        });
        return false;
    }

    let originalChannel: TextChannel | null = null;
    let originalMessage = null;
    try {
        if (interaction.message && interaction.message.channel && interaction.message.channel.isTextBased()) {
            originalChannel = interaction.message.channel as TextChannel;
            originalMessage = interaction.message;
        } else {
            // Fallback: get channel by name if message is not available
            const channelResult = await getChannelByName(guildId, ChannelNames.COMPLETED_TASKS);
            if (channelResult.ok && channelResult.value.isTextBased()) {
                originalChannel = channelResult.value as TextChannel;
            }
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDetails: ErrorDetails = {
            type: ErrorType.ChannelNotFound,
            details: {
                message: `Failed to get original channel: ${errorMessage}`,
            }
        };
        getErrorMessage(errorDetails);
    }

    if (originalMessage) {
        try {
            const message = await originalMessage.fetch();
            await message.edit({
                components: disableButtons(message, [
                    "accept_task_completion",
                    "deny_task_completion",
                ]),
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails: ErrorDetails = {
                type: ErrorType.UnknownError,
                details: {
                    message: `Failed to disable buttons: ${errorMessage}`,
                }
            };
            getErrorMessage(errorDetails);
        }
    }

    const [action, status, taskParticipantId] = interaction.customId.split(":");
    const feedback = interaction.fields.getTextInputValue("feedback");

    const taskParticipantResult = await api.getTaskParticipant(taskParticipantId);
    if (!taskParticipantResult.ok) {
        return replyWithDeferredError(interaction, taskParticipantResult.error);
    }

    const participant = taskParticipantResult.value as TaskParticipantDTO;
    const personId = participant.participantId;
    const taskId = participant.taskId;

    const personResult = await api.getPersonById(personId);
    if (!personResult.ok) {
        return replyWithDeferredError(interaction, personResult.error);
    }

    const person = personResult.value as PersonDTO;

    const taskResult = await api.getTaskById(taskId);
    if (!taskResult.ok) {
        return replyWithDeferredError(interaction, taskResult.error);
    }

    const task = taskResult.value as TaskDTO;

    let responsiblePerson: PersonDTO | null = null;
    if (task.responsible) {
        const responsiblePersonResult = await api.getPersonById(
            task.responsible,
        );
        if (!responsiblePersonResult.ok) {
            return replyWithDeferredError(
                interaction,
                responsiblePersonResult.error,
            );
        }
        responsiblePerson = responsiblePersonResult.value as PersonDTO;
    }

    if (status === "accept") {
        const rewardPointsResult = await api.rewardTaskParticipant(
            taskId,
            personId,
        );
        if (!rewardPointsResult.ok) {
            return replyWithDeferredError(
                interaction,
                rewardPointsResult.error,
            );
        }

        const updateLeaderboardsInChannelResult = await updateLeaderboards();
        if (!updateLeaderboardsInChannelResult.ok) {
            const errorMessage = getErrorMessage(updateLeaderboardsInChannelResult.error);
            console.error(`Failed to update leaderboards after task acceptance: ${errorMessage}`);
        }

        if (rewardPointsResult.value?.maxReached) {
            const participantRecordsResult = await api.getTaskParticipantRecords(taskId);
            if (participantRecordsResult.ok) {
                const allCompleted = participantRecordsResult.value.every(
                    (participant) => participant.completedByParticipant === true
                );
                if (allCompleted) {
                    await deleteTaskClaimMessage(taskId);
                }
            }
        }
    }

    if (status === "deny") {
        const resetResult = await api.resetTaskParticipantCompleted(taskParticipantId);
        if (!resetResult.ok) {
            const errorDetails: ErrorDetails = {
                type: resetResult.error.type,
                details: resetResult.error.details,
            };
            getErrorMessage(errorDetails);
        }
    }

    let message = "";
    if (status === "accept") {
        message = `💵 **${task.points} Punkte** für die Aufgabe **${task.name}** wurden deinem Punktestand hinzugefügt.`;
    } else {
        message = 
`⚠️ Aufgabe **${task.name}** erfordert deine Aufmerksamkeit.
Schliesse danach die Aufgabe erneut mit \`\completeTask\` im Bot-Channel ab.`;
    }

    const embeds: any[] = [];
    if (feedback) {
        const feedbackAuthor = interaction.user;
        embeds.push({
            color: 0x0099ff,
            title: `Feedback von ${feedbackAuthor.username}`,
            description: feedback,
        });
    }

    if (person.discordId) {
        const success = await sendDm(
            person.discordId,
            interaction.client,
            {
                content: message,
                embeds,
            },
        );
        if (!success) {
            const errorDetails: ErrorDetails = {
                type: ErrorType.MessageNotSend,
                details: {
                    message: `DM an ${person.nickname ?? person.id} fehlgeschlagen - sende keine Nachricht.`,
                }
            };
            getErrorMessage(errorDetails);
        }
    }

    if (originalChannel) {
        try {
            const decisionText = status === "accept" ? "✅ **Akzeptiert**" : "❌ **Abgelehnt**";
            const decisionColor = status === "accept" ? 0x00ff00 : 0xff0000;
            
            const decisionMaker = interaction.user;
            
            const decisionEmbed = new EmbedBuilder()
                .setTitle(`${decisionText} - Aufgabe: ${task.name}`)
                .setColor(decisionColor)
                .addFields(
                    { name: "Aufgabe", value: task.name, inline: false },
                    { name: "Teilnehmer", value: `<@${person.discordId}> (${person.nickname || `${person.firstName} ${person.lastName}`})`, inline: false },
                    { name: "Entscheidung", value: status === "accept" ? "Akzeptiert" : "Abgelehnt", inline: true },
                    { name: "Punkte", value: String(task.points), inline: true },
                    { name: "Entscheidung von", value: `<@${decisionMaker.id}> (${decisionMaker.username})`, inline: false },
                )
                .setTimestamp();

            if (feedback) {
                decisionEmbed.addFields({
                    name: "Feedback",
                    value: feedback,
                    inline: false,
                });
            }

            if (responsiblePerson) {
                decisionEmbed.addFields({
                    name: "Verantwortlich",
                    value: responsiblePerson.nickname || `${responsiblePerson.firstName} ${responsiblePerson.lastName}`,
                    inline: true,
                });
            }

            await originalChannel.send({
                embeds: [decisionEmbed],
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails: ErrorDetails = {
                type: ErrorType.MessageNotSend,
                details: {
                    message: `Failed to send decision message to channel: ${errorMessage}`,
                }
            };
            getErrorMessage(errorDetails);
        }
    }

    return interaction.editReply({
        content: "Feedback wurde versendet.",
    });
}

async function deleteTaskClaimMessage(taskId: string): Promise<void> {
    try {
        const tasksChannelResult = await getChannelByName(
            config.DISCORD_GUILD_ID,
            ChannelNames.TASKS,
        );
        if (!tasksChannelResult.ok) {
            const errorDetails: ErrorDetails = {
                type: ErrorType.ChannelNotFound,
                details: {
                    message: "Could not find tasks channel to delete claim message",
                }
            };
            getErrorMessage(errorDetails);
            return;
        }

        const channel = tasksChannelResult.value;
        if (!channel.isTextBased()) {
            return;
        }

        const textChannel = channel as TextChannel;
        const messages = await textChannel.messages.fetch({ limit: 100 });

        for (const message of messages.values()) {
            if (!message.components || message.components.length === 0) {
                continue;
            }

            const rows = message.components as ActionRow<MessageActionRowComponent>[];
            for (const row of rows) {
                for (const component of row.components) {
                    if (
                        component.type === ComponentType.Button
                    ) {
                        const btn = component as ButtonComponent;
                        if (btn.customId === `claim_task:${taskId}`) {
                            try {
                                await message.delete();
                                return;
                            } catch (error) {
                                const errorMessage = error instanceof Error ? error.message : String(error);
                                const errorDetails: ErrorDetails = {
                                    type: ErrorType.UnknownError,
                                    details: {
                                        message: `Failed to delete task claim message: ${errorMessage}`,
                                    }
                                };
                                getErrorMessage(errorDetails);
                                return;
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDetails: ErrorDetails = {
            type: ErrorType.UnknownError,
            details: {
                message: `Error deleting task claim message: ${errorMessage}`,
            }
        };
        getErrorMessage(errorDetails);
    }
}
