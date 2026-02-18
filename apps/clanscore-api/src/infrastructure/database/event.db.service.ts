import mongoose from "mongoose";
import { handleMongooseError } from "../errors/mongooseAdapter";
import {
    ErrorType,
    ErrorDetails,
    ok,
    Result,
    err,
} from "@clanscore/shared";
import { Calendar } from "../../domain/event/Calendar";
import {
    EventDetails,
    EventDetailsInput,
} from "../../domain/event/EventDetails";
import { EventDetailsEntity, toEventDetailsEntity } from "./mappers/event/eventDetails.mapper";
import { CalendarEntity, toCalendarEntity } from "./mappers/event/calendar.mapper";

export async function saveCalendarInfo(
    guildId: string,
    accessToken: string,
    refreshToken: string,
    expirationTime: number,
): Promise<Result<CalendarEntity, ErrorDetails>> {
    try {
        const calendarInfo = await Calendar.findOneAndUpdate(
            { guildId },
            { accessToken, refreshToken, expirationTime },
            { upsert: true, new: true },
        );
        return ok(toCalendarEntity(calendarInfo));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function saveEventOverviewMessageId(
    guildId: string,
    eventOverviewMessageId: string,
): Promise<Result<CalendarEntity, ErrorDetails>> {
    try {
        const calendarInfo = await Calendar.findOneAndUpdate(
            { guildId },
            { eventOverviewMessageId },
            { new: true, lean: true },
        );
        if (!calendarInfo) return err(ErrorType.CalendarNotFound);
        return ok(toCalendarEntity(calendarInfo));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getCalendarInfo(
    guildId: string,
): Promise<Result<CalendarEntity, ErrorDetails>> {
    try {
        const calendar = await Calendar.findOne({ guildId });
        if (!calendar) return err(ErrorType.CalendarNotFound);
        return ok(toCalendarEntity(calendar));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getEventDetail(
    eventId: string | mongoose.Types.ObjectId,
): Promise<Result<EventDetailsEntity, ErrorDetails>> {
    try {
        const eventDetail = await EventDetails.findById(eventId).lean();
        if (!eventDetail) return err(ErrorType.EventDetailsNotFound);
        return ok(toEventDetailsEntity(eventDetail));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function saveEventDetails(
    eventData: EventDetailsInput,
): Promise<Result<EventDetailsEntity, ErrorDetails>> {
    try {
        const saved = await new EventDetails(eventData).save();
        return ok(toEventDetailsEntity(saved.toObject()));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function updateEventDetails(
    eventData: EventDetailsInput,
): Promise<Result<EventDetailsEntity, ErrorDetails>> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {
            name: eventData.name,
            description: eventData.description,
            startDate: eventData.startDate,
            endDate: eventData.endDate,
            location: eventData.location,
            discordEventId: eventData.discordEventId,
            updatedAt: new Date(),
        };
        
        if (eventData.providerEventId && eventData.providerEventId !== "pending") {
            updateData.providerEventId = eventData.providerEventId;
        }
        
        if (eventData.discordMasterEventId !== undefined) {
            updateData.discordMasterEventId = eventData.discordMasterEventId;
        }
        if (eventData.recurringEventId !== undefined) {
            updateData.recurringEventId = eventData.recurringEventId;
        }
        if (eventData.recurrenceRule !== undefined) {
            updateData.recurrenceRule = eventData.recurrenceRule;
        }
        
        let updatedEvent = await EventDetails.findOneAndUpdate(
            { providerEventId: eventData.providerEventId },
            { $set: updateData },
            { new: true, lean: true },
        );
        
        if (!updatedEvent && eventData.discordEventId) {
            updatedEvent = await EventDetails.findOneAndUpdate(
                { discordEventId: eventData.discordEventId },
                { $set: updateData },
                { new: true, lean: true },
            );
        }
        
        if (!updatedEvent) return err(ErrorType.EventDetailsNotFound);
        return ok(toEventDetailsEntity(updatedEvent));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function updateDiscordId(
    providerEventId: string,
    discordEventId: string
): Promise<Result<EventDetailsEntity, ErrorDetails>> {
    try {
        const updated = await EventDetails.findOneAndUpdate(
            { providerEventId },
            { discordEventId },
            { new: true, lean: true },
        );

        if (!updated) return err(ErrorType.EventDetailsNotFound);

        return ok(toEventDetailsEntity(updated));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getAllEventDetails() {
    try {
        const events = await EventDetails.find().lean();
        return ok(events.map(toEventDetailsEntity));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getEventDetailsByDiscordMasterEventIdAndStartTime(
    discordMasterEventId: string,
    startDate: Date,
): Promise<Result<EventDetailsEntity, ErrorDetails>> {
    try {
        const startMin = new Date(startDate.getTime() - 60000);
        const startMax = new Date(startDate.getTime() + 60000);
        
        const event = await EventDetails.findOne({
            discordMasterEventId,
            startDate: { $gte: startMin, $lte: startMax }
        }).lean();
        
        if (!event) return err(ErrorType.EventDetailsNotFound);
        return ok(toEventDetailsEntity(event));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getEventDetailsByNameAndStartTime(
    name: string,
    startDate: Date,
): Promise<Result<EventDetailsEntity, ErrorDetails>> {
    try {
        const startMin = new Date(startDate.getTime() - 60000);
        const startMax = new Date(startDate.getTime() + 60000);
        
        let event = await EventDetails.findOne({
            name,
            startDate: { $gte: startMin, $lte: startMax }
        }).lean();
        
        if (!event) {
            const events = await EventDetails.find({
                startDate: { $gte: startMin, $lte: startMax }
            }).lean();
            
            if (events.length === 1) {
                event = events[0];
            }
        }
        
        if (!event) return err(ErrorType.EventDetailsNotFound);
        return ok(toEventDetailsEntity(event));
    } catch (e) {
        return handleMongooseError(e);
    }
}

export async function getEventDetailsByDiscordEventId(
    discordEventId: string,
): Promise<Result<EventDetailsEntity, ErrorDetails>> {
    try {
        const eventDetails = await EventDetails
            .findOne({ discordEventId }).lean();
        if (!eventDetails) return err(ErrorType.EventDetailsNotFound);
        return ok(toEventDetailsEntity(eventDetails));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getUpcomingEvents(limit: number) {
    try {
        const events = await EventDetails.find({
            endDate: { $gte: new Date() }
        })
        .sort({ startDate: 1 })
        .limit(limit)
        .lean();

        return ok(events.map(toEventDetailsEntity));
    } catch (e) {
        return err(ErrorType.EventDetailsNotFound, { message: (e as Error).message });
    }
}

export async function getEventDetailsByProviderId(providerEventId: string) {
    try {
        const event = await EventDetails.findOne({ providerEventId }).lean();
        if (!event) return err(ErrorType.EventDetailsNotFound);
        return ok(toEventDetailsEntity(event));
    } catch (e) {
        return handleMongooseError(e);
    }
}

export async function deleteEventDetailsByDiscordId(
    discordEventId: string,
): Promise<Result<boolean, ErrorDetails>> {
    try {
        const result = await EventDetails.deleteOne({ discordEventId });
        if (result.deletedCount === 0) return err(ErrorType.EventDetailsNotFound);
        return ok(true);
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function deleteEventDetailsByProviderId(
    providerEventId: string,
): Promise<Result<boolean, ErrorDetails>> {
    try {
        const result = await EventDetails.deleteOne({ providerEventId });
        if (result.deletedCount === 0) return err(ErrorType.EventDetailsNotFound);
        return ok(true);
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function updateProviderEventId(
    eventId: string,
    newProviderEventId: string,
): Promise<Result<EventDetailsEntity, ErrorDetails>> {
    try {
        const updated = await EventDetails.findByIdAndUpdate(
            eventId,
            { providerEventId: newProviderEventId, updatedAt: new Date() },
            { new: true, lean: true },
        );
        if (!updated) return err(ErrorType.EventDetailsNotFound);
        return ok(toEventDetailsEntity(updated));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getEventsInTimeRange(
    startDate: Date,
    endDate: Date,
): Promise<Result<EventDetailsEntity[], ErrorDetails>> {
    try {
        const events = await EventDetails.find({
            startDate: { $lte: endDate },
            endDate: { $gte: startDate },
        }).lean();
        return ok(events.map(toEventDetailsEntity));
    } catch (error) {
        return handleMongooseError(error);
    }
}
