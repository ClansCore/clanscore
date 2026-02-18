import { Request, Response } from "express";
import { ErrorType } from "@clanscore/shared";
import { sendError } from "../middleware/error.middleware";
import { GamificationModel } from "../../application/gamification/gamification.model";
import { toRewardDTO } from "../../infrastructure/database/mappers/gamification/personData.mapper";
import { toTransactionDTO } from "../../infrastructure/database/mappers/gamification/personData.mapper";
import {
    claimRewardCore,
    acceptRewardClaimCore,
    denyRewardClaimCore,
} from "../../application/gamification/reward.service";
import type { RewardInput } from "../../domain/gamification/Reward";
import { RewardEntity } from "../../infrastructure/database/mappers/gamification/reward.mapper";

export async function getRewards(req: Request, res: Response) {
    const result = await GamificationModel.getRewards();
    if (!result.ok) return sendError(res, result.error);
    return res.json(result.value.map(toRewardDTO));
}

export async function claimReward(req: Request, res: Response) {
    const { id } = req.params;
    const { discordId } = req.body;

    if (!discordId) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Missing discordId in body" },
        });
    }

    const result = await claimRewardCore(id, discordId);
    if (!result.ok) return sendError(res, result.error);
    return res.json(toTransactionDTO(result.value));
}

export async function acceptRewardClaim(req: Request, res: Response) {
    const { transactionId } = req.body;

    if (!transactionId) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Missing transactionId in body" },
        });
    }

    const result = await acceptRewardClaimCore(transactionId);
    if (!result.ok) return sendError(res, result.error);
    return res.json(result.value);
}

export async function denyRewardClaim(req: Request, res: Response) {
    const { transactionId } = req.body;

    if (!transactionId) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Missing transactionId in body" },
        });
    }

    const result = await denyRewardClaimCore(transactionId);
    if (!result.ok) return sendError(res, result.error);
    return res.json(result.value);
}

export async function addReward(req: Request, res: Response) {
    try {
        const reward = req.body?.reward;
        if (!reward) {
            return sendError(res, {
                type: ErrorType.ValidationError,
                details: { message: "Missing reward object in body" }
            });
        }
        const rewardInput: RewardInput = {
            name: reward.name,
            description: reward.description,
            pointsCost: reward.pointsCost,
            clubCostShare: reward.clubCostShare ?? null,
        };
        const r = await GamificationModel.addReward(rewardInput);
        if (!r.ok) return sendError(res, r.error);
        return res.json(toRewardDTO(r.value));
    } catch (err) {
        return sendError(res, {
            type: ErrorType.UnknownError,
            details: { message: err instanceof Error ? err.message : String(err) }
        });
    }
}

export async function updateReward(req: Request, res: Response) {
    try {
        const reward = req.body?.reward;
        if (!reward || !reward.id) {
            return sendError(res, {
                type: ErrorType.ValidationError,
                details: { message: "Missing reward object or reward.id in body" }
            });
        }
        const update: Partial<RewardEntity> = {
            name: reward.name,
            description: reward.description,
            pointsCost: reward.pointsCost,
        };
        if (reward.clubCostShare !== undefined) {
            update.clubCostShare = reward.clubCostShare;
        }
        const updatedReward = await GamificationModel.updateReward(reward.id, update);
        if (!updatedReward.ok) return sendError(res, updatedReward.error);
        return res.json(toRewardDTO(updatedReward.value));
    } catch (err) {
        return sendError(res, {
            type: ErrorType.UnknownError,
            details: { message: err instanceof Error ? err.message : String(err) }
        });
    }
}

export async function deleteReward(req: Request, res: Response) {
    const { rewardId } = req.params;
    const r = await GamificationModel.deleteReward(rewardId);
    if (!r.ok) return sendError(res, r.error);
    return res.json(toRewardDTO(r.value));
}
