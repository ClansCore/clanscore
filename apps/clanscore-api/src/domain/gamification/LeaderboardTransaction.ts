import mongoose from "mongoose";

// de: RanglistenTransaktion
const leaderboardTransactionSchema = new mongoose.Schema({
    createdAt: { type: Date, default: Date.now },
    leaderboardEntryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LeaderboardEntry",
        required: true,
    },
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
        required: true,
    },
});

export interface ILeaderboardTransaction {
    _id: mongoose.Types.ObjectId;
    createdAt?: Date;
    leaderboardEntryId: mongoose.Types.ObjectId;
    transactionId: mongoose.Types.ObjectId;
}

export type LeaderboardTransactionInput = Omit<ILeaderboardTransaction, "_id">;

export const LeaderboardTransaction = mongoose.model<ILeaderboardTransaction>(
    "LeaderboardTransaction",
    leaderboardTransactionSchema,
);
