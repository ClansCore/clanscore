import mongoose from "mongoose";

// de: Jahresplanung
const annualPlanSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    amountPerActivity: { type: Number, required: true },
    taskTypeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TaskType",
            required: true,
        },
});

export interface IAnnualPlan {
    _id: mongoose.Types.ObjectId;
    amount: Number;
    amountPerActivity: Number;
    taskTypeId: mongoose.Types.ObjectId
}

export type AnnualPlanInput = Omit<IAnnualPlan, "_id">;

export const AnnualPlan = mongoose.model<IAnnualPlan>(
    "AnnualPlan",
    annualPlanSchema,
);
