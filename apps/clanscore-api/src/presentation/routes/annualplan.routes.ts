import { Router } from "express";
import * as ctl from "../controllers/annualplan.controller";

export const annualplanRouter = Router();

annualplanRouter.get("/", ctl.getAnnualPlans);
annualplanRouter.patch("/:annualPlanId", ctl.updateAnnualPlan);
