import { ErrorDetails, IEvent, ok, Result } from "@clanscore/shared";
import { getCalendarProvider } from "../../infrastructure/external/calendar";
import { getValidAccessToken } from "./event-token.service";
import { EventModel } from "./event.model";
import { CalendarProvider } from "../../infrastructure/external/calendar/CalendarProvider";
import { config } from "../../config";

/**
 * Get events from Google Calendar for a guild within the time range (today to 1 year)
 */
export async function getProviderEventsForGuild(guildId: string, limit: number = 5) {
    const calendarProviderResult = getCalendarProvider("google");
    if (!calendarProviderResult.ok) return calendarProviderResult;

    const tokenResult = await getValidAccessToken(guildId, calendarProviderResult.value);
    if (!tokenResult.ok) return tokenResult;

    return await calendarProviderResult.value.getEvents(tokenResult.value, limit, Number(config.TIME_RANGE_MONTHS));
}

/**
 * Bidirectional sync between Google Calendar and Database.
 * Priority: Google Calendar > DB
 * - Google events are synced to DB (Google Calendar is the source of truth)
 * - If DB doesn't match Google, DB is always overwritten with Google data
 * - DB-only events (created from Discord) are synced to Google
 * - If DB is newer than Google, DB changes are synced to Google
 * - Discord edits are protected: if Discord event differs from DB, Google sync is skipped
 * - Events outside time range (today to 1 year) are cleaned up from DB
 */

function eventsDiffer(
    discordEvent: { name: string; description?: string | null; startDate: Date; endDate: Date; location?: string | null },
    dbEvent: { name: string; description?: string | null; startDate: Date; endDate: Date; location?: string | null }
): boolean {
    const normalize = (val: string | null | undefined) => (val ?? "").trim();
    const normalizeDate = (date: Date) => new Date(date).getTime();
    
    return (
        normalize(discordEvent.name) !== normalize(dbEvent.name) ||
        normalize(discordEvent.description) !== normalize(dbEvent.description) ||
        normalizeDate(discordEvent.startDate) !== normalizeDate(dbEvent.startDate) ||
        normalizeDate(discordEvent.endDate) !== normalizeDate(dbEvent.endDate) ||
        normalize(discordEvent.location) !== normalize(dbEvent.location)
    );
}

function googleAndDbEventsDiffer(
    googleEvent: { summary?: string | null; description?: string | null; startDate: Date; endDate: Date; location?: string | null; recurringEventId?: string | null; recurrenceRule?: string | null },
    dbEvent: { name: string; description?: string | null; startDate: Date; endDate: Date; location?: string | null; recurringEventId?: string | null; recurrenceRule?: string | null }
): boolean {
    const normalize = (val: string | null | undefined) => (val ?? "").trim();
    const normalizeDate = (date: Date) => new Date(date).getTime();
    
    return (
        normalize(googleEvent.summary) !== normalize(dbEvent.name) ||
        normalize(googleEvent.description) !== normalize(dbEvent.description) ||
        normalizeDate(googleEvent.startDate) !== normalizeDate(dbEvent.startDate) ||
        normalizeDate(googleEvent.endDate) !== normalizeDate(dbEvent.endDate) ||
        normalize(googleEvent.location) !== normalize(dbEvent.location) ||
        normalize(googleEvent.recurringEventId) !== normalize(dbEvent.recurringEventId) ||
        normalize(googleEvent.recurrenceRule) !== normalize(dbEvent.recurrenceRule)
    );
}

export async function syncGoogleAndDatabase(
    guildId: string,
    discordEventsMap?: Map<string, { name: string; description?: string | null; scheduledStartAt: Date | null; scheduledEndAt: Date | null; entityMetadata?: { location?: string | null } | null }>
): Promise<Result<{ synced: number; created: number; deleted: number }, ErrorDetails>> {
    const providerResult = getCalendarProvider("google");
    if (!providerResult.ok) return providerResult;
    const provider = providerResult.value;

    const tokenResult = await getValidAccessToken(guildId, provider);
    if (!tokenResult.ok) return tokenResult;
    const accessToken = tokenResult.value;

    const googleEventsResult = await provider.getEvents(accessToken, Number(config.MAX_EVENTS), Number(config.TIME_RANGE_MONTHS));
    if (!googleEventsResult.ok) return googleEventsResult;
    const googleEvents = googleEventsResult.value;

    const dbEventsResult = await EventModel.getAllEventDetails();
    if (!dbEventsResult.ok) return dbEventsResult;
    const dbEvents = dbEventsResult.value;

    const googleEventMap = new Map(googleEvents.map(e => [e.id, e]));
    const dbEventByProviderId = new Map(dbEvents.map(e => [e.providerEventId, e]));

    let synced = 0;
    let created = 0;
    let deleted = 0;

    const now = new Date();
    const maxDate = new Date(now);
    maxDate.setMonth(maxDate.getMonth() + Number(config.TIME_RANGE_MONTHS));

    const masterRecurrenceCache = new Map<string, string | undefined>();

    for (const googleEvent of googleEvents) {
        const dbEvent = dbEventByProviderId.get(googleEvent.id);

        let recurrenceRule = googleEvent.recurrenceRule;
        if (googleEvent.recurringEventId) {
            if (masterRecurrenceCache.has(googleEvent.recurringEventId)) {
                recurrenceRule = masterRecurrenceCache.get(googleEvent.recurringEventId);
            } else {
                const masterResult = await provider.getMainRecurrenceEvent(accessToken, googleEvent.recurringEventId);
                if (masterResult.ok && masterResult.value.recurrenceRule) {
                    recurrenceRule = masterResult.value.recurrenceRule;
                }
                masterRecurrenceCache.set(googleEvent.recurringEventId, recurrenceRule);
            }
        }

        if (!dbEvent) {
            await EventModel.saveEventDetails({
                providerEventId: googleEvent.id,
                name: googleEvent.summary ?? "Untitled Event",
                description: googleEvent.description,
                startDate: googleEvent.startDate,
                endDate: googleEvent.endDate,
                location: googleEvent.location,
                recurringEventId: googleEvent.recurringEventId,
                recurrenceRule: recurrenceRule,
                discordEventId: "pending", // Will be set when Discord event is created
            });
            created++;
        } else {
            const discordEvent = discordEventsMap?.get(dbEvent.discordEventId);
            if (discordEvent) {
                const discordEventData = {
                    name: discordEvent.name,
                    description: discordEvent.description ?? null,
                    startDate: discordEvent.scheduledStartAt ?? new Date(),
                    endDate: discordEvent.scheduledEndAt ?? new Date(),
                    location: discordEvent.entityMetadata?.location ?? null,
                };
                
                const dbEventData = {
                    name: dbEvent.name,
                    description: dbEvent.description ?? null,
                    startDate: new Date(dbEvent.startDate),
                    endDate: new Date(dbEvent.endDate),
                    location: dbEvent.location ?? null,
                };
                
                if (eventsDiffer(discordEventData, dbEventData)) {
                    continue;
                }
            }
            
            const googleEventData = {
                summary: googleEvent.summary,
                description: googleEvent.description,
                startDate: googleEvent.startDate,
                endDate: googleEvent.endDate,
                location: googleEvent.location,
                recurringEventId: googleEvent.recurringEventId,
                recurrenceRule: recurrenceRule,
            };
            
            const dbEventData = {
                name: dbEvent.name,
                description: dbEvent.description,
                startDate: new Date(dbEvent.startDate),
                endDate: new Date(dbEvent.endDate),
                location: dbEvent.location,
                recurringEventId: dbEvent.recurringEventId,
                recurrenceRule: dbEvent.recurrenceRule,
            };
            
            if (googleAndDbEventsDiffer(googleEventData, dbEventData)) {
                await EventModel.updateEventDetails({
                    providerEventId: googleEvent.id,
                    name: googleEvent.summary ?? "Untitled Event",
                    description: googleEvent.description,
                    startDate: googleEvent.startDate,
                    endDate: googleEvent.endDate,
                    location: googleEvent.location,
                    recurringEventId: googleEvent.recurringEventId,
                    recurrenceRule: recurrenceRule,
                    discordEventId: dbEvent.discordEventId,
                });
                synced++;
            }
        }
    }

    for (const dbEvent of dbEvents) {
        const googleEvent = googleEventMap.get(dbEvent.providerEventId);
        const eventStart = new Date(dbEvent.startDate);
        const eventEnd = new Date(dbEvent.endDate);
        const isPast = eventEnd <= now;
        const isTooFarFuture = eventStart > maxDate;

        if (isPast || isTooFarFuture) {
            const deleteResult = await EventModel.deleteEventDetailsByProviderId(dbEvent.providerEventId);
            if (deleteResult.ok) deleted++;
            continue;
        }

        if (!googleEvent && dbEvent.providerEventId !== "pending") {
            const deleteResult = await EventModel.deleteEventDetailsByProviderId(dbEvent.providerEventId);
            if (deleteResult.ok) deleted++;
        } else if (!googleEvent && dbEvent.providerEventId === "pending") {
            const createResult = await createEventInGoogle(provider, accessToken, dbEvent);
            if (createResult.ok) {
                await EventModel.updateProviderEventId(dbEvent.id, createResult.value.id);
                created++;
            }
        } else if (googleEvent) {
            const googleUpdated = googleEvent.updatedAt ?? new Date(0);
            const dbUpdated = dbEvent.updatedAt ?? new Date(0);

            if (dbUpdated > googleUpdated) {
                let recurrenceRule = googleEvent.recurrenceRule;
                if (googleEvent.recurringEventId) {
                    if (masterRecurrenceCache.has(googleEvent.recurringEventId)) {
                        recurrenceRule = masterRecurrenceCache.get(googleEvent.recurringEventId);
                    } else {
                        const masterResult = await provider.getMainRecurrenceEvent(accessToken, googleEvent.recurringEventId);
                        if (masterResult.ok && masterResult.value.recurrenceRule) {
                            recurrenceRule = masterResult.value.recurrenceRule;
                        }
                        masterRecurrenceCache.set(googleEvent.recurringEventId, recurrenceRule);
                    }
                }
                
                const dbEventData = {
                    name: dbEvent.name,
                    description: dbEvent.description,
                    startDate: new Date(dbEvent.startDate),
                    endDate: new Date(dbEvent.endDate),
                    location: dbEvent.location,
                    recurringEventId: dbEvent.recurringEventId,
                    recurrenceRule: dbEvent.recurrenceRule,
                };
                
                const googleEventData = {
                    summary: googleEvent.summary,
                    description: googleEvent.description,
                    startDate: googleEvent.startDate,
                    endDate: googleEvent.endDate,
                    location: googleEvent.location,
                    recurringEventId: googleEvent.recurringEventId,
                    recurrenceRule: recurrenceRule,
                };
                
                if (googleAndDbEventsDiffer(googleEventData, dbEventData)) {
                    await provider.updateEvent(accessToken, dbEvent.providerEventId, {
                        id: dbEvent.providerEventId,
                        summary: dbEvent.name,
                        description: dbEvent.description,
                        startDate: new Date(dbEvent.startDate),
                        endDate: new Date(dbEvent.endDate),
                        location: dbEvent.location,
                        recurringEventId: dbEvent.recurringEventId,
                        recurrenceRule: dbEvent.recurrenceRule ?? undefined,
                    });
                    synced++;
                }
            }
        }
    }

    return ok({ synced, created, deleted });
}

async function createEventInGoogle(
    provider: CalendarProvider,
    accessToken: string,
    dbEvent: { name: string; description?: string | null; startDate: Date; endDate: Date; location?: string | null; recurrenceRule?: string | null }
): Promise<Result<IEvent, ErrorDetails>> {
    const iEvent: IEvent = {
        id: "",
        summary: dbEvent.name,
        description: dbEvent.description,
        startDate: new Date(dbEvent.startDate),
        endDate: new Date(dbEvent.endDate),
        location: dbEvent.location,
        recurrenceRule: dbEvent.recurrenceRule ?? undefined,
    };

    return provider.createEvent(accessToken, iEvent);
}
