import { toId } from "../core";
import type { ITransaction } from "../../../../domain/gamification/Transaction";
import type { TransactionDTO } from "@clanscore/shared";
import { DonationEntity } from "./donation.mapper";
import { TaskEntity } from "./task.mapper";
import { RewardEntity } from "./reward.mapper";

export type TransactionEntity = {
    _id: string;
    amount: number;
    status: "Pending" | "Done" | "Failed";
    notes?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    personId: string;
    taskId?: string | null | TaskEntity;
    donationId?: string | null | DonationEntity;
    rewardId?: string | null | RewardEntity;
    leaderboardTransaction?: string | null;
};

export const toTransactionEntity = (doc: ITransaction): TransactionEntity => ({
    _id: toId(doc),
    amount: doc.amount,
    status: doc.status,
    notes: doc.notes ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    personId: toId(doc.personId),
    taskId: doc.taskId ? toId(doc.taskId) : null,
    donationId: doc.donationId ? toId(doc.donationId) : null,
    rewardId: doc.rewardId ? toId(doc.rewardId) : null,
    leaderboardTransaction: doc.leaderboardTransaction ? toId(doc.leaderboardTransaction) : null,
});

export const transactionDTOToEntity = (dto: TransactionDTO): TransactionEntity => ({
    _id: dto.id,
    amount: dto.amount,
    status: dto.status,
    notes: dto.notes ?? null,
    createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
    updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined,
    personId: dto.personId,
    taskId: dto.taskId ?? null,
    donationId: dto.donationId ?? null,
    rewardId: dto.rewardId ?? null,
    leaderboardTransaction: dto.leaderboardTransaction ?? null,
});
