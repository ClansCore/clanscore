import { Router } from "express";
import * as ctl from "../controllers/auth.controller";

export const authRouter = Router();

authRouter.get("/logout", ctl.logout);
authRouter.post("/login", ctl.login);
authRouter.post("/register", ctl.register);