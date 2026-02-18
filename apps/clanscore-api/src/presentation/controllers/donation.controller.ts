import { Request, Response } from "express";
import { ErrorType } from "@clanscore/shared";
import { sendError } from "../middleware/error.middleware";
import { GamificationModel } from "../../application/gamification/gamification.model";
import { toDonationDTO } from "../../infrastructure/database/mappers/gamification/personData.mapper";
import mongoose from "mongoose";

export async function saveDonation(req: Request, res: Response) {
    const { amount, date, notes, verifiedBy } = req.body;

    if (!amount || !date || !verifiedBy) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Missing required fields: amount, date, verifiedBy" },
        });
    }

    if (!mongoose.isValidObjectId(verifiedBy)) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Invalid verifiedBy personId" },
        });
    }

    const result = await GamificationModel.saveDonation({
        amount: Number(amount),
        date: new Date(date),
        notes: notes || null,
        verifiedBy: new mongoose.Types.ObjectId(verifiedBy),
    });

    if (!result.ok) return sendError(res, result.error);
    return res.json(toDonationDTO(result.value));
}

export async function updateDonationDonor(req: Request, res: Response) {
    const { id } = req.params;
    const { donatorPersonId } = req.body;

    if (!donatorPersonId) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Missing donatorPersonId in body" },
        });
    }

    if (!mongoose.isValidObjectId(id)) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Invalid donationId" },
        });
    }

    if (!mongoose.isValidObjectId(donatorPersonId)) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Invalid donatorPersonId" },
        });
    }

    const result = await GamificationModel.updateDonationDonor(id, donatorPersonId);
    if (!result.ok) return sendError(res, result.error);
    return res.json(toDonationDTO(result.value));
}

export async function getDonationsByPersonId(req: Request, res: Response) {
    const { personId } = req.params;

    if (!mongoose.isValidObjectId(personId)) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Invalid personId" },
        });
    }

    const result = await GamificationModel.getDonationsByPersonId(personId);
    if (!result.ok) {
        if (result.error.type === ErrorType.NotFound) {
            return res.json([]);
        }
        return sendError(res, result.error);
    }
    return res.json(result.value.map(toDonationDTO));
}

