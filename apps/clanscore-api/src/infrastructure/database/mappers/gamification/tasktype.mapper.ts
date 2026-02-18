import { toId } from "../core";
import type { ITask } from "../../../../domain/gamification/Task";
import { TaskDTO } from "@clanscore/shared";
import { ITaskType } from "../../../../domain/gamification/TaskType";
import { TaskTypeDTO } from "@clanscore/shared/src/dto/tasktype.dto";

export type TaskTypeEntity = {
    id: String;
    name: String;
    compensation?: "Single" | "Expense";
    points: Number;
    clubCostShare?: number | null;
};

export const toTaskTypeEntity = (doc: ITaskType): TaskTypeEntity => ({
    id: toId(doc),
    name: doc.name,
    compensation: doc.compensation ?? null,
    clubCostShare: doc.clubCostShare ? Number(doc.clubCostShare.toString()) : null,
    points: doc.points
});

export const toTaskTypeDTO = (entity: TaskTypeEntity): TaskTypeDTO => ({
  id: String(entity.id),
  name: String(entity.name),
  compensation: entity.compensation,
  points: Number(entity.points),
  clubCostShare: typeof entity.clubCostShare !== 'undefined' ? Number(entity.clubCostShare) : null,
});