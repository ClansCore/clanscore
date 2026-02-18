import mongoose from "mongoose";

// de: Aufgabe
const taskSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: null },
    deadline: { type: Date, default: null },
    points: { type: Number, required: true },
    maxParticipants: { type: Number, required: true },
    responsible: { type: mongoose.Schema.Types.ObjectId, required: false },
    completed: { type: Boolean, default: false },
    taskTypeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TaskType",
            default: null,
        },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Person",
        required: true,
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        default: null,
    },
});

export interface ITask {
    _id: mongoose.Types.ObjectId;
    name: string;
    description?: string | null;
    deadline?: Date | null;
    points: number;
    maxParticipants: number;
    responsible?: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date | null;
    completed?: boolean;
    taskTypeId?: mongoose.Types.ObjectId | null;
    createdBy: mongoose.Types.ObjectId;
    eventId?: mongoose.Types.ObjectId | null;
}

export type TaskInput = Omit<ITask, "_id">;

export const Task = mongoose.model<ITask>("Task", taskSchema);
