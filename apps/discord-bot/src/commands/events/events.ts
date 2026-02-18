import {
    CommandInteraction,
    MessageFlags,
    SlashCommandBuilder,
} from "discord.js";
import {
    ErrorType,
} from "@clanscore/shared";
import { replyWithDeferredError } from "../../errors/dsicordAdapter";
import { withRoleAccess } from "../../utils-discord/accessControl";
import { api } from "../../api/apiClient";
import { formatEvents } from "../../intergration/event/event-format.service";

export const data = new SlashCommandBuilder()
    .setName("events")
    .setDescription("Zeigt dir die bevorstehenden Vereins-Events.");

export async function handleEvents(
    interaction: CommandInteraction,
): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guildId = interaction.guildId;
    if (!guildId) {
        await replyWithDeferredError(interaction, {
            type: ErrorType.NotAServer,
        });
        return;
    }

    const eventsResult = await api.getUpcomingEvents(5);
    if (!eventsResult.ok) {
        await replyWithDeferredError(interaction, eventsResult.error);
        return;
    }

    const formattedEventsResult = formatEvents(eventsResult.value);
    if (!formattedEventsResult.ok) {
        await replyWithDeferredError(interaction, formattedEventsResult.error);
        return;
    }

    await interaction.editReply({ embeds: [formattedEventsResult.value] });
}

export const execute = withRoleAccess(handleEvents, ["Vorstand", "Mitglied"]);
