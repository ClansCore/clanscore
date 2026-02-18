import { toId } from "../core";
import type { ITask } from "../../../../domain/gamification/Task";
import type { TaskDTO } from "@clanscore/shared";
import type { TaskInput } from "../../../../domain/gamification/Task";
import mongoose from "mongoose";

export type TaskEntity = {
    _id: string;
    name: string;
    description?: string | null;
    deadline?: Date | null;
    points: number;
    maxParticipants: number;
    participantCount?: number;
    responsible?: string | null;
    createdAt?: Date;
    updatedAt?: Date | null;
    completed?: boolean;
    createdBy: string;
    eventId?: string | null;
    taskTypeId?: string | null;
};

export const toTaskEntity = (doc: ITask): TaskEntity => ({
    _id: toId(doc),
    name: doc.name,
    description: doc.description ?? null,
    deadline: doc.deadline ?? null,
    points: doc.points,
    maxParticipants: doc.maxParticipants,
    responsible: doc.responsible ? toId(doc.responsible) : null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt ?? null,
    completed: !!doc.completed,
    createdBy: toId(doc.createdBy),
    eventId: doc.eventId ? toId(doc.eventId) : null,
    taskTypeId: doc.taskTypeId ? toId(doc.taskTypeId) : null,
});

export const toTaskDTO = (entity: TaskEntity): TaskDTO => ({
    id: entity._id,
    name: entity.name,
    description: entity.description ?? null,
    deadline: entity.deadline ? entity.deadline.toISOString() : null,
    points: entity.points,
    maxParticipants: entity.maxParticipants,
    participantCount: entity?.participantCount, 
    responsible: entity.responsible ?? undefined,
    completed: entity.completed,
    createdBy: entity.createdBy,
    eventId: entity.eventId ?? null,
    taskTypeId: entity.taskTypeId ?? null,
    createdAt: entity.createdAt ? entity.createdAt.toISOString() : undefined,
    updatedAt: entity.updatedAt ? entity.updatedAt.toISOString() : null,
});

export const fromTaskDTOToTaskEntity = (entity: TaskDTO): TaskEntity => ({
    _id: entity.id,
    name: entity.name,
    description: entity.description ?? null,
    deadline: entity.deadline ? new Date(entity.deadline): null,
    points: entity.points,
    maxParticipants: entity.maxParticipants,
    responsible: entity.responsible ?? undefined,
    completed: entity.completed,
    createdBy: entity.createdBy,
    eventId: entity.eventId ?? null,
    taskTypeId: entity.taskTypeId ?? null,
    createdAt: entity.createdAt ? new Date(entity.createdAt) : undefined,
    updatedAt: entity.updatedAt ? new Date(entity.updatedAt) : null,
});

export type CreateTaskRequestData = {
    name: string;
    description?: string | null;
    points: number;
    maxParticipants: number;
    deadlineIso?: string | null;
    createdByDiscordId: string;
    taskTypeId?: string | null;
};

export function toTaskInput(
    requestData: CreateTaskRequestData,
    createdByPersonId: string,
): TaskInput {
    return {
        name: requestData.name,
        description: requestData.description ?? null,
        deadline: requestData.deadlineIso ? new Date(requestData.deadlineIso) : null,
        points: requestData.points,
        maxParticipants: requestData.maxParticipants,
        responsible: undefined,
        completed: false,
        taskTypeId: requestData.taskTypeId ? new mongoose.Types.ObjectId(requestData.taskTypeId) : null,
        createdBy: new mongoose.Types.ObjectId(createdByPersonId),
        eventId: null,
    };
}
