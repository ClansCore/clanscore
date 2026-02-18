import {
    CommandInteraction,
    MessageFlags,
    SlashCommandBuilder,
} from "discord.js";
import { withRoleAccess } from "../../utils-discord/accessControl";
import { replyWithDeferredError } from "../../errors/dsicordAdapter";
import { api } from "../../api/apiClient";

export const data = new SlashCommandBuilder()
    .setName("score")
    .setDescription("Zeigt deinen aktuellen Punktestand.");

export async function handleScoreCommand(
    interaction: CommandInteraction,
): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const userDiscordId = interaction.user.id;

    const personDataResult = await api.getPersonDataByDiscordId(userDiscordId);
    if (!personDataResult.ok) {
        await replyWithDeferredError(interaction, personDataResult.error);
        return;
    }

    const score = personDataResult.value.person.score ?? 0;

    await interaction.editReply({
        content: 
`🏆 Dein aktuelles Punkte-Konto: **${score} Punkte**

Löse deine Punkte mit \`/rewards\` für Belohnungen ein.`,
    });
}

export const execute = withRoleAccess(handleScoreCommand, [
    "Vorstand",
    "Mitglied",
]);
