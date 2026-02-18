import mongoose from "mongoose";

const donationSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    notes: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    donatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Person",
        default: null,
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Person",
        required: true,
    },
});

export interface IDonation {
    _id: mongoose.Types.ObjectId;
    amount: number;
    date: Date;
    notes?: string | null;
    createdAt?: Date;
    donatorId?: mongoose.Types.ObjectId;
    verifiedBy: mongoose.Types.ObjectId;
}

export type DonationInput = Omit<IDonation, "_id">;

export const Donation = mongoose.model<IDonation>("Donation", donationSchema);
