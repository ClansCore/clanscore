import type { Client } from "discord.js";
import { config } from "./config";
import { commands } from "./commands";
import {
    notifyEvent,
    getChannelByName,
} from "./utils-discord/guild";
import { DiscordScheduledEventData, getErrorMessage, ErrorType, ErrorDetails, ChannelNames } from "@clanscore/shared";
import {
    handleFeedbackModal,
    processTaskCompletionButton,
} from "./commands/gamification/task/feedback";
import { handleAcceptApplicationButton } from "./commands/user/join/accept";
import { handleDenyApplicationButton } from "./commands/user/join/deny";
import { processReward } from "./commands/gamification/rewards";
import { handleJoinModalStep1 } from "./commands/user/join/joinStep1";
import { handleJoinModalStep2 } from "./commands/user/join/joinStep2";
import { handleCreateLeaderboardModal } from "./commands/gamification/createLeaderboard";
import { handleCreateTask } from "./commands/gamification/task/createTask";
import {
    handleDonationModal,
    handleSelectDonor,
} from "./commands/gamification/donation";
import { handleJoinContinue } from "./commands/user/join/joinContinue";
import { handleClaimTask } from "./commands/gamification/task/claimTask";
import { handleSelectResponsible, handleSelectEvent, handlePublishTask } from "./commands/gamification/task/createTask";
import { handleSelectTaskType } from "./commands/gamification/task/selectTaskTypeModal";
import { sendEventOverviewToChannel } from "./intergration/event/event-discord.service";
import { MessageFlags, GuildScheduledEventStatus, TextChannel } from "discord.js";
import { api } from "./api/apiClient";
import { syncEventsWithProvider } from "./intergration/event/event-sync.service";
import { handleSelectCompleteTask } from "./commands/gamification/task/selectCompleteTask";
import { handleGuildMemberAdd } from "./intergration/user-discord.service";
import type { Guild } from "discord.js";

const ALLOWED_GUILD_ID = config.DISCORD_GUILD_ID;
const EVENT_CHECK_INTERVAL = 10 * 60 * 1000; // 10 min
const EVENT_NOTIFY_WINDOW = 24 * 60 * 60 * 1000; // 24 h
const notifiedEvents = new Set<string>();
// Map to store event ID -> notification message ID for cleanup after event
const eventNotificationMessages = new Map<string, { messageId: string; channelId: string }>();
// Track events we just updated to avoid infinite loops
const recentlyUpdatedByBot = new Map<string, number>();
const BOT_UPDATE_WINDOW_MS = 5000; // 5 seconds

export function markEventAsUpdatedByBot(eventId: string) {
    recentlyUpdatedByBot.set(eventId, Date.now());
    setTimeout(() => {
        recentlyUpdatedByBot.delete(eventId);
    }, BOT_UPDATE_WINDOW_MS);
}

/**
 * Performs a full calendar synchronization similar to /synccalendar:
 * 1. Sync Google Calendar ↔ DB (with Discord events for conflict detection)
 * 2. Sync DB → Discord
 * 
 * @returns Sync statistics if successful, undefined if failed
 */
export async function performFullCalendarSync(guild: Guild): Promise<{ synced?: number; created?: number; deleted?: number } | undefined> {
    try {
        const discordEvents = await guild.scheduledEvents.fetch();
        const discordEventsData = Array.from(discordEvents.values()).map(event => ({
            id: event.id,
            name: event.name,
            description: event.description,
            scheduledStartAt: event.scheduledStartAt?.toISOString() ?? null,
            scheduledEndAt: event.scheduledEndAt?.toISOString() ?? null,
            entityMetadata: event.entityMetadata ? { location: event.entityMetadata.location } : null,
        }));

        const apiSyncResult = await api.syncCalendar(guild.id, discordEventsData);
        if (!apiSyncResult.ok) {
            return undefined;
        }

        const syncStats = apiSyncResult.value as { synced?: number; created?: number; deleted?: number };

        // Step 2: Sync DB events to Discord
        const discordSyncResult = await syncEventsWithProvider(guild);
        if (!discordSyncResult.ok) {
            return undefined;
        }

        return syncStats;
    } catch (error) {
        return undefined;
    }
}

export function registerDiscordHandlers(client: Client) {
    client.once("ready", async () => {
        console.log("✅ Discord client connected.");

        const runSyncTask = async () => {
            try {
                const guild = await client.guilds.fetch(config.DISCORD_GUILD_ID);

                const sendOverview = await sendEventOverviewToChannel();
                if (!sendOverview.ok) {
                }

                const synced = await api.syncCalendar(guild.id);
                if (!synced.ok) {
                }

                const discordSync = await syncEventsWithProvider(guild);
                if (!discordSync.ok) {
                }

                const events = await guild.scheduledEvents.fetch();
                const now = Date.now();
                let hasEventWithin24h = false;

                for (const event of events.values()) {
                    const startTime = event.scheduledStartTimestamp!;
                    const diff = startTime - now;
                    
                    if (diff < 0 && eventNotificationMessages.has(event.id)) {
                        const notificationInfo = eventNotificationMessages.get(event.id)!;
                        try {
                            const channel = await guild.channels.fetch(notificationInfo.channelId);
                            if (channel && channel.isTextBased()) {
                                const message = await (channel as TextChannel).messages.fetch(notificationInfo.messageId);
                                await message.delete();
                            }
                        } catch (error) {
                            // Message might already be deleted, ignore
                        }
                        eventNotificationMessages.delete(event.id);
                        notifiedEvents.delete(event.id);
                    }
                    
                    // Send or update notification 24h before event
                    if (
                        diff > 0 &&
                        diff <= EVENT_NOTIFY_WINDOW
                    ) {
                        hasEventWithin24h = true;
                        const existingNotification = eventNotificationMessages.get(event.id);
                        const notification = await notifyEvent(
                            guild.id, 
                            event,
                            existingNotification?.messageId
                        );
                        if (!notification.ok) {
                        } else {
                            if (!notifiedEvents.has(event.id)) {
                                notifiedEvents.add(event.id);
                            }
                            
                            const channelResult = await getChannelByName(guild.id, ChannelNames.EVENTS);
                            if (channelResult.ok && notification.value) {
                                eventNotificationMessages.set(event.id, {
                                    messageId: notification.value.id,
                                    channelId: channelResult.value.id,
                                });
                            }
                        }
                    }
                }
                
                if (hasEventWithin24h) {
                    await sendEventOverviewToChannel();
                }
            } catch (error) {
            }
        };

        console.log("🔄 Running initial sync...");
        await runSyncTask();

        setInterval(runSyncTask, EVENT_CHECK_INTERVAL);

        console.log("✅ Event handlers registered.");
        console.log("🤖 Discord-Bot is ready.");
    });

    client.on("interactionCreate", async (interaction) => {
        if (!interaction.guild || interaction.guild.id !== ALLOWED_GUILD_ID)
            return;

        if (interaction.isChatInputCommand()) {
            const { commandName } = interaction;

            if (commandName === "claim") {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                const taskId = interaction.options.getString("task_id", true);

                const taskResult = await api.getTaskById(taskId);
                const taskName = taskResult.ok ? taskResult.value.name : taskId;

                const res = await api.claimTask(taskId, interaction.user.id);

                if (!res.ok) {
                    return interaction.editReply({
                        content: `⚠️ ${getErrorMessage(res.error)}`,
                    });
                }
                return interaction.editReply("✅ Du hast die Aufgabe geclaimt.");
            }

            if (commandName === "task-complete") {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                const taskId = interaction.options.getString("task_id", true);

                const res = await api.completeTask(taskId, interaction.user.id);

                if (!res.ok) {
                    return interaction.editReply({
                        content: `⚠️ ${getErrorMessage(res.error)}`,
                    });
                }

                return interaction.editReply({
                    content:
                        "✅ Danke! Die Administratoren wurden benachrichtigt. Dein Antrag wird bald bearbeitet.",
                });
            }

            if (commands[commandName as keyof typeof commands]) {
                await commands[commandName as keyof typeof commands].execute(
                    interaction,
                );
                return;
            }

            return interaction.reply({
                content: "❓ Unbekannter Command.",
                flags: MessageFlags.Ephemeral,
            });
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId === "join_modal_step1") {
                await handleJoinModalStep1(interaction);
            } else if (interaction.customId === "join_modal_step2") {
                await handleJoinModalStep2(interaction);
            } else if (interaction.customId === "create_leaderboard_modal") {
                await handleCreateLeaderboardModal(interaction);
            } else if (interaction.customId.startsWith("create_task_modal_step1")) {
                await handleCreateTask(interaction);
            } else if (interaction.customId.startsWith("feedback_modal")) {
                await handleFeedbackModal(interaction);
            } else if (interaction.customId.startsWith("donation_modal")) {
                await handleDonationModal(interaction);
            }
        }
        
        if (interaction.isButton()) {
            if (interaction.customId === "join_continue_step2") {
                await handleJoinContinue(interaction);
            } else if (interaction.customId.startsWith("publish_task")) {
                await handlePublishTask(interaction);
            } else if (interaction.customId.startsWith("claim_task")) {
                await handleClaimTask(interaction);
            } else if (interaction.customId.startsWith("accept_application")) {
                await handleAcceptApplicationButton(interaction);
            } else if (interaction.customId.startsWith("deny_application")) {
                await handleDenyApplicationButton(interaction);
            } else if (
                interaction.customId.startsWith("accept_reward") ||
                interaction.customId.startsWith("deny_reward")
            ) {
                await processReward(interaction);
            } else if (
                interaction.customId.startsWith("accept_task_completion") ||
                interaction.customId.startsWith("deny_task_completion")
            ) {
                await processTaskCompletionButton(interaction);
            }
        }

        if (interaction.isStringSelectMenu()) {
            const customId = interaction.customId;

            if (customId.startsWith("select_donator")) {
                await handleSelectDonor(interaction);
                return;
            }

            if (customId.startsWith("select_responsible")) {
                await handleSelectResponsible(interaction);
                return;
            }

            if (customId.startsWith("select_event")) {
                await handleSelectEvent(interaction);
                return;
            }

            if (customId === "select_task_type") {
                await handleSelectTaskType(interaction);
                return;
            }

            if (customId.startsWith("select_complete_task")) {
                await handleSelectCompleteTask(interaction);
                return;
            }

            const [namespace, action, taskId] = customId.split(":");
            if (namespace === "task") {
                const selected = interaction.values[0];

                await interaction.deferReply({
                    flags: MessageFlags.Ephemeral,
                });

                if (action === "select-responsible") {
                    const res = await api.setTaskResponsible(taskId, selected);

                    if (!res.ok) {
                        return interaction.editReply({
                            content: `⚠️ ${getErrorMessage(res.error)}`,
                        });
                    }

                    return interaction.editReply({
                        content: "✅ Verantwortliche Person wurde gesetzt.",
                    });
                }

                if (action === "select-occasion") {
                    const res = await api.setTaskDetails(taskId, selected);

                    if (!res.ok) {
                        return interaction.editReply({
                            content: `⚠️ ${getErrorMessage(res.error)}`,
                        });
                    }

                    return interaction.editReply({
                        content: "✅ Aufgabe wurde mit der Occasion verknüpft.",
                    });
                }

                if (action === "complete") {
                    const res = await api.completeTask(selected, interaction.user.id);

                    if (!res.ok) {
                        return interaction.editReply({
                            content: `⚠️ ${getErrorMessage(res.error)}`,
                        });
                    }

                    return interaction.editReply({
                        content:
                            "✅ Danke! Die Administratoren wurden benachrichtigt. Dein Antrag wird bald bearbeitet.",
                    });
                }

                return interaction.editReply({
                    content: "❓ Unbekannte Auswahl.",
                });
            }
        }
    });

    client.on("guildScheduledEventCreate", async (event) => {
        if (event.creatorId === client.user?.id) return;

        // Discord.js GuildScheduledEvent has getters (scheduledStartAt, scheduledEndAt) that don't serialize.
        // We need to manually extract the data we need.
        const serializedEvent: DiscordScheduledEventData = {
            id: event.id,
            name: event.name,
            description: event.description,
            scheduledStartAt: event.scheduledStartAt?.toISOString() ?? null,
            scheduledEndAt: event.scheduledEndAt?.toISOString() ?? null,
            scheduledStartTimestamp: event.scheduledStartTimestamp,
            scheduledEndTimestamp: event.scheduledEndTimestamp,
            entityMetadata: event.entityMetadata ? { location: event.entityMetadata.location } : null,
            recurrenceRule: event.recurrenceRule ? {
                frequency: event.recurrenceRule.frequency,
                interval: event.recurrenceRule.interval,
                count: event.recurrenceRule.count,
                byNWeekday: event.recurrenceRule.byNWeekday ? Array.from(event.recurrenceRule.byNWeekday.map(nw => ({ day: nw.day, n: nw.n }))) : null,
                byWeekday: event.recurrenceRule.byWeekday ? Array.from(event.recurrenceRule.byWeekday.map(w => Number(w))) : null,
                byMonth: event.recurrenceRule.byMonth ? Array.from(event.recurrenceRule.byMonth.map(m => Number(m))) : null,
                byMonthDay: event.recurrenceRule.byMonthDay ? Array.from(event.recurrenceRule.byMonthDay) : null,
            } as DiscordScheduledEventData["recurrenceRule"] : null,
        };

        const res = await api.createCalendarFromDiscord({
            guildId: event.guildId!,
            event: serializedEvent
        });

        if (!res.ok) {
            return;
        }

        const guild = event.guild;
        if (guild) {
            await performFullCalendarSync(guild);
            await sendEventOverviewToChannel();
        }
    });

    client.on("guildScheduledEventUpdate", async (oldEvent, newEvent) => {
        const lastBotUpdate = recentlyUpdatedByBot.get(newEvent.id);
        const now = Date.now();
        if (lastBotUpdate && (now - lastBotUpdate) < BOT_UPDATE_WINDOW_MS) {
            return;
        }

        if (oldEvent && newEvent.status === GuildScheduledEventStatus.Canceled && oldEvent.status !== GuildScheduledEventStatus.Canceled) {
            const res = await api.deleteCalendarFromDiscord({
                guildId: newEvent.guildId!,
                discordEventId: newEvent.id
            });

            if (!res.ok) {
                return;
            }

            const guild = newEvent.guild;
            if (guild) {
                await performFullCalendarSync(guild);
                await sendEventOverviewToChannel();
            }
            return;
        }

        // Check if event actually changed (to avoid syncing when nothing changed)
        if (oldEvent) {
            const hasChanged = 
                oldEvent.name !== newEvent.name ||
                oldEvent.description !== newEvent.description ||
                oldEvent.scheduledStartAt?.getTime() !== newEvent.scheduledStartAt?.getTime() ||
                oldEvent.scheduledEndAt?.getTime() !== newEvent.scheduledEndAt?.getTime() ||
                oldEvent.entityMetadata?.location !== newEvent.entityMetadata?.location;
            
            if (!hasChanged) {
                return;
            }
        }

        try {
            const serializedEvent: DiscordScheduledEventData = {
                id: newEvent.id,
                name: newEvent.name,
                description: newEvent.description,
                scheduledStartAt: newEvent.scheduledStartAt?.toISOString() ?? null,
                scheduledEndAt: newEvent.scheduledEndAt?.toISOString() ?? null,
                scheduledStartTimestamp: newEvent.scheduledStartTimestamp,
                scheduledEndTimestamp: newEvent.scheduledEndTimestamp,
                entityMetadata: newEvent.entityMetadata ? { location: newEvent.entityMetadata.location } : null,
                recurrenceRule: newEvent.recurrenceRule ? {
                    frequency: newEvent.recurrenceRule.frequency,
                    interval: newEvent.recurrenceRule.interval,
                    count: newEvent.recurrenceRule.count,
                    byNWeekday: newEvent.recurrenceRule.byNWeekday ? Array.from(newEvent.recurrenceRule.byNWeekday.map(nw => ({ day: nw.day, n: nw.n }))) : null,
                    byWeekday: newEvent.recurrenceRule.byWeekday ? Array.from(newEvent.recurrenceRule.byWeekday.map(w => Number(w))) : null,
                    byMonth: newEvent.recurrenceRule.byMonth ? Array.from(newEvent.recurrenceRule.byMonth.map(m => Number(m))) : null,
                    byMonthDay: newEvent.recurrenceRule.byMonthDay ? Array.from(newEvent.recurrenceRule.byMonthDay) : null,
                } as DiscordScheduledEventData["recurrenceRule"] : null,
            };

            const res = await api.updateCalendarFromDiscord({
                guildId: newEvent.guildId!,
                event: serializedEvent
            });

            if (!res.ok) {
                return;
            }

            const guild = newEvent.guild;
            if (guild) {
                await performFullCalendarSync(guild);
                await sendEventOverviewToChannel();
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails: ErrorDetails = {
                type: ErrorType.CalendarSyncError,
                details: {
                    message: `Unexpected error during Discord event update: ${errorMessage}`,
                    eventName: newEvent.name,
                    eventId: newEvent.id,
                }
            };
            getErrorMessage(errorDetails);
        }
    });

    client.on("guildScheduledEventDelete", async (event) => {
        if (event.creatorId === client.user?.id) return;

        const res = await api.deleteCalendarFromDiscord({
            guildId: event.guildId!,
            discordEventId: event.id
        });

        if (!res.ok) {
            return;
        }

        const guild = event.guild;
        if (guild) {
            await performFullCalendarSync(guild);
            await sendEventOverviewToChannel();
        }
    });

    client.on("guildMemberAdd", handleGuildMemberAdd);
}
