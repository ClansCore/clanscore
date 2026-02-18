import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    pointsCost: { type: Number, required: true },
    clubCostShare: {type: mongoose.Types.Decimal128, default: null}
});

export interface IReward {
    _id: mongoose.Types.ObjectId;
    name: string;
    description: string;
    pointsCost: number;
    clubCostShare: mongoose.Types.Decimal128
}

export type RewardInput = Omit<IReward, "_id">;

export const Reward = mongoose.model<IReward>("Reward", rewardSchema);
