import {
    DonationDTO,
    LeaderboardEntryDTO,
    RewardDTO,
    TaskParticipantDTO,
    TransactionDTO,
} from "@clanscore/shared";
import type { TaskParticipantWithTaskEntity } from "./taskParticipant.mapper";
import type { DonationEntity } from "./donation.mapper";
import type { RewardEntity } from "./reward.mapper";
import type { LeaderboardEntryEntity } from "./leaderboardEntry.mapper";
import type { TransactionEntity } from "./transaction.mapper";

export function toTaskParticipantDTO(entity: TaskParticipantWithTaskEntity): TaskParticipantDTO {
    return {
        id: entity._id,
        registrationDate: entity.registrationDate?.toISOString(),
        completedByParticipant: entity.completedByParticipant,
        participantId: entity.participantId,
        taskId: entity.task.id,
    };
}

export function toDonationDTO(entity: DonationEntity): DonationDTO {
    return {
        id: entity._id,
        amount: entity.amount,
        date: entity.date.toISOString(),
        notes: entity.notes ?? null,
        createdAt: entity.createdAt?.toISOString(),
        donatorId: entity.donatorId ?? null,
        verifiedBy: entity.verifiedBy,
    };
}

export function toRewardDTO(entity: RewardEntity): RewardDTO {
    const clubCostShare = entity.clubCostShare 
        ? (typeof entity.clubCostShare === 'object' && 'toString' in entity.clubCostShare 
            ? parseFloat(entity.clubCostShare.toString()) 
            : Number(entity.clubCostShare))
        : 0;
    
    return {
        id: entity._id,
        name: entity.name,
        description: entity.description,
        pointsCost: entity.pointsCost,
        clubCostShare: clubCostShare,
    };
}

export function toLeaderboardEntryDTO(entity: LeaderboardEntryEntity): LeaderboardEntryDTO {
    return {
        id: entity._id,
        leaderboardId: entity.leaderboardId,
        personId: entity.personId,
        score: entity.score,
    };
}

export function toTransactionDTO(entity: TransactionEntity): TransactionDTO {
    return {
        id: entity._id,
        amount: entity.amount,
        status: entity.status,
        notes: entity.notes ?? null,
        createdAt: entity.createdAt?.toISOString(),
        updatedAt: entity.updatedAt?.toISOString(),
        personId: entity.personId,
        taskId: entity.taskId ? (typeof entity.taskId === 'string' ? entity.taskId : entity.taskId._id) : null,
        donationId: entity.donationId ? (typeof entity.donationId === 'string' ? entity.donationId : entity.donationId._id) : null,
        rewardId: entity.rewardId ? (typeof entity.rewardId === 'string' ? entity.rewardId : entity.rewardId._id) : null,
        leaderboardTransaction: entity.leaderboardTransaction ?? null,
    };
}

