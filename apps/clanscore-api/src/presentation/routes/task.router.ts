import { Router } from "express";
import * as ctl from "../controllers/task.controller";

export const tasksRouter = Router();

// POST / - unterstützt sowohl createTask (Discord-Bot) als auch addTask (Dashboard)
tasksRouter.post("/", (req, res) => {
    // Dashboard sendet {task: {...}}, Discord-Bot sendet flache Felder >>> Später noch überarbeiten !!!
    if (req.body?.task) {
        return ctl.addTask(req, res);
    } else {
        return ctl.createTask(req, res);
    }
});
tasksRouter.get("/", ctl.getAllTasks);
tasksRouter.get("/tasktypes", ctl.getAllTaskTypes);
tasksRouter.post("/tasktypes", ctl.addTaskType);
tasksRouter.patch("/tasktypes/:id", ctl.updateTaskType);
tasksRouter.delete("/tasktypes/:id", ctl.deleteTaskType);
tasksRouter.get("/done", ctl.getDoneTasks);
tasksRouter.get("/open", ctl.getOpenTasks);
tasksRouter.get("/open/:discordId", ctl.getOpenTasksForDiscordUser);
tasksRouter.get("/expired", ctl.getExpiredTasks);

tasksRouter.get("/:id", ctl.getTaskById);
tasksRouter.patch("/:taskId", ctl.updateTask);
tasksRouter.delete("/:taskId", ctl.deleteTask);
tasksRouter.post("/:id/claim", ctl.claimTask);
tasksRouter.post("/:id/complete", ctl.completeTask);
tasksRouter.post("/:id/reward", ctl.rewardTaskParticipant);
tasksRouter.post("/:id/responsible", ctl.setTaskResponsible);
tasksRouter.post("/:id/details", ctl.setTaskDetails);
tasksRouter.post("/:id/completed", ctl.setTaskCompleted);

tasksRouter.post("/participants/:id/reset-completed", ctl.resetTaskParticipantCompleted);
tasksRouter.get("/participants/:id", ctl.getTaskParticipantById);
tasksRouter.get("/:id/participants", ctl.getTaskParticipantsByTaskId);
tasksRouter.get("/:id/participant-records", ctl.getTaskParticipantRecordsByTaskId);
