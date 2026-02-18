import mongoose from "mongoose";

// de: RanglistenEintrag
const leaderboardEntrySchema = new mongoose.Schema({
    score: { type: Number, required: true },
    leaderboardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Leaderboard",
        required: true,
    },
    personId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Person",
        required: true,
    },
});

export interface ILeaderboardEntry {
    _id: mongoose.Types.ObjectId;
    score: number;
    leaderboardId: mongoose.Types.ObjectId;
    personId: mongoose.Types.ObjectId;
}

export type PopulatedLeaderboardEntry = {
    _id: mongoose.Types.ObjectId;
    leaderboardId: mongoose.Types.ObjectId;
    personId: {
        _id: mongoose.Types.ObjectId;
        nickname: string | null;
    };
    score: number;
    __v: number;
};

export type LeaderboardEntryInput = Omit<ILeaderboardEntry, "_id">;

export const LeaderboardEntry = mongoose.model<ILeaderboardEntry>(
    "LeaderboardEntry",
    leaderboardEntrySchema,
);
