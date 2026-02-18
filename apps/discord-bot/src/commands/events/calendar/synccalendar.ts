import {
    CommandInteraction,
    MessageFlags,
    SlashCommandBuilder,
    EmbedBuilder,
    TextChannel,
} from "discord.js";
import { ErrorType, ChannelNames } from "@clanscore/shared";
import { replyWithDeferredError } from "../../../errors/dsicordAdapter";
import { withRoleAccess } from "../../../utils-discord/accessControl";
import { performFullCalendarSync } from "../../../discord.handler";

export const data = new SlashCommandBuilder()
    .setName("synccalendar")
    .setDescription(
        "Admins-Only: Synchronisiere Kalender-Events mit Discord-Events.",
    );

export async function handleSyncCalendar(
    interaction: CommandInteraction,
): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guild = interaction.guild;
    if (!guild) {
        await replyWithDeferredError(interaction, {
            type: ErrorType.NotAServer,
        });
        return;
    }

    // Perform full calendar sync (Google ↔ DB ↔ Discord)
    const syncStats = await performFullCalendarSync(guild);

    if (!syncStats) {
        await replyWithDeferredError(interaction, {
            type: ErrorType.UnknownError,
            details: { message: "Synchronisation fehlgeschlagen" }
        });
        return;
    }

    const statsMessage = syncStats.synced !== undefined 
        ? `\n📊 Synced: ${syncStats.synced}, Created: ${syncStats.created}, Deleted: ${syncStats.deleted}`
        : "";

    await interaction.editReply({
        content: `🗓️ Die Events wurden erfolgreich synchronisiert.${statsMessage}`,
    });

    const logChannel = guild.channels.cache.find(
        (c) => c.name === ChannelNames.BotLog && c.isTextBased(),
    ) as TextChannel | undefined;

    if (logChannel) {
        const logEmbed = new EmbedBuilder()
            .setTitle("🗓️ Manuelle Kalender-Synchronisierung")
            .setColor(0x34dbca)
            .setDescription(`Ausgeführt von <@${interaction.user.id}>`)
            .setTimestamp();

        if (syncStats.synced !== undefined) {
            logEmbed.addFields(
                { name: "🔄 Synchronisiert", value: `${syncStats.synced}`, inline: true },
                { name: "➕ Erstellt", value: `${syncStats.created ?? 0}`, inline: true },
                { name: "🗑️ Gelöscht", value: `${syncStats.deleted ?? 0}`, inline: true },
            );
        }

        await logChannel.send({ embeds: [logEmbed] }).catch(() => { /* ignore */ });
    }
}

export const execute = withRoleAccess(handleSyncCalendar, ["Vorstand"]);
