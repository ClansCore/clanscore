import {
    CommandInteraction,
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    MessageFlags,
    ModalSubmitInteraction,
    EmbedBuilder,
    TextChannel,
} from "discord.js";
import { parse as dateFnsParse, format as dateFnsFormat } from "date-fns";
import { withRoleAccess } from "../../utils-discord/accessControl";
import { updateLeaderboards } from "../../intergration/leaderboard-discord.service";
import { replyWithDeferredError } from "../../errors/dsicordAdapter";
import { ErrorType, ErrorDetails, Result, validateDate, validateEndDateAfterStartDate, validatePositiveInteger, ChannelNames, getErrorMessage } from "@clanscore/shared";
import { api } from "../../api/apiClient";

export const data = new SlashCommandBuilder()
    .setName("createleaderboard")
    .setDescription("Vorstand-Only: Erstelle eine neue Rangliste.");

function createLeaderboardModal(): ModalBuilder {
    const modal = new ModalBuilder()
        .setCustomId("create_leaderboard_modal")
        .setTitle("Erstelle eine Rangliste");

    const nameInput = new TextInputBuilder()
        .setCustomId("name")
        .setLabel("Name")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(50);

    const descriptionInput = new TextInputBuilder()
        .setCustomId("description")
        .setLabel("Beschreibung")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(200);

    const startDateInput = new TextInputBuilder()
        .setCustomId("startDate")
        .setLabel("Startdatum (DD.MM.YYYY) (optional)")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(10);

    const endDateInput = new TextInputBuilder()
        .setCustomId("endDate")
        .setLabel("Enddatum (DD.MM.YYYY)")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(10);

    const numberOfVisibleEntriesInput = new TextInputBuilder()
        .setCustomId("numberOfVisibleEntries")
        .setLabel("Anzahl der sichtbaren Einträge")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(5);

    modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(startDateInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(endDateInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
            numberOfVisibleEntriesInput,
        ),
    );

    return modal;
}

export async function handleCreateLeaderboardCommand(
    interaction: CommandInteraction,
): Promise<void> {
    try {
        const modal = createLeaderboardModal();
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
        await replyWithDeferredError(interaction, {
            type: ErrorType.ModalOpeningFailure,
        });
    }
}

async function validateLeaderboardInput(
    startDate: string,
    endDate: string,
    numberVisibleEntries: string,
): Promise<Result<
    { startDateIso: string | null; endDateIso: string; numberVisibleEntries: number },
    ErrorDetails
>> {
    if (startDate && !validateDate(startDate).ok) {
        return {
            ok: false,
            error: { type: ErrorType.NotAValidDateFormat },
        };
    }
    if (!validateDate(endDate).ok) {
        return {
            ok: false,
            error: { type: ErrorType.NotAValidDateFormat },
        };
    }

    const endAfterStartResult = validateEndDateAfterStartDate(
        startDate || endDate,
        endDate,
    );
    if (!endAfterStartResult.ok) {
        return {
            ok: false,
            error: endAfterStartResult.error,
        };
    }

    const validateNumberResult = validatePositiveInteger(numberVisibleEntries);
    if (!validateNumberResult.ok) {
        return {
            ok: false,
            error: validateNumberResult.error,
        };
    }

    const startDateIso = startDate
        ? dateFnsParse(startDate, "dd.MM.yyyy", new Date()).toISOString()
        : null;
    const endDateIso = dateFnsParse(endDate, "dd.MM.yyyy", new Date()).toISOString();

    return {
        ok: true,
        value: {
            startDateIso,
            endDateIso,
            numberVisibleEntries: validateNumberResult.value,
        },
    };
}

export async function handleCreateLeaderboardModal(
    interaction: ModalSubmitInteraction,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const name = interaction.fields.getTextInputValue("name");
    const description = interaction.fields.getTextInputValue("description");
    const startDate = interaction.fields.getTextInputValue("startDate");
    const endDate = interaction.fields.getTextInputValue("endDate");
    const numberVisibleEntries = interaction.fields.getTextInputValue(
        "numberOfVisibleEntries",
    );

    const userRes = await api.getPersonByDiscordId(interaction.user.id);
    if (!userRes.ok || !userRes.value.id) {
        return replyWithDeferredError(interaction, {
            type: ErrorType.UserNotFound,
        });
    }

    const validationResult = await validateLeaderboardInput(
        startDate,
        endDate,
        numberVisibleEntries,
    );
    if (!validationResult.ok) {
        return replyWithDeferredError(interaction, validationResult.error);
    }

    const payload = {
        name,
        description,
        ...validationResult.value,
        createdByPersonId: userRes.value.id,
    };

    const saveLeaderboardResult = await api.createLeaderboard(payload);
    if (!saveLeaderboardResult.ok) {
        return replyWithDeferredError(interaction, saveLeaderboardResult.error);
    }

    const updateLeaderboardsInChannelResult = await updateLeaderboards();
    if (!updateLeaderboardsInChannelResult.ok) {
        return replyWithDeferredError(
            interaction,
            updateLeaderboardsInChannelResult.error,
        );
    }

    if (interaction.guild) {
        const logChannel = interaction.guild.channels.cache.find(
            (c) => c.name === ChannelNames.BotLog && c.isTextBased(),
        ) as TextChannel | undefined;

        if (logChannel) {
            const startDateStr = validationResult.value.startDateIso
                ? dateFnsFormat(new Date(validationResult.value.startDateIso), "dd.MM.yyyy")
                : "Kein Startdatum";
            const endDateStr = dateFnsFormat(new Date(validationResult.value.endDateIso), "dd.MM.yyyy");

            const logEmbed = new EmbedBuilder()
                .setTitle("🏆 Rangliste erstellt")
                .setColor(0xffd900)
                .setDescription(`Erstellt von <@${interaction.user.id}>`)
                .addFields(
                    { name: "Rangliste", value: name, inline: false },
                    { name: "Startdatum", value: startDateStr, inline: true },
                    { name: "Enddatum", value: endDateStr, inline: true },
                    { name: "Sichtbare Einträge", value: `${validationResult.value.numberVisibleEntries}`, inline: true },
                )
                .setFooter({ text: `Leaderboard-ID: ${saveLeaderboardResult.value.id}` })
                .setTimestamp();

            if (description) {
                logEmbed.addFields({
                    name: "Beschreibung",
                    value: description.length > 1024
                        ? description.substring(0, 1021) + "..."
                        : description,
                    inline: false,
                });
            }

            await logChannel.send({ embeds: [logEmbed] }).catch( /* ignore */ );
        }
    }

    return interaction.editReply({
        content: "✅ Deine Rangliste wurde erfolgreich erstellt.",
    });
}

export const execute = withRoleAccess(handleCreateLeaderboardCommand, [
    "Vorstand",
]);
