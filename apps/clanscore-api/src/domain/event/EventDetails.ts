import mongoose from "mongoose";

// de: Event
const eventDetailsSchema = new mongoose.Schema({
    providerEventId: { type: String, required: true },
    discordEventId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: null },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    location: { type: String, default: null },
    discordHeaderImage: { type: Buffer, default: null },
    recurringEventId: { type: String, default: null },
    recurrenceRule: { type: String, default: null },
    // For recurring events: ID of the Discord master event (the one with recurrence rule)
    // Individual instances that are edited become exceptions with their own discordEventId
    discordMasterEventId: { type: String, default: null },
    updatedAt: { type: Date, default: Date.now },
});

export interface IEventDetails {
    _id: mongoose.Types.ObjectId;
    providerEventId: string;
    discordEventId: string;
    name: string;
    description?: string | null;
    startDate: Date;
    endDate: Date;
    location?: string | null;
    discordHeaderImage?: Buffer | null;
    recurringEventId?: string | null;
    recurrenceRule?: string | null;
    discordMasterEventId?: string | null;
    updatedAt: Date;
}

export type EventDetailsInput = Omit<IEventDetails, "_id" | "updatedAt"> & {
    updatedAt?: Date;
};

export const EventDetails = mongoose.model<IEventDetails>(
    "EventDetails",
    eventDetailsSchema,
);
