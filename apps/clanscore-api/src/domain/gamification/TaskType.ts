import mongoose from "mongoose";

// de: Aufgabentyp
const taskTypeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    compensation: {
        type: String,
        enum: ["Single", "Expense"],
        required: true,
    },
    points: { type: Number, required: true },
    clubCostShare: {type: mongoose.Types.Decimal128, default: null}
});

export interface ITaskType {
    _id: mongoose.Types.ObjectId;
    name: String;
    compensation: "Single" | "Expense";
    points: Number;
    clubCostShare?: mongoose.Types.Decimal128
}

export type TaskTypeInput = Omit<ITaskType, "_id">;

export const TaskType = mongoose.model<ITaskType>(
    "TaskType",
    taskTypeSchema,
);
