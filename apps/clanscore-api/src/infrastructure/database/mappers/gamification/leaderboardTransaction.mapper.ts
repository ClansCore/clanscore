import { toId } from "../core";
import type { ILeaderboardTransaction } from "../../../../domain/gamification/LeaderboardTransaction";

export type LeaderboardTransactionEntity = {
    _id: string;
    createdAt?: Date;
    leaderboardEntryId: string;
    transactionId: string;
};

export const toLeaderboardTransactionEntity = (doc: ILeaderboardTransaction): LeaderboardTransactionEntity => ({
    _id: toId(doc),
    createdAt: doc.createdAt,
    leaderboardEntryId: toId(doc.leaderboardEntryId),
    transactionId: toId(doc.transactionId),
});
