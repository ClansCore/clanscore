import mongoose from "mongoose";
import * as db from "../../infrastructure/database/event.db.service";
import { EventDetailsInput } from "./event.types";

export class EventModel {
    static getCalendarInfo(guildId: string) {
        return db.getCalendarInfo(guildId);
    }

    static saveCalendarInfo(
        guildId: string,
        accessToken: string,
        refreshToken: string,
        expirationTime: number,
    ) {
        return db.saveCalendarInfo(
            guildId,
            accessToken,
            refreshToken,
            expirationTime,
        );
    }

    static saveEventOverviewMessageId(
        guildId: string,
        eventOverviewMessageId: string,
    ) {
        return db.saveEventOverviewMessageId(guildId, eventOverviewMessageId);
    }

    static getEventDetail(eventId: string | mongoose.Types.ObjectId) {
        return db.getEventDetail(eventId);
    }

    static saveEventDetails(eventData: EventDetailsInput) {
        return db.saveEventDetails(eventData);
    }

    static updateEventDetails(eventData: EventDetailsInput) {
        return db.updateEventDetails(eventData);
    }

    static getAllEventDetails() {
        return db.getAllEventDetails();
    }

    static getEventDetailsByDiscordEventId(discordEventId: string) {
        return db.getEventDetailsByDiscordEventId(discordEventId);
    }

    static getEventDetailsByNameAndStartTime(name: string, startDate: Date) {
        return db.getEventDetailsByNameAndStartTime(name, startDate);
    }

    static getEventDetailsByDiscordMasterEventIdAndStartTime(discordMasterEventId: string, startDate: Date) {
        return db.getEventDetailsByDiscordMasterEventIdAndStartTime(discordMasterEventId, startDate);
    }

    static updateDiscordId(providerEventId: string, discordEventId: string) {
        return db.updateDiscordId(providerEventId, discordEventId);
    }

    static getUpcomingEvents(limit: number) {
        return db.getUpcomingEvents(limit);
    }

    static getEventDetailsByProviderId(providerEventId: string) {
        return db.getEventDetailsByProviderId(providerEventId);
    }

    static deleteEventDetailsByDiscordId(discordEventId: string) {
        return db.deleteEventDetailsByDiscordId(discordEventId);
    }

    static deleteEventDetailsByProviderId(providerEventId: string) {
        return db.deleteEventDetailsByProviderId(providerEventId);
    }

    static updateProviderEventId(eventId: string, newProviderEventId: string) {
        return db.updateProviderEventId(eventId, newProviderEventId);
    }

    static getEventsInTimeRange(startDate: Date, endDate: Date) {
        return db.getEventsInTimeRange(startDate, endDate);
    }
}
