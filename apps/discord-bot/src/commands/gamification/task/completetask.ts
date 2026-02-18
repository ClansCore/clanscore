import {
    ActionRowBuilder,
    CommandInteraction,
    MessageFlags,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
} from "discord.js";
import { replyWithDeferredError } from "../../../errors/dsicordAdapter";
import { ErrorType } from "@clanscore/shared";
import { withRoleAccess } from "../../../utils-discord/accessControl";
import { api } from "../../../api/apiClient";

type OpenTaskDTO = {
    id: string;
    name: string;
};

export const data = new SlashCommandBuilder()
    .setName("completetask")
    .setDescription(
        "Benachrichtige den Vorstand, dass du deine Aufgabe erledigt hast.",
    );

export async function handleCompleteTaskCommand(
    interaction: CommandInteraction,
): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const userDiscordId = interaction.user.id;

    const tasksResult = await api.getOpenTasksForDiscordUser(userDiscordId);
    if (!tasksResult.ok) {
        await replyWithDeferredError(interaction, tasksResult.error);
        return;
    }

    const openTasks = tasksResult.value as OpenTaskDTO[];

    const optionsTasks = openTasks.map((task) => ({
        label: task.name,
        value: task.id,
    }));

    if (optionsTasks.length === 0) {
        await replyWithDeferredError(interaction, {
            type: ErrorType.NoOpenTasks,
        });
        return;
    }

    const taskSelect = new StringSelectMenuBuilder()
        .setCustomId(`select_complete_task:${userDiscordId}`)
        .setPlaceholder("Wähle deine erledigte Aufgabe aus.")
        .addOptions(optionsTasks);

    const rowTaskSelect =
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            taskSelect,
        );

    await interaction.editReply({
        content: "Welche Aufgabe hast du erledigt?",
        components: [rowTaskSelect],
    });
}

export const execute = withRoleAccess(handleCompleteTaskCommand, [
    "Vorstand",
    "Mitglied",
]);
