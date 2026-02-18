import {
    ModalSubmitInteraction,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
} from "discord.js";
import { getErrorMessage, validateDate } from "@clanscore/shared";
import type { JoinDataTempInputDTO, JoinTempStep1DTO } from "@clanscore/shared";
import { api } from "../../../api/apiClient";

export async function handleJoinModalStep1(interaction: ModalSubmitInteraction) {
    if (interaction.customId !== "join_modal_step1") return;

    const firstName = interaction.fields.getTextInputValue("firstname");
    const lastName  = interaction.fields.getTextInputValue("lastname");
    const nickname  = interaction.fields.getTextInputValue("nickname") || interaction.user.username;
    const birthdate = interaction.fields.getTextInputValue("birthdate"); // "dd.MM.yyyy"

    const valid = validateDate(birthdate);
    if (!valid.ok) {
        return interaction.reply({
            content: getErrorMessage(valid.error),
            flags: MessageFlags.Ephemeral,
        });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const step1Data: JoinTempStep1DTO = { firstName, lastName, nickname, birthdate };
    // const payload: JoinDataTempInputDTO = {
    //     discordId: interaction.user.id,
    //     step1Data
    // };

    const res = await api.updateJoinTempData(interaction.user.id, step1Data);
    if (!res.ok) {
        return interaction.editReply({ content: getErrorMessage(res.error) });
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId("join_continue_step2")
            .setLabel("Weiter zu Schritt 2")
            .setStyle(ButtonStyle.Primary),
    );

    await interaction.editReply({
        content: "✅ Schritt 1 abgeschlossen! Klicke auf den Button, um mit Schritt 2 weiterzumachen.",
        components: [row],
    });
}
