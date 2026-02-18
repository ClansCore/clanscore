import mongoose from "mongoose";
import {
    getPersonByDiscordId,
    getPerson,
} from "../../infrastructure/database/user.db.service";
import {
    getReward,
    decrementPersonPoints,
    saveTransaction,
    getTransaction,
    updateTransactionStatusByID,
} from "../../infrastructure/database/gamification.db.service";
import {
    err,
    ErrorType,
    ok,
    Result,
    ErrorDetails,
} from "@clanscore/shared";
import { TransactionEntity } from "../../infrastructure/database/mappers/gamification/transaction.mapper";
// import { RewardEntity } from "../../infrastructure/database/mappers/gamification/reward.mapper";

export async function claimRewardCore(
    rewardId: string,
    userDiscordId: string,
): Promise<Result<TransactionEntity, ErrorDetails>> {
    if (!mongoose.isValidObjectId(rewardId)) {
        return err(ErrorType.RewardNotFound);
    }

    const rewardRes = await getReward(rewardId);
    if (!rewardRes.ok) return rewardRes;
    const reward = rewardRes.value;

    const userRes = await getPersonByDiscordId(userDiscordId);
    if (!userRes.ok) return userRes;
    const person = userRes.value;

    if (person.score < reward.pointsCost) {
        return err(ErrorType.ValidationError, { message: `Nicht genügend Punkte. Benötigt: ${reward.pointsCost}, Verfügbar: ${person.score}` });
    }

    const transactionRes = await saveTransaction({
        personId: new mongoose.Types.ObjectId(person._id),
        rewardId: new mongoose.Types.ObjectId(reward._id),
        amount: -reward.pointsCost,
        status: "Pending",
        taskId: null,
        donationId: null,
        leaderboardTransaction: null,
    });

    if (!transactionRes.ok) return transactionRes;

    return ok(transactionRes.value);
}

export async function acceptRewardClaimCore(
    transactionId: string,
): Promise<Result<{ personDiscordId: string; rewardName: string }, ErrorDetails>> {
    if (!mongoose.isValidObjectId(transactionId)) {
        return err(ErrorType.TransactionNotFound);
    }

    const transactionRes = await getTransaction(transactionId);
    if (!transactionRes.ok) return transactionRes;
    const transaction = transactionRes.value;

    if (!transaction.rewardId) {
        return err(ErrorType.ValidationError, { message: "Transaction is not a reward claim" });
    }

    if (transaction.status !== "Pending") {
        return err(ErrorType.ValidationError, { message: `Transaction is not pending. Current status: ${transaction.status}` });
    }

    const rewardIdStr = typeof transaction.rewardId === 'string' ? transaction.rewardId : transaction.rewardId._id;
    const rewardRes = await getReward(rewardIdStr);
    if (!rewardRes.ok) return rewardRes;
    const reward = rewardRes.value;

    const personRes = await getPerson(transaction.personId);
    if (!personRes.ok) return personRes;
    const person = personRes.value;

    if (!person.discordId) {
        return err(ErrorType.UserNotFound, { message: "Person has no Discord ID" });
    }

    if (person.score < Math.abs(transaction.amount)) {
        await updateTransactionStatusByID(transactionId, "Failed");
        return err(ErrorType.ValidationError, { message: "User no longer has enough points" });
    }

    const decrementRes = await decrementPersonPoints(
        transaction.personId,
        Math.abs(transaction.amount),
    );
    if (!decrementRes.ok) return decrementRes;

    const updateRes = await updateTransactionStatusByID(transactionId, "Done");
    if (!updateRes.ok) return updateRes;

    return ok({
        personDiscordId: person.discordId,
        rewardName: reward.name,
    });
}

export async function denyRewardClaimCore(
    transactionId: string,
): Promise<Result<{ personDiscordId: string; rewardName: string }, ErrorDetails>> {
    if (!mongoose.isValidObjectId(transactionId)) {
        return err(ErrorType.TransactionNotFound);
    }

    const transactionRes = await getTransaction(transactionId);
    if (!transactionRes.ok) return transactionRes;
    const transaction = transactionRes.value;

    if (!transaction.rewardId) {
        return err(ErrorType.ValidationError, { message: "Transaction is not a reward claim" });
    }

    if (transaction.status !== "Pending") {
        return err(ErrorType.ValidationError, { message: `Transaction is not pending. Current status: ${transaction.status}` });
    }

    const rewardIdStr2 = typeof transaction.rewardId === 'string' ? transaction.rewardId : transaction.rewardId._id;
    const rewardRes = await getReward(rewardIdStr2);
    if (!rewardRes.ok) return rewardRes;
    const reward = rewardRes.value;

    const personRes = await getPerson(transaction.personId);
    if (!personRes.ok) return personRes;
    const person = personRes.value;

    if (!person.discordId) {
        return err(ErrorType.UserNotFound, { message: "Person has no Discord ID" });
    }

    const updateRes = await updateTransactionStatusByID(transactionId, "Failed");
    if (!updateRes.ok) return updateRes;

    return ok({
        personDiscordId: person.discordId,
        rewardName: reward.name,
    });
}
