import {
    ComponentType,
    InteractionEditReplyOptions,
    InteractionReplyOptions,
    MessageFlags,
    MessagePayload,
    ModalSubmitInteraction,
} from "discord.js";
import {
    getChannelByName,
    sendPersonInfoToChannel,
} from "../../../utils-discord/guild";
import { parse as dateFnsParse } from "date-fns";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { replyWithDeferredError } from "../../../errors/dsicordAdapter";
import { 
    ChannelNames, 
    ErrorDetails, 
    ErrorType, 
    getErrorMessage, 
    PersonCreateDTO, 
    validateEmail, 
    validatePhone 
} from "@clanscore/shared";
import { api } from "../../../api/apiClient";
import { sendDm } from "../../../utils-discord/sendDm";
import { config } from "../../../config";

async function safeReply(
    interaction: ModalSubmitInteraction,
    options: string | MessagePayload | InteractionReplyOptions,
) {
    if (interaction.replied || interaction.deferred) {
        return interaction.editReply(options as InteractionEditReplyOptions);
    } else {
        return interaction.reply(options);
    }
}

export async function handleJoinModalStep2(
    interaction: ModalSubmitInteraction,
) {
    if (interaction.customId !== "join_modal_step2") return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId("accept_tos")
            .setLabel("Ich akzeptiere")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId("deny_tos")
            .setLabel("Ich akzeptiere nicht")
            .setStyle(ButtonStyle.Secondary),
    );

    const STATUTEN_URI = config.STATUTEN_URL;
    const TERMS_OF_SERVICE_URI = config.TERMS_OF_SERVICE_URL;

    await interaction.editReply({
        content: `
📄 **AGB & Datenschutz**

Mit deiner Bewerbung bestätigst du, dass du die folgenden Dokumente gelesen und akzeptiert hast:
* [📘 Vereinsstatuten](${STATUTEN_URI})
* [📄 Datenschutzrichtlinie](${TERMS_OF_SERVICE_URI})

🔐 Diese Einwilligung ist Voraussetzung für die Mitgliedschaft.`,
        components: [row],
    });

    const confirmation = await interaction.channel
        ?.awaitMessageComponent({
            componentType: ComponentType.Button,
            time: 120_000,
            filter: (btn) => btn.user.id === interaction.user.id,
        })
        .catch(() => null);

    if (!confirmation || confirmation.customId === "deny_tos") {
        await interaction.editReply({
            content: getErrorMessage({ type: ErrorType.TOSNotAccepted }),
            components: [],
        });
        return;
    }

    const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId("accept_tos")
            .setLabel("Ich akzeptiere")
            .setStyle(ButtonStyle.Success)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId("deny_tos")
            .setLabel("Ich akzeptiere nicht")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
    );

    await confirmation.update({
        content: confirmation.message.content,
        components: [disabledRow],
    });

    const step1DataResult = await api.getJoinTempDataByDiscordId(
        interaction.user.id
    );
    if (!step1DataResult.ok || step1DataResult.value.length === 0) {
        return interaction.editReply({
            content: getErrorMessage({ type: ErrorType.UserStep1DataNotFound }),
        });
    }

    const step1Data = step1DataResult.value[0];

    const guildId = interaction.guildId;
    if (!guildId) {
        return replyWithDeferredError(interaction, {
            type: ErrorType.NotAServer,
        });
    }

    const address = interaction.fields.getTextInputValue("address");
    const email = interaction.fields.getTextInputValue("email") || undefined;
    const phone = interaction.fields.getTextInputValue("phone") || undefined;

    if (email) {
        const validEmail = validateEmail(email);
        if (!validEmail.ok) {
            return safeReply(interaction, {
                content: getErrorMessage(validEmail.error),
                flags: MessageFlags.Ephemeral,
            });
        }
    }

    if (phone) {
        const validPhone = validatePhone(phone);
        if (!validPhone.ok) {
            return safeReply(interaction, {
                content: getErrorMessage(validPhone.error),
                flags: MessageFlags.Ephemeral,
            });
        }
    }

    const deleteResult = await api.deleteJoinTempData(interaction.user.id);
    if (!deleteResult.ok) {
        const errorDetails: ErrorDetails = {
            type: ErrorType.UnknownError,
            details: {
                message: `Konnte JoinTempData für ${interaction.user.id} nicht löschen.`,
            }
        };
        getErrorMessage(errorDetails);
    }

    const personData: PersonCreateDTO = {
        firstName: step1Data.step1Data.firstName,
        lastName: step1Data.step1Data.lastName,
        nickname: step1Data.step1Data.nickname || interaction.user.username,
        discordId: interaction.user.id,
        birthdate: dateFnsParse(
            step1Data.step1Data.birthdate,
            "dd.MM.yyyy",
            new Date(),
        ).toISOString(),
        address,
        email,
        phone,
        status: "Pending",
        hasPaid: false,
        score: 0,
    };

    const savedPerson = await api.savePerson(personData);
    if (!savedPerson.ok || !savedPerson.value.id) {
        return replyWithDeferredError(
            interaction,
            !savedPerson.ok
                ? savedPerson.error
                : { type: ErrorType.UserNotFound },
        );
    }

    const targetChannel = await getChannelByName(
        guildId,
        ChannelNames.APPLICATIONS,
    );
    if (!targetChannel.ok) {
        return replyWithDeferredError(interaction, targetChannel.error);
    }
    const message = await sendPersonInfoToChannel(
        targetChannel.value.id,
        savedPerson.value,
    );
    if (!message.ok) {
        return replyWithDeferredError(interaction, message.error);
    }

    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`accept_application:${savedPerson.value.id}`)
            .setLabel("Akzeptieren")
            .setStyle(ButtonStyle.Success)
            .setDisabled(false),
        new ButtonBuilder()
            .setCustomId(`deny_application:${savedPerson.value.id}`)
            .setLabel("Ablehnen")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(false),
    );

    await message.value.edit({
        components: [buttonRow],
    });

    const updatedPerson = await api.updatePersonApplicationMessageId(
        savedPerson.value.id.toString(),
        message.value.id,
    );
    if (!updatedPerson.ok) {
        return replyWithDeferredError(interaction, updatedPerson.error);
    }

    await sendDm(personData.discordId as string, interaction.client, {
        content: `
✅ <@${personData.discordId}> deine Bewerbung wurde erfolgreich eingereicht.

⚠️ **Zahlungsmethoden für den Mitgliederbeitrag**

Sobald der Mitgliederbeitrag auf unser Konto eingegangen ist, wirst du in unsere Vereinsliste eingetragen. 
Sollte deine Bewerbung abgelehnt werden, wird dir der Betrag selbstverständlich zurückerstattet!
- Normal: CHF 50.- / Jahr
- Minderjährig: CHF 30.- / Jahr`,
        embeds: [
            {
                color: 0xff9100,
                title: `**E-Banking - Vereinskonto** (keine Zusatzgebühren)`,
                description: `Verwende diese Informationen für deine Überweisung:`,
                fields: [
                    { name: "IBAN:", value: "CH28 8080 8005 6021 5670 9" },
                    { name: "IID (BC-Nr.):", value: "80808" },
                    { name: "SWIFT-BIC:", value: "RAIFCH22" },
                    { name: "Kontoinhaber:", value: "Electronic Gaming Swiss" },
                    { name: "PLZ/Ort:", value: "9000 St. Gallen" },
                    { name: "Zahlungskommentar:", value: "Vereinsmitglied" },
                ],
            },
            {
                color: 0xff9100,
                title: `**Twint** (CHF 2.- Zusatzgebühr)`,
                description: `[Direktlink zum Twint-Zahlfenster](https://pay.raisenow.io/xchbr)`,
                image: {
                    url: "https://cloud.egswiss.ch/apps/files_sharing/publicpreview/H86mBTcnbm3QFRL?file=/&fileId=547957&x=2560&y=1440&a=true&etag=2706be1ac51dc9e6c0e7e9f962f7e8a6",
                },
            },
        ],
    });
}
