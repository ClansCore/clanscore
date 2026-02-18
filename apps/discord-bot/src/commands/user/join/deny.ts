import { ChatInputCommandInteraction, ButtonInteraction } from "discord.js";
import { replyWithDeferredError } from "../../../errors/dsicordAdapter";
import { ErrorType } from "@clanscore/shared";
import { api } from "../../../api/apiClient";
import { disableButtons } from "../../../utils-discord/guild";

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    if (!interaction.guild)
        return replyWithDeferredError(interaction, { type: ErrorType.GuildNotFound });

    const personId = interaction.options.getString("id", true);

    const result = await api.denyApplication(personId, interaction.user.id);
    if (!result.ok) return replyWithDeferredError(interaction, result.error);

    return interaction.editReply({
        content: `🚫 Die Bewerbung von **${result.value.nickname ?? "Mitglied"}** wurde abgelehnt.`,
    });
}

export async function handleDenyApplicationButton(interaction: ButtonInteraction) {
    const [action, personId] = interaction.customId.split(":");
    if (action !== "deny_application") return;

    await interaction.deferReply();
    if (!interaction.guild)
        return replyWithDeferredError(interaction, { type: ErrorType.GuildNotFound });

    const result = await api.denyApplication(personId, interaction.user.id);
    if (!result.ok) return replyWithDeferredError(interaction, result.error);

    await interaction.editReply({
        content: `🚫 Die Bewerbung von **${result.value.nickname ?? "Mitglied"}** wurde abgelehnt.`,
    });

    const message = await interaction.message.fetch();
    await message.edit({
        components: disableButtons(message, ["accept_application", "deny_application"]),
    });
}
