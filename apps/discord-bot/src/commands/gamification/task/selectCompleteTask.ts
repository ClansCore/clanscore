import { StringSelectMenuInteraction, MessageFlags } from "discord.js";
import { replyWithDeferredError } from "../../../errors/dsicordAdapter";
import { api } from "../../../api/apiClient";
import { sendTaskCompletedInfoToChannel, getChannelByName } from "../../../utils-discord/guild";
import { ChannelNames, ErrorDetails, getErrorMessage } from "@clanscore/shared";

export async function handleSelectCompleteTask(
    interaction: StringSelectMenuInteraction,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const [action, userDiscordId] = interaction.customId.split(":");
    if (action !== "select_complete_task" || !userDiscordId) {
        return interaction.editReply({
            content: "❌ Ungültige Auswahl.",
        });
    }

    const selectedTaskId = interaction.values[0];
    if (!selectedTaskId) {
        return interaction.editReply({
            content: "❌ Keine Aufgabe ausgewählt.",
        });
    }

    const guildId = interaction.guildId;
    if (!guildId) {
        return interaction.editReply({
            content: "❌ Dieser Befehl kann nur in einem Server verwendet werden.",
        });
    }

    const result = await api.completeTask(selectedTaskId, userDiscordId);
    if (!result.ok) {
        return replyWithDeferredError(interaction, result.error);
    }

    const { task, person, participant, responsibleMention } = result.value;

    const channelResult = await getChannelByName(
        guildId,
        ChannelNames.COMPLETED_TASKS,
    );

    if (channelResult.ok) {
        const sendResult = await sendTaskCompletedInfoToChannel(
            channelResult.value.id,
            task,
            person,
            participant,
            responsibleMention || "",
        );
        
        if (!sendResult.ok) {
            const errorDetails: ErrorDetails = {
                type: sendResult.error.type,
                details: sendResult.error.details,
            };
            getErrorMessage(errorDetails);
        }
    }

    return interaction.editReply({
        content: "ℹ️ Die Aufgabe wurde als erledigt markiert. Der Vorstand wurde benachrichtigt.",
    });
}
