import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { getChannelByName, getCurrentChannel } from "../../utils-discord/guild";
import { withRoleAccess } from "../../utils-discord/accessControl";
import { replyWithDeferredError } from "../../errors/dsicordAdapter";
import { ChannelNames, ErrorType } from "@clanscore/shared";
import { config } from "../../config";

export const data = new SlashCommandBuilder()
    .setName("intro")
    .setDescription("Vorstand-Only: Stellt den Vereins-Bot vor.");

export async function handleIntro(
    interaction: CommandInteraction,
): Promise<void> {
    await interaction.deferReply();

    const guildId = interaction.guildId;
    const member = interaction.member;

    if (!guildId || !member || !("roles" in member)) {
        await replyWithDeferredError(interaction, {
            type: ErrorType.NotAServer,
        });
        return;
    }

    const currentChannel = await getCurrentChannel(interaction);
    if (!currentChannel.ok) {
        await replyWithDeferredError(interaction, currentChannel.error);
        return;
    }
    const currentChannelId = currentChannel.value.id;

    const botChannel = await getChannelByName(guildId, ChannelNames.COMMANDS);
    if (!botChannel.ok) {
        await replyWithDeferredError(interaction, botChannel.error);
        return;
    }
    const botChannelId = botChannel.value.id;

    const MANUAL_URI = config.MANUAL_URL;

    let introText = `
**Hallo, ich bin der Vereins-Discord-Bot!** 🤖
Ich unterstütze dich beim Vereins-Beitritt, Event-Infos, Punktesystem, Belohnungen und mehr.

Hier geht es zum [Benutzerhandbuch](${MANUAL_URI})\n\n`;

    if (currentChannelId === botChannelId) {
        introText += `ℹ️ Um alle Befehle zu sehen, schreibe \`/help\`.`;
    } else {
        introText += `ℹ️ Befehle funktionieren nur im vorgesehenen Kanal: <#${botChannel.value.id}>`;
    }

    await interaction.editReply({ content: introText });
}

export const execute = withRoleAccess(handleIntro, ["Vorstand"]);
