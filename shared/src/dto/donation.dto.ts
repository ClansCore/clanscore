import { ISODate } from "./common.js";

export type DonationDTO = {
  id: string;
  amount: number;
  date: ISODate;
  notes?: string | null;
  createdAt?: ISODate;
  donatorId?: string | null;
  verifiedBy: string; // personId
};

export type DonationCreateDTO = Omit<DonationDTO, "id"|"createdAt">;

export type DonationUpdateDTO = Partial<DonationCreateDTO>;
