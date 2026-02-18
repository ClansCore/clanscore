import {
    ButtonInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    MessageFlags,
} from "discord.js";
import { ErrorType, getErrorMessage, ErrorDetails } from "@clanscore/shared";
import { api } from "../../../api/apiClient";

async function replyOrEdit(
    interaction: ButtonInteraction,
    content: string,
    ephemeral = true,
) {
    if (interaction.deferred || interaction.replied) {
        return interaction.editReply({ content });
    } else {
        return interaction.reply({
            content,
            flags: ephemeral ? MessageFlags.Ephemeral : undefined,
        });
    }
}

export async function handleJoinContinue(interaction: ButtonInteraction) {
    try {
        if (interaction.customId !== "join_continue_step2") return;

        const step1Data = await api.getJoinTempDataByDiscordId(interaction.user.id);
        if (!step1Data.ok || step1Data.value.length === 0) {
            return replyOrEdit(
                interaction,
                getErrorMessage({ type: ErrorType.UserStep1DataNotFound }),
            );
        }

        const modal = new ModalBuilder()
            .setCustomId("join_modal_step2")
            .setTitle("Vereinsbeitritt - Schritt 2");

        const addressInput = new TextInputBuilder()
            .setCustomId("address")
            .setLabel("Adresse")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(100);

        const emailInput = new TextInputBuilder()
            .setCustomId("email")
            .setLabel("Email")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(50);

        const phoneInput = new TextInputBuilder()
            .setCustomId("phone")
            .setLabel("Telefonnummer")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(20);

        modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                addressInput,
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(emailInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(phoneInput),
        );

        await interaction.showModal(modal);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDetails: ErrorDetails = {
            type: ErrorType.ModalOpeningFailure,
            details: {
                message: `Error showing modal: ${errorMessage}`,
            }
        };
        getErrorMessage(errorDetails);
        await replyOrEdit(
            interaction,
            getErrorMessage({ type: ErrorType.ModalOpeningFailure }),
        );
    }
}
