import { Router } from "express";
import { usersRouter } from "./routes/user.routes";
import { tasksRouter } from "./routes/task.router";
import { rolesRouter } from "./routes/roles.routes";
import { calendarRouter } from "./routes/calendar.routes";
import { eventsRouter } from "./routes/events.routes";
import { leaderboardRouter } from "./routes/leaderboard.routes";
import { rewardsRouter } from "./routes/reward.routes";
import { donationsRouter } from "./routes/donation.routes";
import { transactionsRouter } from "./routes/transaction.routes";
import { authRouter } from "./routes/auth.routes";
import { gamificationparameterRouter } from "./routes/gamificationparameter.routes";
import { annualplanRouter } from "./routes/annualplan.routes";

export const api = Router();
api.use("/user", usersRouter);
api.use("/roles", rolesRouter);

api.use("/calendar", calendarRouter);
api.use("/events", eventsRouter);

api.use("/tasks", tasksRouter);
api.use("/leaderboards", leaderboardRouter);
api.use("/rewards", rewardsRouter);
api.use("/donations", donationsRouter);
api.use("/transactions", transactionsRouter);
api.use("/gamificationparameter", gamificationparameterRouter);
api.use("/auth", authRouter);
api.use("/annualplan", annualplanRouter);
