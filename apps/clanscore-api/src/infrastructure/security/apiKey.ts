import { Request, Response, NextFunction } from "express";
import { config } from "../../config";

export function apiKeyGuard(req: Request, res: Response, next: NextFunction) {
  const k = req.header("x-api-key");
  if (!config.CLANSCORE_API_KEY || k !== config.CLANSCORE_API_KEY) {
    return res.status(401).json({ code: "PermissionDenied" });
  }
  next();
}
