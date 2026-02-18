import mongoose from "mongoose";
import { ITask } from "./Task";

// de: AufgabenTeilnehmer
const taskParticipantSchema = new mongoose.Schema({
    registrationDate: { type: Date, default: Date.now },
    completedByParticipant: { type: Boolean, default: false },
    participantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Person",
        required: true,
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
        required: true,
    },
});

export interface ITaskParticipant {
    _id: mongoose.Types.ObjectId;
    registrationDate?: Date;
    completedByParticipant?: boolean;
    participantId: mongoose.Types.ObjectId;
    taskId: mongoose.Types.ObjectId;
}

export interface ITaskPopulatedParticipant
    extends Omit<ITaskParticipant, "taskId"> {
    taskId: ITask;
}

export type TaskParticipantInput = Omit<ITaskParticipant, "_id">;

export const TaskParticipant = mongoose.model<ITaskParticipant>(
    "TaskParticipant",
    taskParticipantSchema,
);
