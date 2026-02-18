import mongoose from "mongoose";

// de: Transaktion
const transactionSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    amountUsed: { type: Number, default: null },
    status: {
        type: String,
        enum: ["Pending", "Done", "Failed"],
        required: true,
    },
    notes: { type: String, default: null },
    expiredOn: {type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    personId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Person",
        required: true,
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
        default: null,
    },
    donationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Donation",
        default: null,
    },
    rewardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Reward",
        default: null,
    },
    leaderboardTransaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LeaderboardTransaction",
        default: null,
    },
});

export interface ITransaction {
    _id: mongoose.Types.ObjectId;
    amount: number;
    amountUsed?: number | null;
    status: "Pending" | "Done" | "Failed";
    notes?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    personId: mongoose.Types.ObjectId;
    taskId?: mongoose.Types.ObjectId | null;
    donationId?: mongoose.Types.ObjectId | null;
    rewardId?: mongoose.Types.ObjectId | null;
    leaderboardTransaction?: mongoose.Types.ObjectId | null;
}

export type TransactionInput = Omit<ITransaction, "_id">;

export const Transaction = mongoose.model<ITransaction>(
    "Transaction",
    transactionSchema,
);
