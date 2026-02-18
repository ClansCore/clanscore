import { Router } from "express";
import * as ctl from "../controllers/events.controller";

export const eventsRouter = Router();

eventsRouter.get("/", ctl.getAllEventDetails);
eventsRouter.post("/", ctl.saveEventDetails);
eventsRouter.patch("/", ctl.updateEventDetails);

eventsRouter.get("/upcoming", ctl.getUpcomingEvents);
eventsRouter.get("/:eventId", ctl.getEventDetail);
eventsRouter.get("/by-discord/:discordEventId", ctl.getEventDetailsByDiscordEventId);
