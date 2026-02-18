import {
    CommandInteraction,
    EmbedBuilder,
    MessageFlags,
    SlashCommandBuilder,
} from "discord.js";
import { ErrorType, TaskDTO } from "@clanscore/shared";
import { replyWithDeferredError } from "../../../errors/dsicordAdapter";
import { api } from "../../../api/apiClient";

export const data = new SlashCommandBuilder()
    .setName("statustasks")
    .setDescription("Vorstand-Only: Übersicht der Tasks mit Deadline und Teilnehmeranzahl.");

type TaskStatus = {
    task: TaskDTO;
    statuses: string[];
};

export async function execute(interaction: CommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const allTasksResult = await api.getAllTasks();
    if (!allTasksResult.ok) {
        return replyWithDeferredError(interaction, {
            type: ErrorType.UnknownError,
            details: { message: "Could not fetch tasks" },
        });
    }

    const allTasks = allTasksResult.value;
    const now = new Date();
    const taskStatuses: TaskStatus[] = [];


    for (const task of allTasks) {
        const statuses: string[] = [];

        if (task.completed) {
            statuses.push("✅ Aufgabe beendet");
        } else {
            if (task.deadline) {
                const deadlineDate = new Date(task.deadline);
                if (deadlineDate <= now) {
                    statuses.push("🟠 Deadline erreicht");
                }
            }

            if (statuses.length === 0) {
                statuses.push("🔵 Aufgabe offen");
            }
        }

        taskStatuses.push({ task, statuses });
    }

    if (taskStatuses.length === 0) {
        return interaction.editReply({
            content: "ℹ️ Es gibt derzeit keine veröffentlichten Tasks.",
        });
    }

    const statusEmbed = new EmbedBuilder()
        .setTitle(`📊 Task-Status Übersicht (${taskStatuses.length})`)
        .setColor(0x0099ff)
        .setTimestamp();

    const fields: { name: string; value: string; inline: boolean }[] = [];

    for (const { task, statuses } of taskStatuses.slice(0, 25)) {
        const deadlineFormatted = task.deadline
            ? `<t:${Math.floor(new Date(task.deadline).getTime() / 1000)}:R>`
            : "Keine Deadline";
        
        const participantsResult = await api.getTaskParticipants(task.id);
        const participantCount = participantsResult.ok ? participantsResult.value.length : 0;
        
        fields.push({
            name: task.name,
            value: `Status: ${statuses.join(" / ")}\nTeilnehmer: ${participantCount}/${task.maxParticipants}\nPunkte: ${task.points}\nDeadline: ${deadlineFormatted}`,
            inline: true,
        });
    }

    statusEmbed.addFields(fields);

    const embeds: EmbedBuilder[] = [statusEmbed];
    
    if (taskStatuses.length > 25) {
        for (let i = 25; i < taskStatuses.length; i += 25) {
            const additionalEmbed = new EmbedBuilder()
                .setTitle(`📊 Task-Status Übersicht (Fortsetzung)`)
                .setColor(0x0099ff)
                .setTimestamp();

            const additionalFields: { name: string; value: string; inline: boolean }[] = [];
            for (const { task, statuses } of taskStatuses.slice(i, i + 25)) {
                const deadlineFormatted = task.deadline
                    ? `<t:${Math.floor(new Date(task.deadline).getTime() / 1000)}:R>`
                    : "Keine Deadline";
                
                const participantsResult = await api.getTaskParticipants(task.id);
                const participantCount = participantsResult.ok ? participantsResult.value.length : 0;
                
                additionalFields.push({
                    name: task.name,
                    value: `Status: ${statuses.join(" / ")}\nTeilnehmer: ${participantCount}/${task.maxParticipants}\nPunkte: ${task.points}\nDeadline: ${deadlineFormatted}`,
                    inline: true,
                });
            }

            additionalEmbed.addFields(additionalFields);
            embeds.push(additionalEmbed);
        }
    }

    return interaction.editReply({
        embeds: embeds,
    });
}
