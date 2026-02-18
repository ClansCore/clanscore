import { Request, Response } from "express";
import { sendError } from "../middleware/error.middleware";
import { ErrorType } from "@clanscore/shared";
import { EventModel } from "../../application/event/event.model";
import { toCalendarDTO } from "../../infrastructure/database/mappers/event/calendar.mapper";
import { getCalendarProvider } from "../../infrastructure/external/calendar";
import { getProviderEventsForGuild, syncGoogleAndDatabase } from "../../application/event/event-sync.service";
import { getValidAccessToken } from "../../application/event/event-token.service";
import { mapDiscordEventToIEvent } from "../../application/event/discord-event.mapper";

export async function saveCalendarInfo(req: Request, res: Response) {
    const { guildId } = req.params;
    const { accessToken, refreshToken, expirationTime } = req.body;

    if (!accessToken || !refreshToken || !expirationTime) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Missing token data" },
        });
    }

    const r = await EventModel.saveCalendarInfo(
        guildId,
        accessToken,
        refreshToken,
        expirationTime
    );

    if (!r.ok) return sendError(res, r.error);
    return res.json(toCalendarDTO(r.value));
}

export async function getCalendarInfo(req: Request, res: Response) {
    const { guildId } = req.params;

    const r = await EventModel.getCalendarInfo(guildId);
    if (!r.ok) return sendError(res, r.error);

    return res.json(toCalendarDTO(r.value));
}

export async function generateCalendarLinkUrl(req: Request, res: Response) {
    const guildId = String(req.query.guildId);
    if (!guildId) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "guildId missing" }
        });
    }

    const provider = getCalendarProvider("google");
    if (!provider.ok) return sendError(res, provider.error);

    const url = provider.value.generateCalendarLinkUrl(guildId);
    if (!url.ok) return sendError(res, url.error);

    return res.json({ url: url.value });
}

export async function handleOAuthCallback(req: Request, res: Response) {
    const authCode = String(req.query.code);
    const guildId = String(req.query.state);

    if (!authCode || !guildId) {
        return res.status(400).send("Missing code or guildId");
    }

    const provider = getCalendarProvider("google");
    if (!provider.ok) return res.status(500).send("Provider error");

    const tokens = await provider.value.getTokens(authCode);
    if (!tokens.ok) return res.status(500).send("Token exchange failed");

    const saved = await EventModel.saveCalendarInfo(
        guildId,
        tokens.value.accessToken,
        tokens.value.refreshToken,
        tokens.value.expirationTime
    );

    if (!saved.ok) return res.status(500).send("Saving tokens failed");

    return res.send("Kalender erfolgreich verknüpft! Du kannst das Fenster schliessen.");
}

export async function syncCalendar(req: Request, res: Response) {
    const { guildId, discordEvents } = req.body;
    if (!guildId) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "guildId missing" }
        });
    }

    let discordEventsMap: Map<string, { name: string; description?: string | null; scheduledStartAt: Date | null; scheduledEndAt: Date | null; entityMetadata?: { location?: string | null } | null }> | undefined;
    if (discordEvents && Array.isArray(discordEvents)) {
        discordEventsMap = new Map();
        for (const event of discordEvents) {
            if (event.id) {
                discordEventsMap.set(event.id, {
                    name: event.name,
                    description: event.description,
                    scheduledStartAt: event.scheduledStartAt ? new Date(event.scheduledStartAt) : null,
                    scheduledEndAt: event.scheduledEndAt ? new Date(event.scheduledEndAt) : null,
                    entityMetadata: event.entityMetadata,
                });
            }
        }
    }

    const syncResult = await syncGoogleAndDatabase(guildId, discordEventsMap);
    if (!syncResult.ok) return sendError(res, syncResult.error);

    return res.json({ 
        ok: true,
        synced: syncResult.value.synced,
        created: syncResult.value.created,
        deleted: syncResult.value.deleted
    });
}

export async function createFromDiscord(req: Request, res: Response) {
    const { guildId, event: discordEvent } = req.body;
    
    if (!guildId || !discordEvent) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "guildId and event are required" }
        });
    }

    const iEvent = mapDiscordEventToIEvent(discordEvent);

    const dbResult = await EventModel.saveEventDetails({
        providerEventId: "pending",
        discordEventId: discordEvent.id,
        name: iEvent.summary ?? "Untitled Event",
        description: iEvent.description,
        startDate: iEvent.startDate,
        endDate: iEvent.endDate,
        location: iEvent.location,
        recurringEventId: null, // Will be set after Google Calendar creation
        recurrenceRule: iEvent.recurrenceRule,
    });

    if (!dbResult.ok) return sendError(res, dbResult.error);

    const provider = getCalendarProvider("google");
    if (!provider.ok) {
        await EventModel.deleteEventDetailsByDiscordId(discordEvent.id);
        return sendError(res, provider.error);
    }

    const tokenResult = await getValidAccessToken(guildId, provider.value);
    if (!tokenResult.ok) {
        await EventModel.deleteEventDetailsByDiscordId(discordEvent.id);
        return sendError(res, tokenResult.error);
    }

    const googleResult = await provider.value.createEvent(tokenResult.value, iEvent);
    if (!googleResult.ok) {
        await EventModel.deleteEventDetailsByDiscordId(discordEvent.id);
        return sendError(res, googleResult.error);
    }

    const updateResult = await EventModel.updateEventDetails({
        providerEventId: googleResult.value.id,
        discordEventId: discordEvent.id,
        name: iEvent.summary ?? "Untitled Event",
        description: iEvent.description,
        startDate: iEvent.startDate,
        endDate: iEvent.endDate,
        location: iEvent.location,
        recurringEventId: googleResult.value.recurringEventId,
        recurrenceRule: googleResult.value.recurrenceRule,
    });

    if (!updateResult.ok) return sendError(res, updateResult.error);
    return res.json({ ok: true });
}

export async function updateFromDiscord(req: Request, res: Response) {
    const { guildId, event: discordEvent } = req.body;
    
    if (!guildId || !discordEvent) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "guildId and event are required" }
        });
    }

    const iEvent = mapDiscordEventToIEvent(discordEvent);

    let existing = await EventModel.getEventDetailsByDiscordEventId(discordEvent.id);
        
    // Check if this is an exception (edited instance of a recurring event)
    // An exception is a Discord event without recurrence rule, but it belongs to a master event
    if (!existing.ok && !discordEvent.recurrenceRule) {
        const allEvents = await EventModel.getAllEventDetails();
        if (allEvents.ok) {
            // Find master events (events with recurrence rule) that match the name
            const masterEvents = allEvents.value.filter(
                e => e.name === discordEvent.name && 
                     e.recurrenceRule && 
                     e.discordEventId !== discordEvent.id
            );
            
            for (const masterEvent of masterEvents) {
                // Try to find the instance by master event ID and start time
                const instanceResult = await EventModel.getEventDetailsByDiscordMasterEventIdAndStartTime(
                    masterEvent.discordEventId,
                    iEvent.startDate
                );
                
                if (instanceResult.ok) {
                    existing = instanceResult;
                    break;
                }
            }
        }
    }
    
    // Fallback: Search by name and start time if Discord ID not found
    // This handles events that came from Google Calendar and have discordEventId: "pending"
    if (!existing.ok) {
        existing = await EventModel.getEventDetailsByNameAndStartTime(
            iEvent.summary ?? "",
            iEvent.startDate
        );
    }
    
    if (!existing.ok) {
        return sendError(res, {
            type: ErrorType.NotFound,
            details: { message: "Event not found in database" }
        });
    }

    const provider = getCalendarProvider("google");
    if (!provider.ok) return sendError(res, provider.error);

    const tokenResult = await getValidAccessToken(guildId, provider.value);
    if (!tokenResult.ok) return sendError(res, tokenResult.error);

    const googleResult = await provider.value.updateEvent(
        tokenResult.value,
        existing.value.providerEventId,
        iEvent
    );
    if (!googleResult.ok) return sendError(res, googleResult.error);

    const dbResult = await EventModel.updateEventDetails({
        providerEventId: existing.value.providerEventId,
        discordEventId: discordEvent.id,
        name: iEvent.summary ?? "Untitled Event",
        description: iEvent.description,
        startDate: iEvent.startDate,
        endDate: iEvent.endDate,
        location: iEvent.location,
        recurringEventId: googleResult.value.recurringEventId,
        recurrenceRule: googleResult.value.recurrenceRule,
    });

    if (!dbResult.ok) return sendError(res, dbResult.error);
    return res.json({ ok: true });
}

export async function deleteFromDiscord(req: Request, res: Response) {
    const { guildId, discordEventId } = req.body;
    
    if (!guildId || !discordEventId) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "guildId and discordEventId are required" }
        });
    }

    const existing = await EventModel.getEventDetailsByDiscordEventId(discordEventId);
    if (!existing.ok) {
        return res.json({ ok: true });
    }

    const providerEventId = existing.value.providerEventId;

    const dbResult = await EventModel.deleteEventDetailsByDiscordId(discordEventId);
    if (!dbResult.ok) return sendError(res, dbResult.error);

    if (providerEventId && providerEventId !== "pending") {
        const provider = getCalendarProvider("google");
        if (!provider.ok) {
            return res.json({ ok: true });
        }

        const tokenResult = await getValidAccessToken(guildId, provider.value);
        if (!tokenResult.ok) {
            return res.json({ ok: true });
        }

        const googleResult = await provider.value.deleteEvent(
            tokenResult.value,
            providerEventId
        );
        if (!googleResult.ok) {
            return res.json({ ok: true });
        }
    }

    return res.json({ ok: true });
}

export async function saveDiscordEventOverviewMessageId(req: Request, res: Response) {
    const { guildId } = req.params;
    const { eventOverviewMessageId } = req.body;

    if (!eventOverviewMessageId) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Missing eventOverviewMessageId" },
        });
    }

    const r = await EventModel.saveEventOverviewMessageId(guildId, eventOverviewMessageId);
    if (!r.ok) return sendError(res, r.error);

    return res.json(toCalendarDTO(r.value));
}

export async function getProviderEvents(req: Request, res: Response) {
    const guildId = req.query.guildId as string;
    const limit = req.query.limit ? Number(req.query.limit) : 5;

    const result = await getProviderEventsForGuild(guildId, limit);
    if (!result.ok) return sendError(res, result.error);

    return res.json(result.value);
}
