import { toId } from "../core";
import type { ILeaderboardEntry, PopulatedLeaderboardEntry } from "../../../../domain/gamification/LeaderboardEntry";
import { LeaderboardEntryDTO } from "@clanscore/shared";

export type LeaderboardEntryEntity = {
    _id: string;
    score: number;
    leaderboardId: string;
    personId: string;
};

export const toLeaderboardEntryEntity = (doc: ILeaderboardEntry): LeaderboardEntryEntity => ({
    _id: toId(doc),
    score: doc.score,
    leaderboardId: toId(doc.leaderboardId),
    personId: toId(doc.personId),
});

export const toLeaderboardEntryDTO = (doc: LeaderboardEntryEntity): LeaderboardEntryDTO => ({
    id: toId(doc),
    score: doc.score,
    leaderboardId: toId(doc.leaderboardId),
    personId: doc.personId,
});

export type LeaderboardPopulatedEntryEntity = {
    _id: string;
    leaderboardId: string;
    person: { id: string; nickname: string | null };
    score: number;
};

export const toLeaderboardEntryWithPersonEntity = (doc: PopulatedLeaderboardEntry): LeaderboardPopulatedEntryEntity => ({
    _id: toId(doc),
    leaderboardId: toId(doc.leaderboardId),
    person: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id: toId((doc as any).personId),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        nickname: (doc as any).personId?.nickname ?? null,
    },
    score: doc.score,
});
