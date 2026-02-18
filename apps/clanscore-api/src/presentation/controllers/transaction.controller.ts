import { Request, Response } from "express";
import { ErrorType } from "@clanscore/shared";
import { sendError } from "../middleware/error.middleware";
import { GamificationModel } from "../../application/gamification/gamification.model";
import { toTransactionDTO } from "../../infrastructure/database/mappers/gamification/personData.mapper";
import mongoose from "mongoose";

export async function saveTransaction(req: Request, res: Response) {
    const { amount, personId, taskId, donationId, rewardId, status } = req.body;

    if (amount === undefined || amount === null || typeof amount !== "number" || !personId || !status) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Missing required fields: amount, personId, status" },
        });
    }

    if (!mongoose.isValidObjectId(personId)) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Invalid personId" },
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transactionData: any = {
        amount: Number(amount),
        personId: new mongoose.Types.ObjectId(personId),
        status,
    };

    if (taskId && mongoose.isValidObjectId(taskId)) {
        transactionData.taskId = new mongoose.Types.ObjectId(taskId);
    }

    if (donationId && mongoose.isValidObjectId(donationId)) {
        transactionData.donationId = new mongoose.Types.ObjectId(donationId);
    }

    if (rewardId && mongoose.isValidObjectId(rewardId)) {
        transactionData.rewardId = new mongoose.Types.ObjectId(rewardId);
    }

    const result = await GamificationModel.saveTransaction(transactionData);
    if (!result.ok) return sendError(res, result.error);
    return res.json(toTransactionDTO(result.value));
}

export async function getTransactionByDonationId(req: Request, res: Response) {
    const { donationId } = req.params;

    if (!mongoose.isValidObjectId(donationId)) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Invalid donationId" },
        });
    }

    const result = await GamificationModel.getTransactionByDonationId(donationId);
    if (!result.ok) return sendError(res, result.error);
    return res.json(toTransactionDTO(result.value));
}

export async function getTransactionsByPersonId(req: Request, res: Response) {
    const { personId } = req.params;

    if (!mongoose.isValidObjectId(personId)) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Invalid personId" },
        });
    }

    const result = await GamificationModel.getTransactionsByPersonId(personId);
    if (!result.ok) {
        if (result.error.type === ErrorType.TransactionNotFound) {
            return res.json([]);
        }
        return sendError(res, result.error);
    }
    return res.json(result.value.map(toTransactionDTO));
}

