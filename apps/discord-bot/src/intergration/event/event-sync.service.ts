import { Guild, GuildScheduledEvent, GuildScheduledEventStatus } from "discord.js";
import { api } from "../../api/apiClient";
import { mapIEventToDiscordEventOptions, rruleStringToDiscordRecurrence } from "./event-discord.mapper";
import { ErrorDetails, EventDetailsDTO, ok, Result, ErrorType, getErrorMessage } from "@clanscore/shared";
import { markEventAsUpdatedByBot } from "../../discord.handler";
import { config } from "../../config";

function isDiscordEventActive(discordEvent: GuildScheduledEvent): boolean {
    if (discordEvent.status === GuildScheduledEventStatus.Active) {
        return true;
    }
    
    const now = new Date();
    const startTime = discordEvent.scheduledStartAt;
    const endTime = discordEvent.scheduledEndAt;
    
    if (startTime && endTime) {
        return now >= startTime && now <= endTime;
    }
    
    return false;
}

function discordAndDbEventsDiffer(
    discordEvent: GuildScheduledEvent,
    dbEvent: EventDetailsDTO
): boolean {
    const normalize = (val: string | null | undefined) => (val ?? "").trim();
    const normalizeDate = (date: Date | null | undefined) => date ? new Date(date).getTime() : 0;
    
    const discordStartTime = discordEvent.scheduledStartAt?.getTime();
    const discordEndTime = discordEvent.scheduledEndAt?.getTime();
    const dbStartTime = new Date(dbEvent.startDate).getTime();
    const dbEndTime = new Date(dbEvent.endDate).getTime();
    
    if (normalize(discordEvent.name) !== normalize(dbEvent.name)) {
        return true;
    }
    
    if (normalize(discordEvent.description) !== normalize(dbEvent.description)) {
        return true;
    }
    
    if (discordStartTime !== undefined) {
        const startTimeDiff = Math.abs(discordStartTime - dbStartTime);
        if (startTimeDiff >= 60000) {
            return true;
        }
    } else if (dbStartTime !== 0) {
        return true; // Discord has no start time but DB does
    }
    
    if (discordEndTime !== undefined) {
        const endTimeDiff = Math.abs(discordEndTime - dbEndTime);
        if (endTimeDiff >= 60000) {
            return true;
        }
    } else if (dbEndTime !== 0) {
        return true; // Discord has no end time but DB does
    }
    
    const discordLocation = discordEvent.entityMetadata?.location ?? null;
    const dbLocation = dbEvent.location ?? null;
    if (normalize(discordLocation) !== normalize(dbLocation)) {
        return true;
    }
    
    return false;
}

/**
 * Synchronizes Database events with Discord scheduled events.
 * Priority: Google Calendar > DB > Discord
 * 
 * - Fetches events from DB (which is synced with Google Calendar)
 * - Creates, updates, or deletes Discord scheduled events to match DB
 * - Only shows events within time range (today to 1 year)
 * - For recurring events: creates ONE Discord event with recurrence rule (count: 5)
 *   Discord automatically shows the next 5 repetitions of the event
 */
export async function syncEventsWithProvider(guild: Guild): Promise<Result<boolean, ErrorDetails>> {
    const dbEventsResult = await api.getAllEventDetails();
    if (!dbEventsResult.ok) return dbEventsResult;

    const dbEvents = dbEventsResult.value;
    const discordEvents = await guild.scheduledEvents.fetch();

    const now = new Date();
    const maxDate = new Date(now);
    maxDate.setMonth(maxDate.getMonth() + Number(config.TIME_RANGE_MONTHS));

    // Filter DB events to only those within time range
    // IMPORTANT: Discord doesn't allow events with startDate in the past
    let eventsInRange = dbEvents.filter(event => {
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        return startDate > now && endDate > now && startDate <= maxDate;
    });

    eventsInRange.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    // For recurring events: keep only the first instance per series
    // This instance will be created with recurrence rule (count: 5) so Discord shows the next 5 repetitions
    eventsInRange = getFirstInstancePerRecurringSeries(eventsInRange);

    const validDiscordIds = new Set(
        eventsInRange
            .map(e => e.discordEventId)
            .filter(id => id && id !== "pending" && id !== "unknown")
    );

    const allDbDiscordIds = new Set(
        dbEvents
            .map(e => e.discordEventId)
            .filter(id => id && id !== "pending" && id !== "unknown")
    );

    // 1. Delete Discord events that are no longer valid (past, outside range, or not in DB)
    // Also skip canceled events - they should not be restored
    for (const [discordEventId, discordEvent] of discordEvents) {
        if (discordEvent.status === GuildScheduledEventStatus.Canceled) {
            continue;
        }

        if (validDiscordIds.has(discordEventId)) continue;

        const discordStartTime = discordEvent.scheduledStartAt;
        const discordEndTime = discordEvent.scheduledEndAt;
        
        // Protect active/running events: don't delete if event is currently active
        if (isDiscordEventActive(discordEvent)) {
            continue;
        }
        
        const isPast = discordStartTime && discordEndTime && discordEndTime < now;
        const isTooFarFuture = discordStartTime && discordStartTime > maxDate;
        
        const dbEvent = dbEvents.find(e => e.discordEventId === discordEventId);
        const existsInDb = allDbDiscordIds.has(discordEventId);
        
        const isEventCreatedByBot = discordEvent.creatorId === guild.client.user?.id;
        
        const wasDeletedFromGoogle = !existsInDb;
        const shouldDeleteForOtherReasons = (isPast || isTooFarFuture || (dbEvent && !eventsInRange.some(e => e.discordEventId === discordEventId))) && isEventCreatedByBot;
        
        if (wasDeletedFromGoogle || shouldDeleteForOtherReasons) {
            try {
                await discordEvent.delete();
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                const errorDetails: ErrorDetails = {
                    type: ErrorType.UnknownError,
                    details: {
                        message: `Could not delete Discord event: ${discordEvent.name} - ${errorMessage}`,
                    }
                };
                getErrorMessage(errorDetails);
            }
        }
    }

    // 2. Create or update Discord events from DB
    // Note: Newly created events are automatically added to discordEvents map
    // to prevent subsequent events with the same name from incorrectly matching
    for (const dbEvent of eventsInRange) {
        try {
            await syncSingleEventToDiscord(guild, dbEvent, discordEvents);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            const errorDetails: ErrorDetails = {
                type: ErrorType.CalendarSyncError,
                details: {
                    message: `Failed to sync event to Discord: ${dbEvent.name} - ${errorMessage}`,
                }
            };
            getErrorMessage(errorDetails);
        }
    }

    return ok(true);
}

async function syncSingleEventToDiscord(
    guild: Guild,
    dbEvent: EventDetailsDTO,
    discordEvents: Map<string, GuildScheduledEvent>
): Promise<GuildScheduledEvent | null> {
    const dbStartTime = new Date(dbEvent.startDate).getTime();
    const dbEndTime = new Date(dbEvent.endDate).getTime();
    
    let matchedDiscordEvent = dbEvent.discordEventId && dbEvent.discordEventId !== "pending" && dbEvent.discordEventId !== "unknown"
        ? discordEvents.get(dbEvent.discordEventId)
        : undefined;

    if (matchedDiscordEvent) {
        if (matchedDiscordEvent.status === GuildScheduledEventStatus.Canceled) {
            return null;
        }

        const discordStartTime = matchedDiscordEvent.scheduledStartAt?.getTime();
        const discordEndTime = matchedDiscordEvent.scheduledEndAt?.getTime();
        
        if (discordStartTime === undefined) {
            matchedDiscordEvent = undefined;
        } else {
            const startTimeDiff = Math.abs(discordStartTime - dbStartTime);
            if (startTimeDiff >= 300000) { // 5 minutes
                matchedDiscordEvent = undefined;
            } else if (discordEndTime !== undefined) {
                const endTimeDiff = Math.abs(discordEndTime - dbEndTime);
                if (endTimeDiff >= 300000) { // 5 minutes
                    matchedDiscordEvent = undefined;
                }
            }
        }
    }

    if (!matchedDiscordEvent) {
        // Match by name AND start time to avoid matching wrong instance of recurring events
        // Events with the same name but different start times are different instances
        // For recurring events that are created as individual events, we need to be very precise
        matchedDiscordEvent = Array.from(discordEvents.values()).find(e => {
            if (e.status === GuildScheduledEventStatus.Canceled) return false;

            const nameMatches = e.name === dbEvent.name;
            if (!nameMatches) return false;
            
            const discordStartTime = e.scheduledStartAt?.getTime();
            const discordEndTime = e.scheduledEndAt?.getTime();
            
            if (discordStartTime === undefined) return false; // Must have start time to match
            
            const startTimeDiff = Math.abs(discordStartTime - dbStartTime);
            if (startTimeDiff >= 300000) return false; // More than 5 minutes difference
            
            if (discordEndTime !== undefined) {
                const endTimeDiff = Math.abs(discordEndTime - dbEndTime);
                if (endTimeDiff >= 300000) return false; // More than 5 minutes difference
            }
            
            return true; // Name and times match
        });
    }

    // Protect recent Discord updates: if DB was updated very recently (within 10 seconds),
    // skip updating Discord to avoid overwriting recent Discord changes
    if (matchedDiscordEvent && (dbEvent as any).updatedAt) {
        const now = new Date();
        const timeSinceDbUpdate = now.getTime() - new Date((dbEvent as any).updatedAt).getTime();
        const protectionWindowMs = 10000; // 10 seconds
        
        if (timeSinceDbUpdate < protectionWindowMs) {
            return null;
        }
    }

    // For recurring events: use the recurrence rule so Discord shows the next 5 repetitions
    // The recurrence rule will be modified to have count: 5 in the mapper
    const recurrenceRuleToUse = hasRealRecurrence(dbEvent)
        ? (dbEvent.recurrenceRule ?? null)
        : null;

    const discordOptions = mapIEventToDiscordEventOptions({
        id: dbEvent.providerEventId,
        summary: dbEvent.name,
        description: dbEvent.description,
        startDate: new Date(dbEvent.startDate),
        endDate: new Date(dbEvent.endDate),
        location: dbEvent.location,
        recurringEventId: dbEvent.recurringEventId,
        recurrenceRule: recurrenceRuleToUse ?? undefined,
    }, recurrenceRuleToUse);

    let discordEventId: string;

    if (matchedDiscordEvent) {
        // Check if we need to add, remove, or change a recurrence rule
        // Discord doesn't allow modifying recurrence rules on existing events, so we need to delete and recreate
        const hasRecurrenceInOptions = !!discordOptions.recurrenceRule;
        const hasRecurrenceInExisting = !!matchedDiscordEvent.recurrenceRule;
        
        let recurrenceChanged = false;
        if (hasRecurrenceInOptions !== hasRecurrenceInExisting) {
            recurrenceChanged = true;
        } else if (hasRecurrenceInOptions && hasRecurrenceInExisting) {
            const optionsFreq = discordOptions.recurrenceRule?.frequency;
            const existingFreq = matchedDiscordEvent.recurrenceRule?.frequency;
            if (optionsFreq !== existingFreq) {
                recurrenceChanged = true;
            }
        }
        
        const eventDataChanged = !recurrenceChanged && discordAndDbEventsDiffer(matchedDiscordEvent, dbEvent);
        
        if (recurrenceChanged || eventDataChanged) {
            if (recurrenceChanged) {
                // Protect events created by users: only delete and recreate if the event was created by the bot
                const isEventCreatedByBot = matchedDiscordEvent.creatorId === guild.client.user?.id;
                
                if (!isEventCreatedByBot) {
                    if (isDiscordEventActive(matchedDiscordEvent)) {
                        return matchedDiscordEvent;
                    }
                    
                    const updateOptions = { ...discordOptions };
                    delete updateOptions.recurrenceRule;
                    
                    await matchedDiscordEvent.edit(updateOptions);
                    discordEventId = matchedDiscordEvent.id;
                } else {
                    // Protect active/running events: don't delete and recreate if event is currently active
                    if (isDiscordEventActive(matchedDiscordEvent)) {
                        return matchedDiscordEvent;
                    }
                    
                    try {
                        await matchedDiscordEvent.delete();
                        const created = await guild.scheduledEvents.create(discordOptions);
                        discordEventId = created.id;
                        
                        if (dbEvent.discordEventId !== discordEventId) {
                            await api.updateEventDetails({
                                providerEventId: dbEvent.providerEventId,
                                discordEventId: discordEventId,
                                name: dbEvent.name,
                                description: dbEvent.description || "",
                                startDate: new Date(dbEvent.startDate),
                                endDate: new Date(dbEvent.endDate),
                                location: dbEvent.location || "Unbekannter Ort",
                                recurringEventId: dbEvent.recurringEventId || null,
                                recurrenceRule: dbEvent.recurrenceRule,
                            });
                        }
                    } catch (error) {
                        throw error;
                    }
                }
            } else {
                if (isDiscordEventActive(matchedDiscordEvent)) {
                    return matchedDiscordEvent;
                }
                
                await matchedDiscordEvent.edit(discordOptions);
                discordEventId = matchedDiscordEvent.id;
            }
            
            markEventAsUpdatedByBot(discordEventId);
        } else {
            discordEventId = matchedDiscordEvent.id;
        }
        
        // For recurring events that are actually created as recurring in Discord:
        // Set discordMasterEventId for all instances in the series
        // The first instance becomes the master event with recurrence rule
        // Only do this if the event was actually created with a recurrence rule in Discord
        if (hasRealRecurrence(dbEvent) && discordOptions.recurrenceRule) {
            // Update all instances in the recurring series to reference the master event
            if (dbEvent.discordEventId !== discordEventId || dbEvent.discordMasterEventId !== discordEventId) {
                await api.updateEventDetails({
                    providerEventId: dbEvent.providerEventId,
                    discordEventId: discordEventId,
                    discordMasterEventId: discordEventId, // This instance is the master
                    name: dbEvent.name,
                    description: dbEvent.description || "",
                    startDate: new Date(dbEvent.startDate),
                    endDate: new Date(dbEvent.endDate),
                    location: dbEvent.location || "Unbekannter Ort",
                    recurringEventId: dbEvent.recurringEventId || null,
                    recurrenceRule: dbEvent.recurrenceRule,
                });
                
                // Update all other instances in the series to reference this master event
                const allEventsResult = await api.getAllEventDetails();
                if (allEventsResult.ok) {
                    const allEvents = (allEventsResult as { ok: true; value: EventDetailsDTO[] }).value;
                    const otherInstances = allEvents.filter(
                        (e: EventDetailsDTO) => e.recurringEventId === dbEvent.recurringEventId && 
                             e.providerEventId !== dbEvent.providerEventId
                    );
                
                    for (const instance of otherInstances) {
                        await api.updateEventDetails({
                            providerEventId: instance.providerEventId,
                            discordEventId: instance.discordEventId,
                            discordMasterEventId: discordEventId, // Reference to master
                            name: instance.name,
                            description: instance.description || "",
                            startDate: new Date(instance.startDate),
                            endDate: new Date(instance.endDate),
                            location: instance.location || "Unbekannter Ort",
                            recurringEventId: instance.recurringEventId || null,
                            recurrenceRule: instance.recurrenceRule,
                        });
                    }
                }
            }
        }
        
        return matchedDiscordEvent;
    }
    
    // No matching Discord event found - create a new one
    // This is especially important for recurring events that are created as individual events
    // Each instance must get its own unique Discord event
    const created = await guild.scheduledEvents.create(discordOptions);
    discordEventId = created.id;
    
    // Add the newly created event to the discordEvents map immediately
    // This prevents subsequent events with the same name from incorrectly matching this one
    discordEvents.set(discordEventId, created);
    
    // ALWAYS update DB with the new discordEventId immediately
    // This ensures each instance of a recurring event gets its own unique discordEventId
    await api.updateEventDetails({
        providerEventId: dbEvent.providerEventId,
        discordEventId: discordEventId,
        name: dbEvent.name,
        description: dbEvent.description || "",
        startDate: new Date(dbEvent.startDate),
        endDate: new Date(dbEvent.endDate),
        location: dbEvent.location || "Unbekannter Ort",
        recurringEventId: dbEvent.recurringEventId || null,
        recurrenceRule: dbEvent.recurrenceRule,
    });
    
    // For recurring events that are actually created as recurring in Discord:
    // Set discordMasterEventId for all instances in the series
    // The first instance becomes the master event with recurrence rule
    // Only do this if the event was actually created with a recurrence rule in Discord
    if (hasRealRecurrence(dbEvent) && discordOptions.recurrenceRule) {
        if (dbEvent.discordEventId !== discordEventId || dbEvent.discordMasterEventId !== discordEventId) {
            await api.updateEventDetails({
                providerEventId: dbEvent.providerEventId,
                discordEventId: discordEventId,
                discordMasterEventId: discordEventId,
                name: dbEvent.name,
                description: dbEvent.description || "",
                startDate: new Date(dbEvent.startDate),
                endDate: new Date(dbEvent.endDate),
                location: dbEvent.location || "Unbekannter Ort",
                recurringEventId: dbEvent.recurringEventId || null,
                recurrenceRule: dbEvent.recurrenceRule,
            });
            
            const allEventsResult = await api.getAllEventDetails();
            if (allEventsResult.ok) {
                const allEvents = (allEventsResult as { ok: true; value: EventDetailsDTO[] }).value;
                const otherInstances = allEvents.filter(
                    (e: EventDetailsDTO) => e.recurringEventId === dbEvent.recurringEventId && 
                         e.providerEventId !== dbEvent.providerEventId
                );
                
                for (const instance of otherInstances) {
                    await api.updateEventDetails({
                        providerEventId: instance.providerEventId,
                        discordEventId: instance.discordEventId,
                        discordMasterEventId: discordEventId,
                        name: instance.name,
                        description: instance.description || "",
                        startDate: new Date(instance.startDate),
                        endDate: new Date(instance.endDate),
                        location: instance.location || "Unbekannter Ort",
                        recurringEventId: instance.recurringEventId || null,
                        recurrenceRule: instance.recurrenceRule,
                    });
                }
            }
        }
    }
    
    return created;
}

function hasRealRecurrence(event: EventDetailsDTO): boolean {
    return !!event.recurringEventId && 
           !!event.recurrenceRule && 
           !event.recurrenceRule.includes("FREQ=ONCE");
}

/**
 * Checks if a recurrence rule is supported by Discord.
 * Returns true if the rule can be converted to Discord format, false otherwise.
 */
function isRecurrenceRuleSupportedByDiscord(recurrenceRule: string | null, startDate: Date): boolean {
    if (!recurrenceRule || recurrenceRule.includes("FREQ=ONCE")) {
        return false;
    }
    
    const result = rruleStringToDiscordRecurrence(recurrenceRule, startDate);
    return result.ok;
}

/**
 * For recurring events:
 * - If the recurrence rule is supported by Discord: keep only the FIRST instance per series.
 *   This instance will be created as a Discord event WITH recurrence rule (count: 5),
 *   so Discord automatically shows the next 5 repetitions.
 * - If the recurrence rule is NOT supported by Discord: keep ALL instances as individual events.
 * 
 * Non-recurring events (including those with FREQ=ONCE) are kept as-is.
 */
function getFirstInstancePerRecurringSeries(events: EventDetailsDTO[]): EventDetailsDTO[] {
    const recurringGroups = new Map<string, EventDetailsDTO[]>();
    const nonRecurringEvents: EventDetailsDTO[] = [];
    const unsupportedRecurringEvents: EventDetailsDTO[] = [];

    for (const event of events) {
        if (hasRealRecurrence(event)) {
            const group = recurringGroups.get(event.recurringEventId!) || [];
            group.push(event);
            recurringGroups.set(event.recurringEventId!, group);
        } else {
            nonRecurringEvents.push(event);
        }
    }

    // For each recurring group, check if the recurrence rule is supported by Discord
    const recurringMasterEvents: EventDetailsDTO[] = [];
    for (const [, group] of recurringGroups) {
        group.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        
        const firstInstance = group[0];
        const isSupported = isRecurrenceRuleSupportedByDiscord(
            firstInstance.recurrenceRule ?? null,
            new Date(firstInstance.startDate)
        );
        
        if (isSupported) {
            // Recurrence rule is supported - use only the first instance with recurrence rul
            recurringMasterEvents.push(firstInstance);
        } else {
            unsupportedRecurringEvents.push(...group);
        }
    }

    const result = [...nonRecurringEvents, ...recurringMasterEvents, ...unsupportedRecurringEvents];
    result.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    return result;
}
