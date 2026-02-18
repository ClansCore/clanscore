import { toId } from "../core";
import type { IDonation } from "../../../../domain/gamification/Donation";

export type DonationEntity = {
    _id: string;
    amount: number;
    date: Date;
    notes?: string | null;
    createdAt?: Date;
    donatorId?: string | null;
    verifiedBy: string;
};

export const toDonationEntity = (doc: IDonation): DonationEntity => ({
    _id: toId(doc),
    amount: doc.amount,
    date: doc.date,
    notes: doc.notes ?? null,
    createdAt: doc.createdAt,
    donatorId: doc.donatorId ? toId(doc.donatorId) : null,
    verifiedBy: toId(doc.verifiedBy),
});
