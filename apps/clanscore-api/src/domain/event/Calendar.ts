import mongoose from "mongoose";

const calendarSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    expirationTime: { type: Number, required: true },
    eventOverviewMessageId: { type: String, required: false, default: null },
});

export interface ICalendar {
    _id: mongoose.Types.ObjectId;
    guildId: string;
    accessToken: string;
    refreshToken: string;
    expirationTime: number;
    eventOverviewMessageId: string;
}

export type CalendarInput = Omit<ICalendar, "_id">;

export const Calendar = mongoose.model<ICalendar>("Calendar", calendarSchema);
