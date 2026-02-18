import { Router } from "express";
import * as ctl from "../controllers/gamificationparameter.controller";

export const gamificationparameterRouter = Router();

gamificationparameterRouter.get("/", ctl.getGamificationParameter);
gamificationparameterRouter.patch("/", ctl.updateGamificationParameter);
