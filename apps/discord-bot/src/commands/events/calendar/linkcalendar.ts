import {
    CommandInteraction,
    SlashCommandBuilder,
    MessageFlags,
    PermissionFlagsBits,
    EmbedBuilder,
    TextChannel,
} from "discord.js";
import { replyWithDeferredError } from "../../../errors/dsicordAdapter";
import { ChannelNames } from "@clanscore/shared";
import { api } from "../../../api/apiClient";

export const data = new SlashCommandBuilder()
    .setName("linkcalendar")
    .setDescription("Admins-Only: Verknüpfe den Google Vereins-Kalender.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: CommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guildId = interaction.guildId!;
    const urlRes = await api.generateCalendarLinkUrl(guildId);

    if (!urlRes.ok) {
        return replyWithDeferredError(interaction, urlRes.error);
    }

    if (interaction.guild) {
        const logChannel = interaction.guild.channels.cache.find(
            (c) => c.name === ChannelNames.BotLog && c.isTextBased(),
        ) as TextChannel | undefined;

        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle("📅 Kalender-Verknüpfung gestartet")
                .setColor(0xeb34c6)
                .setDescription(`Initiiert von <@${interaction.user.id}>`)
                .setTimestamp();

            await logChannel.send({ embeds: [logEmbed] }).catch( /* ignore */ );
        }
    }

    return interaction.editReply({
        content: `Klicke [hier](${urlRes.value.url}) um deinen Kalender zu verknüpfen!`,
    });
}
