import mongoose from "mongoose";

// de: GamificationParameter
const gamificationParameterSchema = new mongoose.Schema({
    pointsPerCHF: {type: mongoose.Types.Decimal128, required: true},
    pointsPerDonation: {type: mongoose.Types.Decimal128, required: true}
});

export interface IGamificationParameter {
    _id: mongoose.Types.ObjectId;
    pointsPerCHF: mongoose.Types.Decimal128,
    pointsPerDonation:  mongoose.Types.Decimal128
}

export type GamificationParameterInput = Omit<IGamificationParameter, "_id">;

export const GamificationParameter = mongoose.model<IGamificationParameter>(
    "GamificationParameter",
    gamificationParameterSchema,
);
