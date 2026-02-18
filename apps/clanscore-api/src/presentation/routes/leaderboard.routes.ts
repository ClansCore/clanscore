import { Router } from "express";
import * as ctl from "../controllers/leaderboard.controller";

export const leaderboardRouter = Router();

leaderboardRouter.get("/", ctl.getLeaderboards);
leaderboardRouter.post("/", ctl.createLeaderboardHandler);
leaderboardRouter.get("/active", ctl.getActiveLeaderboardsHandler);
leaderboardRouter.post("/:leaderboardId/entries", ctl.getLeaderboardEntries);
leaderboardRouter.post("/entries/active/increment", ctl.incrementActiveLeaderboardEntriesPointsHandler);
leaderboardRouter.get("/:id/ranking", ctl.getLeaderboardRankingHandler);
