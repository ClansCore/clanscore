import { ISODate } from "./common.js";

export type LeaderboardDTO = {
  id: string;
  name: string;
  description?: string | null;
  startDate: ISODate;
  endDate: ISODate;
  numberVisibleEntries: number;
  createdBy: string; // personId
};

export type LeaderboardEntryDTO = {
  id: string;
  score: number;
  leaderboardId: string;
  personId: string;
};

export interface LeaderboardRankingEntryDTO {
    id: string;
    leaderboardId: string;
    person: {
        id: string;
        nickname: string | null;
    };
    score: number;
}

export type LeaderboardTransactionDTO = {
  id: string;
  createdAt?: ISODate;
  leaderboardEntryId: string;
  transactionId: string;
};

export type LeaderboardCreateDTO = Omit<LeaderboardDTO, "id">;

export type LeaderboardUpdateDTO = Partial<LeaderboardCreateDTO>;

export type LeaderboardEntryCreateDTO = Omit<LeaderboardEntryDTO, "id">;

export type LeaderboardTransactionCreateDTO = Omit<LeaderboardTransactionDTO, "id"|"createdAt">;
