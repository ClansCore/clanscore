import mongoose from "mongoose";

// de: BeitragsZahlung
const paymentSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    personId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Person",
                required: true,
    },
    membershipFeeId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "MembershipFee",
                required: true,
    },
});

export interface IPayment {
    _id: mongoose.Types.ObjectId;
    date: Date;
    personId: mongoose.Schema.Types.ObjectId;
    membershipFeeId: mongoose.Schema.Types.ObjectId;
}

export type PaymentInput = Omit<IPayment, "_id">;

export const Payment = mongoose.model<IPayment>(
    "Payment",
    paymentSchema,
);