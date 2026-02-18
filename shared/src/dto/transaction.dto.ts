import { ISODate } from "./common.js";

export type TransactionStatus = "Pending" | "Done" | "Failed";

export type TransactionDTO = {
  id: string;
  amount: number;
  status: TransactionStatus;
  notes?: string | null;
  createdAt?: ISODate;
  updatedAt?: ISODate;
  personId: string;
  taskId?: string | null;
  donationId?: string | null;
  rewardId?: string | null;
  leaderboardTransaction?: string | null;
};

export type TransactionCreateDTO = Omit<TransactionDTO, "id"|"createdAt"|"updatedAt">;

export type TransactionUpdateDTO = Partial<Omit<TransactionDTO, "id"|"createdAt">>;
