import { Request, Response } from "express";
import { ErrorType } from "@clanscore/shared";
import { sendError } from "../middleware/error.middleware";
import { GamificationModel } from "../../application/gamification/gamification.model";
import { toRewardDTO } from "../../infrastructure/database/mappers/gamification/personData.mapper";
import { RewardEntity } from "../../infrastructure/database/mappers/gamification/reward.mapper";
import { GamificationParameterEntity, toGamificationParameterDTO } from "../../infrastructure/database/mappers/gamification/gamificationParameter.mapper";

export async function getGamificationParameter(req: Request, res: Response) {
    const result = await GamificationModel.getGamificationparameter();
    if (!result.ok) return sendError(res, result.error);
    // result.value is assumed to be an array, so we need to safely access [0]
    if (!result.value || !Array.isArray(result.value) || result.value.length === 0) {
        return sendError(res, {
            type: ErrorType.NotFound,
            details: { message: "Gamification parameter not found" }
        });
    }
    return res.json(toGamificationParameterDTO(result.value[0]));
}


export async function updateGamificationParameter(req: Request, res: Response) {
    try {
        const gamificationparameter = req.body?.gamificationParameter;
        if (!gamificationparameter) {
            return sendError(res, {
                type: ErrorType.ValidationError,
                details: { message: "Missing gamificationparameter object in body" }
            });
        }
        const update: Partial<GamificationParameterEntity> = {
            pointsPerCHF: gamificationparameter.pointsPerCHF,
            pointsPerDonation: gamificationparameter.pointsPerDonation,
        };
        const updatedGamificationparameter = await GamificationModel.updateGamificationparameter(update);
        if (!updatedGamificationparameter.ok) return sendError(res, updatedGamificationparameter.error);
        return res.json(toGamificationParameterDTO(updatedGamificationparameter.value));
    } catch (err) {
        return sendError(res, {
            type: ErrorType.UnknownError,
            details: { message: err instanceof Error ? err.message : String(err) }
        });
    }
}