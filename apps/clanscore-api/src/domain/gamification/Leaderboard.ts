import mongoose from "mongoose";

// de: Rangliste
const leaderboardSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: null },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    numberVisibleEntries: { type: Number, required: true },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Person",
        required: true,
    },
});

export interface ILeaderboard {
    _id: mongoose.Types.ObjectId;
    name: string;
    description?: string | null;
    startDate: Date;
    endDate: Date;
    numberVisibleEntries: number;
    createdBy: mongoose.Types.ObjectId;
}

export type LeaderboardInput = Omit<ILeaderboard, "_id">;

export const Leaderboard = mongoose.model<ILeaderboard>(
    "Leaderboard",
    leaderboardSchema,
);
