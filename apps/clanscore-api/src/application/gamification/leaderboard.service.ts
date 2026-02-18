import {
    getActiveLeaderboards,
    incrementLeaderboardEntry,
    saveLeaderboardTransaction,
} from "../../infrastructure/database/gamification.db.service";
import {
    Result,
    ErrorDetails,
    ok,
} from "@clanscore/shared";
import { TransactionEntity } from "../../infrastructure/database/mappers/gamification/transaction.mapper";
import { LeaderboardEntity } from "../../infrastructure/database/mappers/gamification/leaderboard.mapper";
import { LeaderboardTransactionInput } from "../../domain/gamification/LeaderboardTransaction";
import mongoose from "mongoose";

export async function incrementActiveLeaderboardEntriesPoints(
    transaction: TransactionEntity,
): Promise<Result<boolean, ErrorDetails>> {
    const leaderboardsResult = await getActiveLeaderboards();
    if (!leaderboardsResult.ok) return leaderboardsResult;

    for (const leaderboard of leaderboardsResult.value) {
        const incrementResult = await incrementLeaderBoardEntryPoints(
            transaction,
            leaderboard,
        );
        if (!incrementResult.ok) return incrementResult;
    }

    return ok(true);
}

export async function incrementLeaderBoardEntryPoints(
  transaction: TransactionEntity,
  leaderboard: LeaderboardEntity,
): Promise<Result<boolean, ErrorDetails>> {
    const personId =
        typeof transaction.personId === "string"
        ? new mongoose.Types.ObjectId(transaction.personId)
        : transaction.personId;

    const leaderboardId =
        typeof leaderboard._id === "string"
        ? new mongoose.Types.ObjectId(leaderboard._id)
        : leaderboard._id;

    const incrementResult = await incrementLeaderboardEntry(
        personId,
        leaderboardId,
        transaction.amount,
    );
    if (!incrementResult.ok) return incrementResult;

    const leaderboardEntryId =
        typeof incrementResult.value._id === "string"
        ? new mongoose.Types.ObjectId(incrementResult.value._id)
        : (incrementResult.value._id as mongoose.Types.ObjectId);

    const transactionId =
        typeof transaction._id === "string"
        ? new mongoose.Types.ObjectId(transaction._id)
        : (transaction._id as mongoose.Types.ObjectId);

    const leaderboardTransaction: LeaderboardTransactionInput = {
        leaderboardEntryId,
        transactionId,
    };

    const transactionResult = await saveLeaderboardTransaction(
        leaderboardTransaction,
    );
    if (!transactionResult.ok) return transactionResult;

    return ok(true);
}
