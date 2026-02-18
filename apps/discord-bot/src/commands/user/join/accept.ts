import { ChatInputCommandInteraction, ButtonInteraction } from "discord.js";
import { disableButtons } from "../../../utils-discord/guild";
import { replyWithDeferredError } from "../../../errors/dsicordAdapter";
import { ErrorType } from "@clanscore/shared";
import { api } from "../../../api/apiClient";

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    if (!interaction.guild) return replyWithDeferredError(interaction, { type: ErrorType.GuildNotFound });

    const personId = interaction.options.getString("id", true);
    const roleName = interaction.options.getString("role", true);

    const role = await api.getRoleByName(roleName);
    if (!role.ok || !role.value.id) return replyWithDeferredError(interaction, { type: ErrorType.RoleNotFound });

    const result = await api.acceptApplication(personId, role.value.id, interaction.user.id);
    if (!result.ok) return replyWithDeferredError(interaction, result.error);

    return interaction.editReply({
        content: `✅ ${result.value.person.nickname ?? "Mitglied"} wurde als **${roleName}** akzeptiert.`,
    });
}

export async function handleAcceptApplicationButton(interaction: ButtonInteraction) {
    const [action, personId] = interaction.customId.split(":");
    if (action !== "accept_application") return;

    await interaction.deferReply();
    if (!interaction.guild) return replyWithDeferredError(interaction, { type: ErrorType.GuildNotFound });

    const role = await api.getRoleByName("Mitglied");
    if (!role.ok || !role.value.id) return replyWithDeferredError(interaction, { type: ErrorType.RoleNotFound });

    const result = await api.acceptApplication(personId, role.value.id, interaction.user.id);
    if (!result.ok) return replyWithDeferredError(interaction, result.error);

    await interaction.editReply({
        content: `✅ ${result.value.person.nickname} wurde als **Mitglied** akzeptiert und hat die Rolle erhalten.`,
    });

    const message = await interaction.message.fetch();
    await message.edit({
        components: disableButtons(message, ["accept_application", "deny_application"]),
    });
}
