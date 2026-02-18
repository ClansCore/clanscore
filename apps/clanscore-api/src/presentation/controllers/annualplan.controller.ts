import { Request, Response } from "express";
import { ErrorType } from "@clanscore/shared";
import { sendError } from "../middleware/error.middleware";
import { AnnualPlanEntity, toAnnualPlanDTO } from "../../infrastructure/database/mappers/gamification/annualPlan.mapper";
import * as db from "../../infrastructure/database/gamification.db.service";

export async function getAnnualPlans(req: Request, res: Response) {
  const result = await db.getAnnualPlans();
  if (!result.ok) return sendError(res, result.error);
  return res.json(result.value.map(toAnnualPlanDTO));
}

export async function updateAnnualPlan(req: Request, res: Response) {
  try {
    const updateId = req.params.annualPlanId;
    const annualPlan = req.body?.annualPlan;
    if (!annualPlan) {
      return sendError(res, {
        type: ErrorType.ValidationError,
        details: { message: "Missing annualPlan object in body" }
      });
    }
    const allowedUpdate: Partial<AnnualPlanEntity> = {
      amount: annualPlan.amount,
      amountPerActivity: annualPlan.amountPerActivity,
    };
    const updatedAnnualPlan = await db.updateAnnualPlan(updateId, allowedUpdate);
    if (!updatedAnnualPlan.ok) return sendError(res, updatedAnnualPlan.error);
    return res.json(toAnnualPlanDTO(updatedAnnualPlan.value));
  } catch (err) {
    return sendError(res, {
      type: ErrorType.UnknownError,
      details: { message: err instanceof Error ? err.message : String(err) }
    });
  }
}
