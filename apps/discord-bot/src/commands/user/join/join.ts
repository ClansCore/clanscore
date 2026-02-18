import {
    CommandInteraction,
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    MessageFlags,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    ComponentType,
    ActionRow,
    MessageActionRowComponent,
} from "discord.js";
import {
    getChannelByName,
    sendPersonInfoToChannel,
} from "../../../utils-discord/guild";
import { replyWithError } from "../../../errors/dsicordAdapter";
import { ChannelNames, ErrorType, getErrorMessage, ErrorDetails } from "@clanscore/shared";
import { api } from "../../../api/apiClient";
import { resetJoinRequest } from "../../../intergration/user-discord.service";

export const data = new SlashCommandBuilder()
    .setName("join")
    .setDescription("Bewirb dich als Vereinsmitglied.");

export async function execute(interaction: CommandInteraction) {
    const userDiscordId = interaction.user.id;
    const existingPerson = await api.getPersonByDiscordId(userDiscordId);

    if (existingPerson.ok) {
        const person = existingPerson.value;

        if (person.status === "ToBeDeleted") {
            const guild = interaction.guild;
            const guildId = interaction.guildId;

            if (!guild || !guildId) {
                return interaction.reply({
                    content: getErrorMessage({ type: ErrorType.NotAServer }),
                    flags: MessageFlags.Ephemeral,
                });
            }

            const channel = guild.channels.cache.find(
                (c) =>
                    c.name === ChannelNames.APPLICATIONS &&
                    c.type === ChannelType.GuildText,
            );

            const personMessageId = person.applicationMessageId;

            if (channel?.isTextBased() && personMessageId) {
                try {
                    const message = await channel.messages.fetch(personMessageId);

                    const hasActiveButtons = message.components.some((row) =>
                        (row as ActionRow<MessageActionRowComponent>).components.some(
                            (c) => c.type === ComponentType.Button && !c.disabled,
                        ),
                    );

                    if (hasActiveButtons) {
                        return interaction.reply({
                            content: getErrorMessage({
                                type: ErrorType.UserApplicationPending,
                            }),
                            flags: MessageFlags.Ephemeral,
                        });
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    const errorDetails: ErrorDetails = {
                        type: ErrorType.ApplicationMessageFetchError,
                        details: {
                            messageId: personMessageId,
                            channelName: ChannelNames.APPLICATIONS,
                            message: `Bewerbungsnachricht nicht auffindbar: ${errorMessage}`,
                        }
                    };
                    getErrorMessage(errorDetails);
                    await replyWithError(interaction, {
                        type: ErrorType.ApplicationMessageFetchError,
                        details: {
                            messageId: personMessageId,
                            channelName: ChannelNames.APPLICATIONS,
                        },
                    });
                }
            }

            await resetJoinRequest(existingPerson.value, interaction.guild);

            const targetChannel = await getChannelByName(
                guildId,
                ChannelNames.APPLICATIONS,
            );
            if (!targetChannel.ok) {
                return interaction.reply({
                    content: getErrorMessage(targetChannel.error),
                    flags: MessageFlags.Ephemeral,
                });
            }

            const message = await sendPersonInfoToChannel(
                targetChannel.value.id,
                person,
            );
            if (!message.ok) {
                return interaction.reply({
                    content: getErrorMessage({
                        type: ErrorType.ReapplicationError,
                    }),
                    flags: MessageFlags.Ephemeral,
                });
            }

            const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId(`accept_application:${person.id}`)
                    .setLabel("Akzeptieren")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`deny_application:${person.id}`)
                    .setLabel("Ablehnen")
                    .setStyle(ButtonStyle.Danger),
            );

            await message.value.edit({ components: [buttonRow] });

            await api.updatePersonApplicationMessageId(
                person.id.toString(),
                message.value.id,
            );

            return interaction.reply({
                content:
                    "✅ Deine Wiederaufnahme wurde dem Vorstand zur Bestätigung vorgelegt. Bitte warte auf eine Rückmeldung.",
                flags: MessageFlags.Ephemeral,
            });
        }

        return interaction.reply({
            content: getErrorMessage({ type: ErrorType.UserAlreadyExists }),
            flags: MessageFlags.Ephemeral,
        });
    }

    const joinTempData = await api.getJoinTempDataByDiscordId(userDiscordId);
    if (joinTempData.ok && joinTempData.value.length > 0) {
        return interaction.reply({
            content: getErrorMessage({ type: ErrorType.UserApplicationPending }),
            flags: MessageFlags.Ephemeral,
        });
    }

    try {
        const modal = new ModalBuilder()
            .setCustomId("join_modal_step1")
            .setTitle("Vereinsbeitritt - Schritt 1");

        const firstnameInput = new TextInputBuilder()
            .setCustomId("firstname")
            .setLabel("Vorname")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(50);

        const lastnameInput = new TextInputBuilder()
            .setCustomId("lastname")
            .setLabel("Nachname")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(50);

        const nicknameInput = new TextInputBuilder()
            .setCustomId("nickname")
            .setLabel("Nickname (optional)")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(50);

        const birthdateInput = new TextInputBuilder()
            .setCustomId("birthdate")
            .setLabel("Geburtsdatum (DD.MM.YYYY)")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(10);

        modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(firstnameInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(lastnameInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(nicknameInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(birthdateInput),
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
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp({
                content: getErrorMessage({
                    type: ErrorType.ModalOpeningFailure,
                }),
                flags: MessageFlags.Ephemeral,
            });
        } else {
            await interaction.reply({
                content: getErrorMessage({
                    type: ErrorType.ModalOpeningFailure,
                }),
                flags: MessageFlags.Ephemeral,
            });
        }
    }
}
