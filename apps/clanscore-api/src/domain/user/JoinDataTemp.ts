import mongoose from "mongoose";

const joinDataTempSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    step1Data: {
        firstName: String,
        lastName: String,
        nickname: String,
        birthdate: String,
    },
    createdAt: { type: Date, default: Date.now, expires: 1800 }, // Auto-delete after 30 minutes
});

export interface IJoinDataTemp {
    _id: mongoose.Types.ObjectId;
    discordId: string;
    step1Data: {
        firstName: string;
        lastName: string;
        nickname: string;
        birthdate: string;
    };
    createdAt: Date;
}

export type JoinDataTempInput = Omit<IJoinDataTemp, "_id">;

export const JoinDataTemp = mongoose.model<IJoinDataTemp>(
    "JoinStep",
    joinDataTempSchema,
);
