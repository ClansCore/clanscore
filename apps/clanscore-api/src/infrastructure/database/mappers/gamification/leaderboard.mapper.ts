import { toId } from "../core";
import type { ILeaderboard } from "../../../../domain/gamification/Leaderboard";
import { LeaderboardDTO } from "@clanscore/shared";

export type LeaderboardEntity = {
    _id: string;
    name: string;
    description?: string | null;
    startDate: Date;
    endDate: Date;
    numberVisibleEntries: number;
    createdBy: string;
};

export const toLeaderboardEntity = (doc: ILeaderboard): LeaderboardEntity => ({
    _id: toId(doc),
    name: doc.name,
    description: doc.description ?? null,
    startDate: doc.startDate,
    endDate: doc.endDate,
    numberVisibleEntries: doc.numberVisibleEntries,
    createdBy: toId(doc.createdBy),
});

export const toLeaderboardDTO = (doc: LeaderboardEntity): LeaderboardDTO => ({
    id: toId(doc),
    name: doc.name,
    description: doc.description ?? null,
    startDate: doc.startDate.toISOString(),
    endDate: doc.endDate.toISOString(),
    numberVisibleEntries: doc.numberVisibleEntries,
    createdBy: doc.createdBy,
});
