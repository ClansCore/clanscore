import { Router } from "express";
import * as ctl from "../controllers/calendar.controller";

export const calendarRouter = Router();

calendarRouter.put("/info/:guildId", ctl.saveCalendarInfo);
calendarRouter.get("/info/:guildId", ctl.getCalendarInfo);

calendarRouter.get("/link-url", ctl.generateCalendarLinkUrl);
calendarRouter.get("/callback", ctl.handleOAuthCallback);

// GOOGLE -> DB
calendarRouter.post("/sync", ctl.syncCalendar);

// DISCORD -> DB -> GOOGLE
calendarRouter.post("/from-discord/create", ctl.createFromDiscord);
calendarRouter.patch("/from-discord/update", ctl.updateFromDiscord);
calendarRouter.delete("/from-discord/delete", ctl.deleteFromDiscord);

calendarRouter.patch("/info/:guildId/overview-message", ctl.saveDiscordEventOverviewMessageId);

calendarRouter.get("/provider-events", ctl.getProviderEvents);
