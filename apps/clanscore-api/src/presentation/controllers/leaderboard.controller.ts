import { Request, Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { sendError } from "../middleware/error.middleware";
import { GamificationModel } from "../../application/gamification/gamification.model";
import { LeaderboardPopulatedEntryEntity } from "../../infrastructure/database/mappers/gamification/leaderboardEntry.mapper";
import { LeaderboardRankingEntryDTO, ErrorType, ErrorDetails, getErrorMessage } from "@clanscore/shared";
import { Types } from "mongoose";
import { transactionDTOToEntity } from "../../infrastructure/database/mappers/gamification/transaction.mapper";
import { toLeaderboardDTO } from "../../infrastructure/database/mappers/gamification/leaderboard.mapper";
import { toLeaderboardEntryDTO } from "../../infrastructure/database/mappers/gamification/leaderboardEntry.mapper";

const objectId = z
    .string()
    .refine((v) => mongoose.isValidObjectId(v), { message: "Invalid ObjectId" });

const createLeaderboardSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(50),
        description: z.string().max(200).optional().nullable(),
        startDateIso: z.string().datetime().nullable().optional(),
        endDateIso: z.string().datetime(),
        numberVisibleEntries: z.number().int().positive(),
        createdByPersonId: objectId,
    }),
});

export async function createLeaderboardHandler(req: Request, res: Response) {
    try {
        const parsed = createLeaderboardSchema.safeParse({ body: req.body });
        if (!parsed.success) {
            const message = parsed.error.issues.map((i) => i.message).join(", ");
            return sendError(res, {
                type: ErrorType.ValidationError,
                details: { message },
            });
        }

        const {
            name,
            description,
            startDateIso,
            endDateIso,
            numberVisibleEntries,
            createdByPersonId,
        } = parsed.data.body;

        if (startDateIso) {
            const startDate = new Date(startDateIso);
            const endDate = new Date(endDateIso);
            if (endDate <= startDate) {
                return sendError(res, {
                    type: ErrorType.EndDateNotAfterStartDate,
                    details: { message: "End date must be after start date" },
                });
            }
        }

        const startDate = startDateIso ? new Date(startDateIso) : new Date();
        const endDate = new Date(endDateIso);

        const leaderboardInput = {
            name,
            description: description ?? null,
            startDate,
            endDate,
            numberVisibleEntries,
            createdBy: new Types.ObjectId(createdByPersonId),
        };

        const result = await GamificationModel.saveLeaderboard(leaderboardInput);
        if (!result.ok) return sendError(res, result.error);

        return res.json({ id: result.value._id });
    } catch (error) {
        return sendError(res, {
            type: ErrorType.UnknownError,
            details: { message: error instanceof Error ? error.message : "An unexpected error occurred" },
        });
    }
}

export async function getActiveLeaderboardsHandler(req: Request, res: Response) {
    try {
        const result = await GamificationModel.getActiveLeaderboards();
        if (!result.ok) return sendError(res, result.error);
        
        return res.json(result.value.map((lb) => ({
            id: lb._id,
            name: lb.name,
            numberVisibleEntries: lb.numberVisibleEntries,
            startDate: lb.startDate.toISOString(),
            endDate: lb.endDate.toISOString(),
        })));
    } catch (error) {
        return sendError(res, {
            type: ErrorType.UnknownError,
            details: { message: error instanceof Error ? error.message : "An unexpected error occurred" },
        });
    }
}

function mapEntityToDTO(
    entry: LeaderboardPopulatedEntryEntity,
): LeaderboardRankingEntryDTO {
    return {
        id: entry._id,
        leaderboardId: entry.leaderboardId,
        person: {
            id: entry.person?.id ?? "",
            nickname: entry.person?.nickname ?? null,
        },
        score: entry.score,
    };
}

export async function getLeaderboardRankingHandler(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const limit = parseInt(req.query.limit as string) || 10;
        
        const result = await GamificationModel.getLeaderboardRanking(id, limit);
        if (!result.ok) return sendError(res, result.error);
        
        return res.json(result.value.map(mapEntityToDTO));
    } catch (error) {
        return sendError(res, {
            type: ErrorType.UnknownError,
            details: { message: error instanceof Error ? error.message : "An unexpected error occurred" },
        });
    }
}

export async function incrementActiveLeaderboardEntriesPointsHandler(req: Request, res: Response) {
    try {
        const { transaction } = req.body;

        if (!transaction) {
            return sendError(res, {
                type: ErrorType.ValidationError,
                details: { message: "Missing transaction in body" },
            });
        }

        const transactionEntity = transactionDTOToEntity(transaction);
        const result = await GamificationModel.incrementActiveLeaderboardEntriesPoints(transactionEntity);
        if (!result.ok) return sendError(res, result.error);
        
        return res.json({ ok: true });
    } catch (error) {
        return sendError(res, {
            type: ErrorType.UnknownError,
            details: { message: error instanceof Error ? error.message : "An unexpected error occurred" },
        });
    }
}

export async function getLeaderboards(req: Request, res: Response) {
    const r = await GamificationModel.getLeaderboards();
    if (!r.ok) return sendError(res, r.error);
    return res.json(r.value.map(toLeaderboardDTO));
}

export async function getLeaderboardEntries(req: Request, res: Response) {
    try {
        const { leaderboardId } = req.params;
        const { numberVisibleEntries } = req.body.leaderboard;
        if (!leaderboardId) {
            return sendError(res, {
                type: ErrorType.ValidationError,
                details: { message: "Missing leaderboardId in params" }
            });
        }
        
        if (!numberVisibleEntries || typeof numberVisibleEntries !== "number") {
            return sendError(res, {
                type: ErrorType.ValidationError,
                details: { message: "Missing or invalid numberVisibleEntries in body" }
            });
        }
        
        const result = await GamificationModel.getLeaderboardEntriesByLeaderboardId(leaderboardId, numberVisibleEntries);
        if (!result.ok) return sendError(res, result.error);
        return res.json(result.value.map(toLeaderboardEntryDTO));
    } catch (err) {
        return sendError(res, {
            type: ErrorType.UnknownError,
            details: { message: err instanceof Error ? err.message : String(err) }
        });
    }
}
