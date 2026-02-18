import mongoose from "mongoose";

const personSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    nickname: { type: String, default: null },
    discordId: { type: String, default: null },
    birthdate: { type: Date, required: true },
    address: { type: String, required: true },
    email: { type: String, default: null },
    phone: { type: String, default: null },
    notes: { type: String, default: null },
    status: {
        type: String,
        enum: ["Pending", "Accepted", "ToBeDeleted"],
        default: "Pending",
    },
    hasPaid: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    applicationMessageId: { type: String, default: null },
    deletionDate: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    webPW: {type: String, default: null},
});

export interface IPerson {
    _id: mongoose.Types.ObjectId;
    firstName: string;
    lastName: string;
    nickname?: string | null;
    discordId?: string | null;
    birthdate: Date;
    address: string;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
    status?: "Pending" | "Accepted" | "ToBeDeleted";
    hasPaid: boolean;
    score: number;
    applicationMessageId?: string | null;
    deletionDate?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
    webPW?: string | null;
}

export type PersonInput = Omit<IPerson, "_id">;

export const Person = mongoose.model<IPerson>("Person", personSchema);
