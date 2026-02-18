import mongoose from "mongoose";
import { toId } from "../core";
import type { IReward } from "../../../../domain/gamification/Reward";
import { GamificationParameterDTO, RewardDTO } from "@clanscore/shared";
import { IGamificationParameter } from "../../../../domain/gamification/GamificationParameter";

export type GamificationParameterEntity = {
    _id: string;
    pointsPerCHF: number;
    pointsPerDonation: number;
};

export const toGamificationParameterEntity = (doc: Partial<IGamificationParameter>): Partial<GamificationParameterEntity> => ({
    pointsPerCHF: Number(doc.pointsPerCHF?.toString()),
    pointsPerDonation: Number(doc.pointsPerDonation?.toString()),
});


export const toGamificationParameterDTO = (doc: Partial<GamificationParameterEntity>): Partial<GamificationParameterDTO> => ({
    pointsPerCHF: Number(doc.pointsPerCHF?.toString()),
    pointsPerDonation: Number(doc.pointsPerDonation?.toString()),
});