import { PersonDTO } from "./person.dto.js";
import { UserRoleWithRoleDTO } from "./role.dto.js";
import { TaskParticipantDTO } from "./task.dto.js";
import { DonationDTO } from "./donation.dto.js";
import { RewardDTO } from "./reward.dto.js";
import { LeaderboardEntryDTO } from "./leaderboard.dto.js";
import { TransactionDTO } from "./transaction.dto.js";

export type PersonDataDTO = {
    person: PersonDTO;
    roles: UserRoleWithRoleDTO[];
    tasks: TaskParticipantDTO[];
    donations: DonationDTO[];
    rewards: RewardDTO[];
    leaderboardEntries: LeaderboardEntryDTO[];
    transactions: TransactionDTO[];
};

