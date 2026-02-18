import {
    CommandInteraction,
    MessageFlags,
    SlashCommandBuilder,
} from "discord.js";
import { replyWithDeferredError } from "../../errors/dsicordAdapter";
import { withRoleAccess } from "../../utils-discord/accessControl";
import { api } from "../../api/apiClient";

export const data = new SlashCommandBuilder()
    .setName("ping")
    .setDescription(
        "Vorstand-Only: Testet die Verbindung zum Discord-Bot und Datenbank.",
    );

export async function handlePing(
    interaction: CommandInteraction,
): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const result = await api.getFirstUser();

    if (result.ok) {
        await interaction.editReply({
            content: `Der Bot und die Verbindung zur Datenbank funktioniert.`,
        });
        return;
    }

    await replyWithDeferredError(interaction, result.error);
}

export const execute = withRoleAccess(handlePing, ["Vorstand"]);
