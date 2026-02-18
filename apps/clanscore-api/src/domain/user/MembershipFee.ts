import mongoose from "mongoose";

// de: MitgliederBeitrag
const membershipFeeSchema = new mongoose.Schema({
    dueOn: { type: Date, default: Date.now },
    amount: { type: mongoose.Types.Decimal128, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export interface IMembershipFee {
    _id: mongoose.Types.ObjectId;
    dueOn: Date;
    amount: mongoose.Types.Decimal128;
    createdAt: Date;
    updatedAt: Date;
}

export type MembershipFeeInput = Omit<IMembershipFee, "_id">;

export const MembershipFee = mongoose.model<IMembershipFee>(
    "MembershipFee",
    membershipFeeSchema,
);