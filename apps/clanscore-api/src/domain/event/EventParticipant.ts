import mongoose from "mongoose";

// de: EventTeilnehmer
const eventParticipantSchema = new mongoose.Schema({
    registrationDate: { type: Date, required: true },
    personId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Person",
        required: true,
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EventDetails",
        required: true,
    },
});

export interface IEventParticipant {
    _id: mongoose.Types.ObjectId;
    registrationDate: Date;
    personId: mongoose.Types.ObjectId;
    eventId: mongoose.Types.ObjectId;
}

export type EventParticipantInput = Omit<IEventParticipant, "_id">;

export const EventParticipant = mongoose.model<IEventParticipant>(
    "EventParticipant",
    eventParticipantSchema,
);
