import {
    CommandInteraction,
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    MessageFlags,
    StringSelectMenuInteraction,
} from "discord.js";
import { withRoleAccess } from "../../../utils-discord/accessControl";
import { ErrorType, getErrorMessage, ErrorDetails } from "@clanscore/shared";

export const data = new SlashCommandBuilder()
    .setName("createtask")
    .setDescription(
        "Vorstand-Only: Erstelle eine Aufgabe und veröffentliche Sie im Aufgaben-Channel.",
    );

export async function handleCreateTaskModal(
    interaction: CommandInteraction | StringSelectMenuInteraction,
    suggestedPoints?: number,
    taskTypeId?: string,
    isExpense?: boolean,
    basePoints?: number,
): Promise<void> {
    try {
        let customId = "create_task_modal_step1";
        if (taskTypeId) {
            customId += `:${taskTypeId}`;
            if (isExpense && basePoints !== undefined) {
                customId += `:expense:${basePoints}`;
            }
        }
        
        const modal = new ModalBuilder()
            .setCustomId(customId)
            .setTitle("Aufgabe erstellen - Schritt 1");

        const nameInput = new TextInputBuilder()
            .setCustomId("name")
            .setLabel("Name")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(50);

        const descriptionInput = new TextInputBuilder()
            .setCustomId("description")
            .setLabel("Beschreibung")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(200);

        const components: ActionRowBuilder<TextInputBuilder>[] = [
            new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
        ];

        const pointsInput = new TextInputBuilder()
            .setCustomId("points")
            .setLabel(isExpense && basePoints !== undefined 
                ? `Punkte (${basePoints} Punkte pro Stunde)` 
                : "Punkte")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(10);
        
        if (suggestedPoints !== undefined) {
            pointsInput.setValue(suggestedPoints.toString());
        }
        
        components.push(
            new ActionRowBuilder<TextInputBuilder>().addComponents(pointsInput)
        );

        const maxParticipantsInput = new TextInputBuilder()
            .setCustomId("max_participants")
            .setLabel("Maximale Anzahl Teilnehmer")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(10);

        const deadlineInput = new TextInputBuilder()
            .setCustomId("deadline")
            .setLabel("Deadline (DD.MM.YYYY) (optional)")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(10);

        components.push(
            new ActionRowBuilder<TextInputBuilder>().addComponents(maxParticipantsInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(deadlineInput),
        );

        modal.addComponents(...components);

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

import { handleSelectTaskTypeModal } from "./selectTaskTypeModal";

async function handleCreateTaskCommand(interaction: CommandInteraction): Promise<void> {
    return handleSelectTaskTypeModal(interaction);
}

export const execute = withRoleAccess(handleCreateTaskCommand, ["Vorstand"]);
