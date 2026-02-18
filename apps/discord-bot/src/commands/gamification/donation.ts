import {
    CommandInteraction,
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    MessageFlags,
    ModalSubmitInteraction,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    EmbedBuilder,
    TextChannel,
} from "discord.js";
import {
    validateDate,
    validatePositiveInteger,
    validatePositiveNumberWithMaxTwoDecimals,
    getErrorMessage,
    ErrorType,
    PersonDTO,
    DonationCreateDTO,
    TransactionCreateDTO,
    ErrorDetails,
} from "@clanscore/shared";
import { replyWithDeferredError } from "../../errors/dsicordAdapter";
import { parse as dateFnsParse } from "date-fns";
import { withRoleAccess } from "../../utils-discord/accessControl";
import { updateLeaderboards } from "../../intergration/leaderboard-discord.service";
import { api } from "../../api/apiClient";
import { getChannelByName } from "../../utils-discord/guild";
import { ChannelNames } from "@clanscore/shared";

export const data = new SlashCommandBuilder()
    .setName("donation")
    .setDescription(
        "Vorstand-Only: Protokolliere eine Spende und vergib entsprechend Punkte.",
    );

export async function handleDonationCommand(
    interaction: CommandInteraction,
): Promise<void> {
    try {
        const modal = new ModalBuilder()
            .setCustomId("donation_modal")
            .setTitle("Spende protokollieren");

        const amountInput = new TextInputBuilder()
            .setCustomId("amount")
            .setLabel("Höhe der Spende in CHF")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(50);

        const dateInput = new TextInputBuilder()
            .setCustomId("date")
            .setLabel("Datum der Spende")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(10);

        const pointInput = new TextInputBuilder()
            .setCustomId("points")
            .setLabel("Punkte für den Spender")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(50);

        const notesInput = new TextInputBuilder()
            .setCustomId("notes")
            .setLabel("Interne Notizen")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setMaxLength(200);

        modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(amountInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(dateInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(pointInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(notesInput),
        );

        await (interaction as CommandInteraction).showModal(modal);
    } catch (error) {
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

export async function handleDonationModal(interaction: ModalSubmitInteraction) {
    if (interaction.customId !== "donation_modal") return;
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const amount = interaction.fields.getTextInputValue("amount");
    const points = interaction.fields.getTextInputValue("points");
    const date = interaction.fields.getTextInputValue("date");
    const notes = interaction.fields.getTextInputValue("notes");

    const validateAmountResult =
        validatePositiveNumberWithMaxTwoDecimals(amount);
    if (!validateAmountResult.ok) {
        return replyWithDeferredError(interaction, validateAmountResult.error);
    }

    const validatePointsResult = validatePositiveInteger(points);
    if (!validatePointsResult.ok) {
        return replyWithDeferredError(interaction, validatePointsResult.error);
    }

    const validateDateResult = validateDate(date);
    if (!validateDateResult.ok) {
        return replyWithDeferredError(interaction, validateDateResult.error);
    }

    const personResult = await api.getPersonByDiscordId(
        interaction.user.id,
    );
    if (!personResult.ok) {
        return replyWithDeferredError(interaction, personResult.error);
    }

    const donationData: DonationCreateDTO = {
        amount: Number(amount),
        date: dateFnsParse(date, "dd.MM.yyyy", new Date()).toISOString(),
        notes,
        verifiedBy: personResult.value.id,
    };

    const saveDonationResult =
        await api.saveDonation(donationData);
    if (!saveDonationResult.ok) {
        return replyWithDeferredError(interaction, saveDonationResult.error);
    }

    const usersResult = await api.getAllPersons();
    if (!usersResult.ok) {
        return replyWithDeferredError(interaction, usersResult.error);
    }

    const MAX_SELECT_OPTIONS = 25;
    const validPersons = usersResult.value
        .filter((person: PersonDTO) => person.firstName && person.lastName && person.id)
        .slice(0, MAX_SELECT_OPTIONS);

    if (validPersons.length === 0) {
        return replyWithDeferredError(interaction, {
            type: ErrorType.UserNotFound,
            details: { message: "Keine gültigen Personen gefunden für die Auswahl" }
        });
    }

    const optionsResponsible = validPersons.map((person: PersonDTO) => {
        const name = `${person.firstName} ${person.lastName}`.trim();
        const nickname = person.nickname ? ` - ${person.nickname}` : "";
        const label = `${name}${nickname}`.substring(0, 100);
        
        return {
            label: label || `Person ${person.id}`,
            value: person.id.toString(),
        };
    });

    if (usersResult.value.length > MAX_SELECT_OPTIONS) {
        console.warn(`[DONATION] Warning: ${usersResult.value.length} persons found, but only ${MAX_SELECT_OPTIONS} can be shown in the select menu`);
    }

    const donorSelect = new StringSelectMenuBuilder()
        .setCustomId(`select_donator:${saveDonationResult.value.id}:${points}`)
        .setPlaceholder("Wähle den Spender aus.")
        .addOptions(optionsResponsible);

    const rowDonor =
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            donorSelect,
        );

    return interaction.editReply({
        content: "Füge den Spender hinzu.",
        components: [rowDonor],
    });
}

export async function handleSelectDonor(
    interaction: StringSelectMenuInteraction,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const donationId = interaction.customId.split(":")[1];
    const points = Number(interaction.customId.split(":")[2]);
    const selectedUserId = interaction.values[0];

    if (!donationId) {
        return replyWithDeferredError(interaction, {
            type: ErrorType.DonationNotFound,
        });
    }

    if (!selectedUserId) {
        return replyWithDeferredError(interaction, {
            type: ErrorType.UserNotFound,
        });
    }

    const checkIfTransactionAlreadyExistsResult =
        await api.getTransactionByDonationId(donationId);
    if (
        !checkIfTransactionAlreadyExistsResult.ok &&
        checkIfTransactionAlreadyExistsResult.error.type !==
            ErrorType.TransactionNotFound
    ) {
        return replyWithDeferredError(
            interaction,
            checkIfTransactionAlreadyExistsResult.error,
        );
    }

    if (checkIfTransactionAlreadyExistsResult.ok) {
        return replyWithDeferredError(interaction, {
            type: ErrorType.DonationAlreadyProcessed,
        });
    }

    const personResult = await api.getPerson(selectedUserId);
    if (!personResult.ok) {
        return replyWithDeferredError(interaction, personResult.error);
    }

    const updateDonationResult =
        await api.updateDonationDonor(donationId, selectedUserId);
    if (!updateDonationResult.ok) {
        return replyWithDeferredError(interaction, updateDonationResult.error);
    }

    const transactionData: TransactionCreateDTO = {
        amount: points,
        personId: updateDonationResult.value.donatorId!,
        donationId: updateDonationResult.value.id,
        status: "Done",
    };

    const transactionResult =
        await api.saveTransaction(transactionData);
    if (!transactionResult.ok) {
        return replyWithDeferredError(interaction, transactionResult.error);
    }

    const donatorId = updateDonationResult.value.donatorId!.toString();
    const incrementPersonScoreResult =
        await api.incrementPersonPoints(
            donatorId,
            transactionResult.value.amount,
        );
    if (!incrementPersonScoreResult.ok) {
        return replyWithDeferredError(
            interaction,
            incrementPersonScoreResult.error,
        );
    }

    const incrementLeaderboardsResult =
        await api.incrementActiveLeaderboardEntriesPoints(
            transactionResult.value,
        );
    if (!incrementLeaderboardsResult.ok) {
        return replyWithDeferredError(
            interaction,
            incrementLeaderboardsResult.error,
        );
    }

    const updateLeaderboardsInChannelResult = await updateLeaderboards();
    if (!updateLeaderboardsInChannelResult.ok) {
        return updateLeaderboardsInChannelResult;
    }

    try {
        if (!personResult.value.discordId)
            throw new Error("No discordId found");
        const member = await interaction.client.users.fetch(
            personResult.value.discordId,
        );
        await member.send(
`❤️ Vielen Dank für deine Spende von **CHF ${updateDonationResult.value.amount}**!
💵 **${transactionResult.value.amount} Punkte** wurden deinem Punktestand hinzugefügt.`
        );
    } catch {
        const errorDetails: ErrorDetails = {
            type: ErrorType.MessageNotSend,
            details: {
                message: `DM an ${personResult.value.nickname} fehlgeschlagen - sende keine Nachricht.`,
            }
        };
        getErrorMessage(errorDetails);
    }

    if (interaction.guildId) {
        const targetChannel = await getChannelByName(
            interaction.guildId,
            ChannelNames.BotLog,
        );
        if (targetChannel.ok) {
            const channel = targetChannel.value as TextChannel;
            const donationDate = updateDonationResult.value.date 
                ? new Date(updateDonationResult.value.date).toLocaleDateString("de-CH")
                : "Unbekannt";
            
            let verifiedByPerson: PersonDTO | null = null;
            if (updateDonationResult.value.verifiedBy) {
                const verifiedByResult = await api.getPerson(updateDonationResult.value.verifiedBy);
                if (verifiedByResult.ok) {
                    verifiedByPerson = verifiedByResult.value;
                }
            }
            
            const embed = new EmbedBuilder()
                .setTitle("💰 Spende protokolliert")
                .setColor(0xff9500)
                .addFields(
                    {
                        name: "Spender",
                        value: `${personResult.value.firstName} ${personResult.value.lastName}${personResult.value.nickname ? ` (${personResult.value.nickname})` : ""}`,
                        inline: true,
                    },
                    {
                        name: "Betrag",
                        value: `${updateDonationResult.value.amount} CHF`,
                        inline: true,
                    },
                    {
                        name: "Punkte",
                        value: `${transactionResult.value.amount}`,
                        inline: true,
                    },
                    {
                        name: "Datum",
                        value: donationDate,
                        inline: true,
                    },
                    {
                        name: "Protokolliert von",
                        value: verifiedByPerson 
                            ? verifiedByPerson.discordId
                                ? `<@${verifiedByPerson.discordId}>`
                                : `${verifiedByPerson.firstName} ${verifiedByPerson.lastName}${verifiedByPerson.nickname ? ` (${verifiedByPerson.nickname})` : ""}`
                            : "Unbekannt",
                        inline: true,
                    },
                    {
                        name: "Interne Notiz",
                        value: updateDonationResult.value.notes || "Keine Notizen",
                        inline: false,
                    },
                )
                .setTimestamp();

            try {
                await channel.send({ embeds: [embed] });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                const errorDetails: ErrorDetails = {
                    type: ErrorType.MessageNotSend,
                    details: {
                        message: `Failed to send donation notification to bot-aufgaben channel: ${errorMessage}`,
                    }
                };
                getErrorMessage(errorDetails);
            }
        }
    }

    return interaction.editReply({
        content: "✅ Die Spende wurde erfolgreich verarbeitet.",
    });
}

export const execute = withRoleAccess(handleDonationCommand, ["Vorstand"]);
