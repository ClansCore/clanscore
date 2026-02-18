import { Request, Response } from "express";
import { sendError } from "../middleware/error.middleware";
import { EventModel } from "../../application/event/event.model";
import { toEventDetailsDTO } from "../../infrastructure/database/mappers/event/eventDetails.mapper";

export async function getAllEventDetails(req: Request, res: Response) {
    const r = await EventModel.getAllEventDetails();
    if (!r.ok) return sendError(res, r.error);

    return res.json(r.value.map(toEventDetailsDTO));
}

export async function getEventDetail(req: Request, res: Response) {
    const { eventId } = req.params;

    const r = await EventModel.getEventDetail(eventId);
    if (!r.ok) return sendError(res, r.error);

    return res.json(toEventDetailsDTO(r.value));
}

export async function getUpcomingEvents(req: Request, res: Response) {
    const limit = Number(req.query.limit ?? 5);

    const upcoming = await EventModel.getUpcomingEvents(limit);
    if (!upcoming.ok) return sendError(res, upcoming.error);

    return res.json(upcoming.value.map(toEventDetailsDTO));
}


export async function getEventDetailsByDiscordEventId(req: Request, res: Response) {
    const { discordEventId } = req.params;

    const r = await EventModel.getEventDetailsByDiscordEventId(discordEventId);
    if (!r.ok) return sendError(res, r.error);

    return res.json(toEventDetailsDTO(r.value));
}

export async function saveEventDetails(req: Request, res: Response) {
    const eventData = req.body;

    const r = await EventModel.saveEventDetails(eventData);
    if (!r.ok) return sendError(res, r.error);

    return res.json(toEventDetailsDTO(r.value));
}

export async function updateEventDetails(req: Request, res: Response) {
    const { providerEventId, discordEventId } = req.body;

    // Spezialfall: Nur Discord-Mapping setzen
    if (providerEventId && discordEventId && Object.keys(req.body).length === 2) {
        const r = await EventModel.updateDiscordId(providerEventId, discordEventId);
        if (!r.ok) return sendError(res, r.error);
        return res.json({ ok: true });
    }

    // Normalfall: Eventdaten aktualisieren
    const r = await EventModel.updateEventDetails(req.body);
    if (!r.ok) return sendError(res, r.error);

    return res.json(toEventDetailsDTO(r.value));
}
