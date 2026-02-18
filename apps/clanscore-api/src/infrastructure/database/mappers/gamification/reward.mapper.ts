import mongoose from "mongoose";
import { toId } from "../core";
import type { IReward } from "../../../../domain/gamification/Reward";
import { RewardDTO } from "@clanscore/shared";

export type RewardEntity = {
    _id: string;
    name: string;
    description: string;
    pointsCost: number;
    clubCostShare?: mongoose.Types.Decimal128 | null;
};

export const toRewardEntity = (doc: IReward): RewardEntity => ({
    _id: toId(doc),
    name: doc.name,
    description: doc.description,
    pointsCost: doc.pointsCost,
    clubCostShare: doc.clubCostShare ?? null,
});


export const toRewardDTO = (doc: RewardEntity): RewardDTO => {
    const clubCostShare = doc.clubCostShare 
        ? (typeof doc.clubCostShare === 'object' && 'toString' in doc.clubCostShare 
            ? parseFloat(doc.clubCostShare.toString()) 
            : Number(doc.clubCostShare))
        : 0;
    
    return {
        id: doc._id,
        name: doc.name,
        description: doc.description,
        pointsCost: doc.pointsCost,
        clubCostShare: clubCostShare,
    };
};