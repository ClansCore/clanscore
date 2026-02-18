import mongoose from "mongoose";

// de: Erinnerung
const reminderSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    text: { type: String, default: null },
    eventId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Event",
                default: null,
    },
    membershipFeeId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "MembershipFee",
                default: null,
    },
    createdAt: { type: Date, default: Date.now },
});

export interface IReminder {
    _id: mongoose.Types.ObjectId;
    date: Date;
    text: String;
    eventId?: mongoose.Schema.Types.ObjectId | null;
    membershipFeeId?: mongoose.Schema.Types.ObjectId | null;
    createdAt: Date;
}

export type ReminderInput = Omit<IReminder, "_id">;

export const Reminder = mongoose.model<IReminder>(
    "Reminder",
    reminderSchema,
);