import mongoose from "mongoose";
import { toId } from "../core";
import type { AnnualPlanDTO } from "@clanscore/shared/src/dto/annualPlan.dto";
import { IAnnualPlan } from "../../../../domain/gamification/AnnualPlan";
import { TaskTypeEntity, toTaskTypeEntity, toTaskTypeDTO } from "./tasktype.mapper";

export type AnnualPlanEntity = {
  _id: string;
  amount: number;
  amountPerActivity: number;
  taskType: TaskTypeEntity;
};

export const toAnnualPlanEntity = (doc: any): AnnualPlanEntity => ({
  _id: toId(doc),
  amount: Number(doc.amount),
  amountPerActivity: Number(doc.amountPerActivity),
  taskType: toTaskTypeEntity(doc.taskTypeId)
});

export const toAnnualPlanDTO = (doc: AnnualPlanEntity): AnnualPlanDTO => ({
  id: doc._id,
  amount: Number(doc.amount),
  amountPerActivity: Number(doc.amountPerActivity),
  taskType: toTaskTypeDTO(doc.taskType),
});
