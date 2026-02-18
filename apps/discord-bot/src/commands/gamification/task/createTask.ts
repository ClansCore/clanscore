import {
    ModalSubmitInteraction,
    ActionRowBuilder,
    MessageFlags,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    ButtonBuilder,
    ButtonStyle,
    ButtonInteraction,
    EmbedBuilder,
    TextChannel,
} from "discord.js";
import {
    EventDetailsDTO,
    PersonSummaryDTO,
    validateDate,
    validatePositiveInteger,
    ErrorType,
    getErrorMessage,
    ChannelNames,
    TaskDTO,
    ErrorDetails,
} from "@clanscore/shared";
import { replyWithDeferredError } from "../../../errors/dsicordAdapter";
import { parse as dateFnsParse, format as dateFnsFormat } from "date-fns";
import { api } from "../../../api/apiClient";
import { getChannelByName } from "../../../utils-discord/guild";
import { config } from "../../../config";

export async function handleCreateTask(interaction: ModalSubmitInteraction) {
    if (!interaction.customId.startsWith("create_task_modal_step1")) return;
    
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Extract taskTypeId and expense info from customId
        // Format: "create_task_modal_step1:taskTypeId" or "create_task_modal_step1:taskTypeId:expense:basePoints"
        const parts = interaction.customId.split(":");
        const taskTypeId = parts.length > 1 && parts[1] !== "" ? parts[1] : null;
        const isExpense = parts.length > 2 && parts[2] === "expense";
        const basePoints = isExpense && parts.length > 3 ? parseInt(parts[3], 10) : undefined;

        if (isExpense && (basePoints === undefined || isNaN(basePoints))) {
            return replyWithDeferredError(interaction, {
                type: ErrorType.ValidationError,
                details: { message: "Invalid task type configuration" },
            });
        }

        let name: string;
        let description: string;
        let maxParticipants: string;
        let deadline: string;
        
        try {
            name = interaction.fields.getTextInputValue("name");
            description = interaction.fields.getTextInputValue("description");
            maxParticipants = interaction.fields.getTextInputValue("max_participants");
            deadline = interaction.fields.getTextInputValue("deadline") || "";
        } catch (error) {
            console.error("Error getting form fields:", error);
            return replyWithDeferredError(interaction, {
                type: ErrorType.ValidationError,
                details: { message: "Fehler beim Lesen der Formularfelder. Bitte versuche es erneut." },
            });
        }

        // For both Expense and Single: use points directly (no calculation needed)
        // For Expense tasks, use basePoints as fallback if points field is empty
        let points = interaction.fields.getTextInputValue("points");
        if (!points || points.trim() === "") {
            if (isExpense && basePoints !== undefined) {
                points = basePoints.toString();
            } else {
                return replyWithDeferredError(interaction, {
                    type: ErrorType.ValidationError,
                    details: { message: "Punkte müssen angegeben werden." },
                });
            }
        }
        
        const validatePointsResult = validatePositiveInteger(points);
        if (!validatePointsResult.ok) {
            return replyWithDeferredError(interaction, validatePointsResult.error);
        }
        const finalPoints = validatePointsResult.value;

        const validateMaxUsersResult = validatePositiveInteger(maxParticipants);
        if (!validateMaxUsersResult.ok) {
            return replyWithDeferredError(
                interaction,
                validateMaxUsersResult.error,
            );
        }

        let deadlineIso: string | null = null;
        if (deadline) {
            const validateDeadlineResult = validateDate(deadline);
            if (!validateDeadlineResult.ok) {
                return replyWithDeferredError(
                    interaction,
                    validateDeadlineResult.error,
                );
            }
            const parsed = dateFnsParse(deadline, "dd.MM.yyyy", new Date());
            parsed.setHours(23, 59, 0, 0);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (parsed < today) {
                return replyWithDeferredError(
                    interaction,
                    { type: ErrorType.DeadlineInPast },
                );
            }
            
            deadlineIso = parsed.toISOString();
        }

        const createResult = await api.createTask({
            name,
            description,
            points: finalPoints,
            maxParticipants: validateMaxUsersResult.value,
            deadlineIso,
            createdByDiscordId: interaction.user.id,
            taskTypeId: taskTypeId || null,
        });
        
        if (!createResult.ok) {
            return replyWithDeferredError(interaction, createResult.error);
        }

        const savedTask = createResult.value;

        const eventsResult = await api.getAllEventDetails();
        let events: EventDetailsDTO[] = [];
        let eventsWarning = "";

        if (!eventsResult.ok) {
            eventsWarning = `\n\n⚠️ Hinweis: Ereignisse konnten nicht geladen werden: ${getErrorMessage(eventsResult.error)}\n`;
        } else {
            events = eventsResult.value as EventDetailsDTO[];
        }

        // Discord erlaubt maximal 25 Optionen in einem Select-Menü
        const MAX_SELECT_OPTIONS = 25;
        const optionsEvents = eventsResult.ok && events.length > 0
            ? events
                .slice(0, MAX_SELECT_OPTIONS - 1)
                .map((event) => {
                    const startDate = new Date(event.startDate);
                    const dateStr = dateFnsFormat(startDate, "dd.MM.yyyy");
                    const timeStr = dateFnsFormat(startDate, "HH:mm");
                    
                    const label = `${event.name} - ${dateStr} ${timeStr}`;
                    const truncatedLabel = label.length > 100 ? label.substring(0, 97) + "..." : label;
                    
                    return {
                        label: truncatedLabel,
                        value: event.id,
                    };
                })
            : [];

        let adminsResult = await api.getPersonsByRoleName("Vorstand");
        if (!adminsResult.ok && adminsResult.error.type === ErrorType.DatabaseConnectionError) {
            for (let i = 0; i < 5; i++) {
                await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
                adminsResult = await api.getPersonsByRoleName("Vorstand");
                if (adminsResult.ok) break;
            }
        }

        let admins: PersonSummaryDTO[] = [];
        let adminWarning = "";

        if (!adminsResult.ok) {
            if (adminsResult.error.type === ErrorType.RoleNotFound) {
                adminWarning = "\n\n⚠️ Hinweis: Die Rolle 'Vorstand' wurde in der Datenbank nicht gefunden. Bitte führe `/syncroles` aus, um die Rollen zu synchronisieren.";
            } else {
                adminWarning = `\n\n⚠️ Hinweis: Verantwortliche konnten nicht geladen werden: ${getErrorMessage(adminsResult.error)}\n`;
            }
        } else {
            admins = adminsResult.value as PersonSummaryDTO[];
        }

        const optionsResponsible = admins.map((person) => ({
            label:
                (person.nickname?.trim() ||
                    `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim()) ||
                "Unbekannt",
            value: person.id,
        }));

        const components: ActionRowBuilder<StringSelectMenuBuilder>[] = [];
        let contentParts: string[] = ["✅ Die Aufgabe wurde erfolgreich gespeichert.\n\nHier kannst du die Aufgabe noch weiter konfigurieren.\n"];

        if (adminWarning || eventsWarning) {
            contentParts.push(adminWarning || eventsWarning);
        }

        if (adminsResult.ok && optionsResponsible.length > 0) {
            const limitedOptionsResponsible = optionsResponsible.slice(0, MAX_SELECT_OPTIONS - 1);
            const responsibleSelect = new StringSelectMenuBuilder()
                .setCustomId(`select_responsible:${savedTask.id}`)
                .setPlaceholder("Verantwortlicher auswählen (optional)")
                .addOptions([
                    { label: "-", value: "none" },
                    ...limitedOptionsResponsible
                ]);

            const rowResponsibleUser =
                new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                    responsibleSelect,
                );
            components.push(rowResponsibleUser);
            contentParts.push("\* **Verantwortlicher:** Wähle einen verantwortlichen aus dem Vorstand aus.\n");
        }

        if (eventsResult.ok && optionsEvents.length > 0) {
            const eventsSelect = new StringSelectMenuBuilder()
                .setCustomId(`select_event:${savedTask.id}`)
                .setPlaceholder("Ereignis auswählen (optional)")
                .addOptions([
                    { label: "-", value: "none" },
                    ...optionsEvents
                ]);

            const rowEvents =
                new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                    eventsSelect,
                );
            components.push(rowEvents);
            contentParts.push("\* **Ereignis:** Wähle ein Ereignis, mit dem die Aufgabe verknüpft werden soll.\n");
        }

        if (eventsResult.ok && events.length > MAX_SELECT_OPTIONS - 1) {
            eventsWarning = (eventsWarning ? eventsWarning + " " : "") + 
                `\n\n⚠️ Hinweis: Es gibt ${events.length} Events, aber nur die ersten ${MAX_SELECT_OPTIONS - 1} werden im Menü angezeigt.\n`;
        }

        const content = contentParts.join("");

        const publishButton = new ButtonBuilder()
            .setCustomId(`publish_task:${savedTask.id}`)
            .setLabel("Aufgabe veröffentlichen")
            .setStyle(ButtonStyle.Primary);
    
        const publishButtonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(publishButton);
    
        const allComponents = components.length > 0 
            ? [...components, publishButtonRow]
            : [publishButtonRow];

        await interaction.editReply({
            content,
            components: allComponents,
        });

        if (interaction.guild) {
            const logChannel = interaction.guild.channels.cache.find(
                (c) => c.name === ChannelNames.BotLog && c.isTextBased(),
            ) as TextChannel | undefined;

            if (logChannel) {
                const taskResult = await api.getTaskById(savedTask.id);
                const task = taskResult.ok ? taskResult.value : null;

                const deadlineStr = deadlineIso 
                    ? `<t:${Math.floor(new Date(deadlineIso).getTime() / 1000)}:R>`
                    : "Keine Deadline";

                let responsibleStr = "Noch nicht zugewiesen";
                if (task?.responsible) {
                    const responsiblePersonResult = await api.getPersonById(task.responsible);
                    if (responsiblePersonResult.ok) {
                        const responsiblePerson = responsiblePersonResult.value;
                        const responsibleName = responsiblePerson.nickname?.trim() ||
                            `${responsiblePerson.firstName ?? ""} ${responsiblePerson.lastName ?? ""}`.trim() ||
                            "Unbekannt";
                        responsibleStr = responsiblePerson.discordId 
                            ? `<@${responsiblePerson.discordId}> (${responsibleName})`
                            : responsibleName;
                    }
                }

                const logEmbed = new EmbedBuilder()
                    .setTitle("📋 Aufgabe erstellt")
                    .setColor(0x2ecc71)
                    .setDescription(`Erstellt von <@${interaction.user.id}>`)
                    .addFields(
                        { name: "Aufgabe", value: name, inline: false },
                        { name: "Punkte", value: `${finalPoints.toString()}`, inline: true },
                        { name: "Max. Teilnehmer", value: `${validateMaxUsersResult.value}`, inline: true },
                        { name: "Deadline", value: deadlineStr, inline: true },
                        { name: "Verantwortlich", value: responsibleStr, inline: false },
                    )
                    .setFooter({ text: `Task-ID: ${savedTask.id}` })
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

                await logChannel.send({ embeds: [logEmbed] }).catch();
            }
        }
    } catch (error) {
        console.error("Error in handleCreateTask:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return replyWithDeferredError(interaction, {
            type: ErrorType.UnknownError,
            details: { message: `Fehler beim Erstellen der Aufgabe: ${errorMessage}` },
        });
    }
}

export async function handleSelectResponsible(
    interaction: StringSelectMenuInteraction,
) {
    await interaction.deferUpdate();

    const [action, taskId] = interaction.customId.split(":");
    if (action !== "select_responsible" || !taskId) {
        return;
    }

    const selectedUserId = interaction.values[0];
    if (!selectedUserId) {
        return;
    }

    if (selectedUserId === "none") {
        return;
    }

    const result = await api.setTaskResponsible(taskId, selectedUserId);
    if (!result.ok) {
        await interaction.followUp({
            content: `❌ Fehler: ${getErrorMessage(result.error)}`,
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    if (interaction.guild) {
        const logChannel = interaction.guild.channels.cache.find(
            (c) => c.name === ChannelNames.BotLog && c.isTextBased(),
        ) as TextChannel | undefined;

        if (logChannel) {
            const taskResult = await api.getTaskById(taskId);
            const responsiblePersonResult = await api.getPersonById(selectedUserId);

            if (taskResult.ok && responsiblePersonResult.ok) {
                const task = taskResult.value;
                const responsiblePerson = responsiblePersonResult.value;
                const responsibleName = responsiblePerson.nickname?.trim() ||
                    `${responsiblePerson.firstName ?? ""} ${responsiblePerson.lastName ?? ""}`.trim() ||
                    "Unbekannt";
                const responsibleStr = responsiblePerson.discordId 
                    ? `<@${responsiblePerson.discordId}> (${responsibleName})`
                    : responsibleName;

                let logMessage = null;
                try {
                    const messages = await logChannel.messages.fetch({ limit: 100 });
                    logMessage = messages.find(msg => {
                        if (!msg.embeds || msg.embeds.length === 0) return false;
                        const embed = msg.embeds[0];
                        return embed.footer?.text?.includes(`Task-ID: ${taskId}`);
                    });
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    const errorDetails: ErrorDetails = {
                        type: ErrorType.UnknownError,
                        details: {
                            message: `Error fetching log messages: ${errorMessage}`,
                        }
                    };
                    getErrorMessage(errorDetails);
                }

                if (logMessage && logMessage.embeds && logMessage.embeds.length > 0) {
                    const originalEmbed = logMessage.embeds[0];
                    const updatedEmbed = EmbedBuilder.from(originalEmbed);
                    
                    const fields = [...(updatedEmbed.data.fields || [])];
                    const responsibleFieldIndex = fields.findIndex(f => f.name === "Verantwortlich");
                    
                    if (responsibleFieldIndex >= 0) {
                        fields[responsibleFieldIndex] = { ...fields[responsibleFieldIndex], value: responsibleStr };
                    } else {
                        fields.push({ name: "Verantwortlich", value: responsibleStr, inline: false });
                    }
                    
                    updatedEmbed.setFields(fields);
                    
                    try {
                        await logMessage.edit({ embeds: [updatedEmbed] });
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        const errorDetails: ErrorDetails = {
                            type: ErrorType.UnknownError,
                            details: {
                                message: `Error updating log message: ${errorMessage}`,
                            }
                        };
                        getErrorMessage(errorDetails);
                    }
                } else {
                    const errorDetails: ErrorDetails = {
                        type: ErrorType.UnknownError,
                        details: {
                            message: `Could not find original log message for task ${taskId}`,
                        }
                    };
                    getErrorMessage(errorDetails);
                }
            }
        }
    }
}

export async function handleSelectEvent(
    interaction: StringSelectMenuInteraction,
) {
    await interaction.deferUpdate();

    const [action, taskId] = interaction.customId.split(":");
    if (action !== "select_event" || !taskId) {
        return;
    }

    const selectedEventId = interaction.values[0];
    if (!selectedEventId) {
        return;
    }

    if (selectedEventId === "none") {
        return;
    }

    const result = await api.setTaskDetails(taskId, selectedEventId);
    if (!result.ok) {
        await interaction.followUp({
            content: `❌ Fehler: ${getErrorMessage(result.error)}`,
            flags: MessageFlags.Ephemeral,
        });
        return;
    }
}

export async function handlePublishTask(interaction: ButtonInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const [action, taskId] = interaction.customId.split(":");
    if (action !== "publish_task" || !taskId) {
        await interaction.deleteReply();
        return;
    }

    const taskResult = await api.getTaskById(taskId);
    if (!taskResult.ok) {
        return replyWithDeferredError(interaction, taskResult.error);
    }

    const task = taskResult.value as TaskDTO;

    const channelResult = await getChannelByName(
        config.DISCORD_GUILD_ID,
        ChannelNames.TASKS,
    );

    if (!channelResult.ok) {
        return replyWithDeferredError(interaction, {
            type: ErrorType.ChannelNotFound,
            details: { channel: ChannelNames.TASKS },
        });
    }

    const channel = channelResult.value as TextChannel;

    const deadlineStr = task.deadline 
        ? `<t:${Math.floor(new Date(task.deadline).getTime() / 1000)}:R>`
        : "Keine Deadline";

    const embedFields = [
        { name: "Beschreibung", value: `${task.description || "Keine Beschreibung"}`, inline: false },
        { name: "Punkte", value: `${task.points}`, inline: false },
        { name: "Maximale Anzahl Teilnehmer", value: `${task.maxParticipants}`, inline: false },
        { name: "Deadline", value: deadlineStr, inline: false },
    ];

    if (task.eventId) {
        const eventResult = await api.getEventDetailById(task.eventId);
        if (eventResult.ok) {
            const event = eventResult.value;
            const eventDateStr = dateFnsFormat(new Date(event.startDate), "dd.MM.yyyy, HH:mm 'Uhr'");
            embedFields.push({
                name: "Event",
                value: `${event.name}\n${eventDateStr}`,
                inline: false,
            });
        }
    }

    const embed = new EmbedBuilder()
        .setTitle(`📋 Aufgabe: ${task.name}`)
        .setColor(0x2ecc71)
        .addFields(embedFields)
        .setTimestamp();

    const claimButton = new ButtonBuilder()
        .setCustomId(`claim_task:${task.id}`)
        .setLabel("Aufgabe beanspruchen")
        .setStyle(ButtonStyle.Primary);

    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(claimButton);

    try {
        await channel.send({
            embeds: [embed],
            components: [buttonRow],
        });

        await interaction.editReply({
            content: "✅ Die Aufgabe wurde erfolgreich im Aufgaben-Channel veröffentlicht.",
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDetails: ErrorDetails = {
            type: ErrorType.MessageNotSend,
            details: {
                message: `Failed to publish task: ${errorMessage}`,
            }
        };
        getErrorMessage(errorDetails);
        return replyWithDeferredError(interaction, {
            type: ErrorType.MessageNotSend,
        });
    }
}
