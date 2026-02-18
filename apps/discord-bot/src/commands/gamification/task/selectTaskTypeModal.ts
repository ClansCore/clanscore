import {
    CommandInteraction,
    StringSelectMenuInteraction,
    MessageFlags,
    StringSelectMenuBuilder,
    ActionRowBuilder,
} from "discord.js";
import { ErrorType, getErrorMessage } from "@clanscore/shared";
import { api } from "../../../api/apiClient";
import { handleCreateTaskModal } from "./createTaskModal";

export async function handleSelectTaskTypeModal(
    interaction: CommandInteraction,
): Promise<void> {
    try {
        const taskTypesResult = await api.getAllTaskTypes();
        let taskTypes: Array<{ id: string; name: string; points: number }> = [];
        let warning = "";

        if (!taskTypesResult.ok) {
            warning = `\n\n⚠️ Hinweis: ${getErrorMessage(taskTypesResult.error)}`;
        } else {
            taskTypes = taskTypesResult.value.map(tt => ({
                id: tt.id,
                name: tt.name,
                points: tt.points
            }));
        }

        if (taskTypes.length === 0) {
            return handleCreateTaskModal(interaction);
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("select_task_type")
            .setPlaceholder("Wähle einen Aufgabentyp (optional)")
            .addOptions([
                {
                    label: "Kein Aufgabentyp",
                    value: "none",
                    description: "Ohne Aufgabentyp fortfahren"
                },
                ...taskTypes.map(tt => ({
                    label: tt.name,
                    value: tt.id,
                    description: `${tt.points} Punkte`
                }))
            ]);

        const row = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(selectMenu);

        await interaction.reply({
            content: "Wähle einen Aufgabentyp für die neue Aufgabe (optional):" + warning,
            components: [row],
            flags: MessageFlags.Ephemeral
        });
    } catch (error) {
        console.error("Error showing task type selection:", error);
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

export async function handleSelectTaskType(
    interaction: StringSelectMenuInteraction,
): Promise<void> {
    try {
        const selectedValue = interaction.values[0];
        
        if (selectedValue === "none") {
            await handleCreateTaskModal(interaction);
            return;
        }
        
        const taskTypesResult = await api.getAllTaskTypes();
        
        if (!taskTypesResult.ok) {
            await interaction.reply({
                content: `⚠️ Fehler beim Laden der Aufgabentypen: ${getErrorMessage(taskTypesResult.error)}`,
                flags: MessageFlags.Ephemeral,
            });
            await handleCreateTaskModal(interaction);
            return;
        }

        const found = taskTypesResult.value.find(tt => tt.id === selectedValue);
        
        if (!found) {
            await interaction.reply({
                content: "⚠️ Aufgabentyp nicht gefunden.",
                flags: MessageFlags.Ephemeral,
            });
            await handleCreateTaskModal(interaction);
            return;
        }
        
        if (found.compensation === "Expense") {
            await handleCreateTaskModal(
                interaction,
                undefined, // Don't pre-fill points for Expense
                found.id,
                true, // isExpense
                found.points // basePoints for calculation
            );
        } else {
            await handleCreateTaskModal(
                interaction,
                found.points,
                found.id,
                false, // isExpense
                undefined // basePoints
            );
        }
    } catch (error) {
        console.error("Error handling task type selection:", error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: getErrorMessage({
                    type: ErrorType.UnknownError,
                }),
                flags: MessageFlags.Ephemeral,
            });
        } else {
            await interaction.followUp({
                content: getErrorMessage({
                    type: ErrorType.UnknownError,
                }),
                flags: MessageFlags.Ephemeral,
            });
        }
    }
}
