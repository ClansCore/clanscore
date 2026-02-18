import { Request, Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { ErrorType, ok, OpenTaskDTO, TaskDTO, TaskUpdateDTO } from "@clanscore/shared";
import { sendError } from "../middleware/error.middleware";
import { UserModel } from "../../application/user/user.model";
import { GamificationModel } from "../../application/gamification/gamification.model";
import { toTaskDTO, toTaskInput, TaskEntity, toTaskEntity, fromTaskDTOToTaskEntity } from "../../infrastructure/database/mappers/gamification/task.mapper";
import type { TaskInput } from "../../domain/gamification/Task";
import { toPersonDTO } from "../../infrastructure/database/mappers/user/person.mapper";
import { TaskTypeEntity, toTaskTypeDTO, toTaskTypeEntity } from "../../infrastructure/database/mappers/gamification/tasktype.mapper";
import * as db from "../../infrastructure/database/gamification.db.service";

export type TaskUpdateEvent =
    | { taskId: string; change: "responsible-set"; payload: { responsibleUserId: string } }
    | { taskId: string; change: "details-linked"; payload: { providerEventDetailsId: string } }
    | { taskId: string; change: "completed"; payload: { personId: string; participantId: string } };

export interface TaskNotifierPort {
    taskUpdated(event: TaskUpdateEvent): Promise<void>;
}

class NoopTaskNotifier implements TaskNotifierPort {
    async taskUpdated() { /* no-op */ }
}

export const taskNotifier: TaskNotifierPort = new NoopTaskNotifier();
import { claimTaskCore, completeTaskCore, rewardPointsCore } from "../../application/gamification/task.service";
import { toRewardDTO } from "../../infrastructure/database/mappers/gamification/reward.mapper";
import { TaskTypeInput } from "../../domain/gamification/TaskType";

const objectId = z
    .string()
    .refine((v) => mongoose.isValidObjectId(v), { message: "Invalid ObjectId" });

const createTaskSchema = z.object({
    body: z.object({
        name: z.string().min(1),
        description: z.string().optional().nullable(),
        points: z.number().int().positive(),
        maxParticipants: z.number().int().positive(),
        deadlineIso: z.string().datetime().nullable().optional(),
        createdByDiscordId: z.string().min(1),
        taskTypeId: z.string().optional().nullable(),
    }),
});

const setResponsibleSchema = z.object({
    params: z.object({ id: objectId }),
    body: z.object({ responsibleUserId: objectId }),
});

const setDetailsSchema = z.object({
    params: z.object({ id: objectId }),
    body: z.object({ providerEventDetailsId: objectId }),
});

const setTaskCompletedSchema = z.object({
    params: z.object({ id: objectId }),
    body: z.object({ completed: z.boolean() }),
});

const addTaskSchema = z.object({
    body: z.object({
        task: z.object({
            name: z.string().min(1),
            description: z.string().optional().nullable(),
            points: z.number().int().positive(),
            maxParticipants: z.number().int().positive(),
            deadline: z.string().datetime().nullable().optional(),
            createdBy: objectId,
            taskTypeId: objectId.optional().nullable(),
            eventId: objectId.optional().nullable(),
            responsible: objectId.optional().nullable(),
            completed: z.boolean().optional(),
        }),
    }),
});

export async function createTask(req: Request, res: Response) {
    const parsed = createTaskSchema.safeParse({ body: req.body });
    if (!parsed.success) {
        const message = parsed.error.issues.map((i) => i.message).join(", ");
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message },
        });
    }
    const {
        name,
        description,
        points,
        maxParticipants,
        deadlineIso,
        createdByDiscordId,
        taskTypeId,
    } = parsed.data.body;

    const personResult = await UserModel.getPersonByDiscordId(createdByDiscordId);
    if (!personResult.ok) return sendError(res, personResult.error);

    const taskInput = toTaskInput(
        {
            name,
            description,
            points,
            maxParticipants,
            deadlineIso,
            createdByDiscordId,
            taskTypeId: taskTypeId || null,
        },
        personResult.value._id,
    );

    const saveResult = await GamificationModel.saveTask(taskInput);
    if (!saveResult.ok) return sendError(res, saveResult.error);

    return res.json({ id: saveResult.value._id });
}

export async function getTaskById(req: Request, res: Response) {
    const { id } = req.params;
    const result = await GamificationModel.getTask(id);
    if (!result.ok) return sendError(res, result.error);
    return res.json(toTaskDTO(result.value));
}

export async function setTaskResponsible(req: Request, res: Response) {
    const parsed = setResponsibleSchema.safeParse({ params: req.params, body: req.body });
    if (!parsed.success) {
        const parsedError = parsed.error.issues.join(", ");
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: parsedError },
        });
    }

    const { id } = parsed.data.params;
    const { responsibleUserId } = parsed.data.body;

    const result = await GamificationModel.updateTaskResponsible(id, responsibleUserId);
    if (!result.ok) return sendError(res, result.error);

    await taskNotifier.taskUpdated({
        taskId: id,
        change: "responsible-set",
        payload: { responsibleUserId },
    });

    return res.json(ok(result.value));
}

export async function setTaskDetails(req: Request, res: Response) {
    const parsed = setDetailsSchema.safeParse({ params: req.params, body: req.body });
    if (!parsed.success) {
        const parsedError = parsed.error.issues.join(", ");
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: parsedError },
        });
    }

    const { id } = parsed.data.params;
    const { providerEventDetailsId } = parsed.data.body;

    const result = await GamificationModel.updateTaskEvent(id, providerEventDetailsId);
    if (!result.ok) return sendError(res, result.error);

    await taskNotifier.taskUpdated({
        taskId: id,
        change: "details-linked",
        payload: { providerEventDetailsId },
    });

    return res.json(ok(result.value));
}


export async function setTaskCompleted(req: Request, res: Response) {
    const parsed = setTaskCompletedSchema.safeParse({ params: req.params, body: req.body });
    if (!parsed.success) {
        const parsedError = parsed.error.issues.join(", ");
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: parsedError },
        });
    }

    const { id } = parsed.data.params;
    const { completed } = parsed.data.body;

    const result = await GamificationModel.updateTaskCompleted(id, completed);
    if (!result.ok) return sendError(res, result.error);

    return res.json(toTaskDTO(result.value));
}

export async function claimTask(req: Request, res: Response) {
    const { id } = req.params;
    const { discordId } = req.body;
    
    if (!discordId) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Missing discordId in body" },
        });
    }

    const result = await claimTaskCore(discordId, id);
    if (!result.ok) return sendError(res, result.error);
    return res.json(result);
}

export async function completeTask(req: Request, res: Response) {
    const { id } = req.params;
    const { discordId } = req.body;
    
    if (!discordId) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Missing discordId in body" },
        });
    }

    const result = await completeTaskCore(id, discordId);
    if (!result.ok) return sendError(res, result.error);
    
    const { task, person, participant, responsibleMention } = result.value;
    
    return res.json({
        task: toTaskDTO(task),
        person: toPersonDTO(person),
        participant: {
            id: participant._id.toString(),
            taskId: participant.taskId.toString(),
            participantId: participant.participantId.toString(),
            registrationDate: participant.registrationDate?.toISOString(),
            completedByParticipant: participant.completedByParticipant,
        },
        responsibleMention,
    });
}

export async function getTaskParticipantById(req: Request, res: Response) {
    const { id } = req.params;
    const result = await GamificationModel.getTaskParticipant(id);
    if (!result.ok) return sendError(res, result.error);
    
    return res.json({
        id: result.value._id,
        taskId: result.value.taskId,
        participantId: result.value.participantId,
        registrationDate: result.value.registrationDate?.toISOString(),
        completedByParticipant: result.value.completedByParticipant,
    });
}

export async function rewardTaskParticipant(req: Request, res: Response) {
    const { id } = req.params;
    const { personId } = req.body;

    if (!personId) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Missing personId in body" },
        });
    }

    const result = await rewardPointsCore(id, personId);
    if (!result.ok) return sendError(res, result.error);
    
    const taskResult = await GamificationModel.getTask(id);
    if (!taskResult.ok) {
        return res.json({ ok: true, maxReached: false });
    }
    
    const participantsResult = await GamificationModel.getParticipantsByTaskId(id);
    if (!participantsResult.ok) {
        return res.json({ ok: true, maxReached: false });
    }
    
    const maxReached = participantsResult.value.length >= taskResult.value.maxParticipants;
    
    return res.json({ ok: true, maxReached });
}

export async function resetTaskParticipantCompleted(req: Request, res: Response) {
    const { id } = req.params;
    
    const result = await GamificationModel.updateTaskParticipantCompleted(id, false);
    if (!result.ok) return sendError(res, result.error);
    
    return res.json({ ok: true });
}

export async function getExpiredTasks(req: Request, res: Response) {
    const result = await GamificationModel.getExpiredTasks();
    if (!result.ok) return sendError(res, result.error);
    return res.json(result.value.map(toTaskDTO));
}

export async function getOpenTasks(req: Request, res: Response) {
    const result = await GamificationModel.getOpenTasks();
    if (!result.ok) return sendError(res, result.error);
    return res.json(result.value.map(toTaskDTO));
}

export async function getDoneTasks(req: Request, res: Response) {
    const result = await GamificationModel.getDoneTasks();
    if (!result.ok) return sendError(res, result.error);
    return res.json(result.value.map(toTaskDTO));
}

export async function getAllTasks(req: Request, res: Response) {
    const result = await GamificationModel.getAllTasks();
    if (!result.ok) return sendError(res, result.error);
    return res.json(result.value.map(toTaskDTO));
}

export async function getTaskParticipantsByTaskId(req: Request, res: Response) {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Invalid task ID" },
        });
    }

    const result = await GamificationModel.getParticipantsByTaskId(id);
    if (!result.ok) return sendError(res, result.error);
    
    return res.json(result.value.map(toPersonDTO));
}

export async function getTaskParticipantRecordsByTaskId(req: Request, res: Response) {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Invalid task ID" },
        });
    }

    const result = await GamificationModel.getTaskParticipantsByTaskId(id);
    if (!result.ok) return sendError(res, result.error);
    
    return res.json(result.value.map((participant) => ({
        id: participant._id,
        taskId: participant.taskId,
        participantId: participant.participantId,
        registrationDate: participant.registrationDate?.toISOString(),
        completedByParticipant: participant.completedByParticipant,
    })));
}

export async function getOpenTasksForDiscordUser(req: Request, res: Response) {
    const { discordId } = req.params;
    
    const personResult = await UserModel.getPersonByDiscordId(discordId);
    if (!personResult.ok) return sendError(res, personResult.error);
    
    const participantsResult = await GamificationModel.getTaskParticipantsByPerson(personResult.value._id);
    if (!participantsResult.ok) return sendError(res, participantsResult.error);
    
    const openTasks: OpenTaskDTO[] = [];
    
    for (const tp of participantsResult.value) {
        if (tp.completedByParticipant) continue;
        
        const taskResult = await GamificationModel.getTask(tp.task.id);
        if (!taskResult.ok) continue;
        
        const task = taskResult.value;
        if (task.completed) continue;
        
        openTasks.push({
            id: task._id,
            name: task.name,
        });
    }
    
    return res.json(openTasks);
}

export async function addTask(req: Request, res: Response) {
    const parsed = addTaskSchema.safeParse({ body: req.body });
    if (!parsed.success) {
        const message = parsed.error.issues.map((i) => i.message).join(", ");
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message },
        });
    }

    const taskData = parsed.data.body.task;

    const taskInput: TaskInput = {
        name: taskData.name,
        description: taskData.description ?? null,
        deadline: taskData.deadline ? new Date(taskData.deadline) : null,
        points: taskData.points,
        maxParticipants: taskData.maxParticipants,
        responsible: taskData.responsible ? new mongoose.Types.ObjectId(taskData.responsible) : undefined,
        completed: taskData.completed ?? false,
        taskTypeId: taskData.taskTypeId ? new mongoose.Types.ObjectId(taskData.taskTypeId) : null,
        createdBy: new mongoose.Types.ObjectId(taskData.createdBy),
        eventId: taskData.eventId ? new mongoose.Types.ObjectId(taskData.eventId) : null,
    };

    const r = await GamificationModel.saveTask(taskInput);
    if (!r.ok) return sendError(res, r.error);
    return res.json(toTaskDTO(r.value));
}

export async function updateTask(req: Request, res: Response) {
    try {
        const task = req.body?.task as TaskDTO;
        if (!task) {
            return sendError(res, {
                type: ErrorType.ValidationError,
                details: { message: "Missing task object in body" }
            });
        }
        const updatedTask = await db.updateTask(fromTaskDTOToTaskEntity(task));
        if (!updatedTask.ok) return sendError(res, updatedTask.error);
        return res.json(toTaskDTO(updatedTask.value));
    } catch (err) {
        return sendError(res, {
            type: ErrorType.UnknownError,
            details: { message: err instanceof Error ? err.message : String(err) }
        });
    }
}

export async function deleteTask(req: Request, res: Response) {
    const { taskId } = req.params;
    if (!mongoose.isValidObjectId(taskId)) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Invalid task ID" },
        });
    }
    const r = await db.removeTask(taskId);
    if (!r.ok) return sendError(res, r.error);
    return res.json(toTaskDTO(r.value));
}

export async function getAllTaskTypes(req: Request, res: Response) {
    const r = await db.getAllTaskTypes();
    if (!r.ok) return sendError(res, r.error);
    return res.json(r.value.map(toTaskTypeEntity));
}

export async function addTaskType(req: Request, res: Response) {
    try {
        const taskType = req.body?.taskType;
        if (!taskType) {
            return sendError(res, {
                type: ErrorType.ValidationError,
                details: { message: "Missing taskType object in body" }
            });
        }
        const taskTypeInput: TaskTypeInput = {
            name: taskType.name,
            compensation: taskType.compensation,
            points: taskType.points,
            clubCostShare: taskType.clubCostShare ?? null,
        };
        const r = await GamificationModel.addTaskType(taskTypeInput);
        if (!r.ok) return sendError(res, r.error);
        return res.json(toTaskTypeDTO(r.value));
    } catch (err) {
        return sendError(res, {
            type: ErrorType.UnknownError,
            details: { message: err instanceof Error ? err.message : String(err) }
        });
    }
}

export async function updateTaskType(req: Request, res: Response) {
    try {
        const taskType = req.body?.taskType;
        if (!taskType || !taskType.id) {
            return sendError(res, {
                type: ErrorType.ValidationError,
                    details: { message: "Missing taskType object or taskType.id in body" }
            });
        }
        const update: Partial<TaskTypeEntity> = {
            name: taskType.name,
            compensation: taskType.compensation,
            points: taskType.points,
            clubCostShare: taskType.clubCostShare ?? null,
        };
        const updatedTaskType = await GamificationModel.updateTaskType(taskType.id, update);
        if (!updatedTaskType.ok) return sendError(res, updatedTaskType.error);
        return res.json(toTaskTypeDTO(updatedTaskType.value));
    } catch (err) {
        return sendError(res, {
            type: ErrorType.UnknownError,
            details: { message: err instanceof Error ? err.message : String(err) }
        });
    }
}

    export async function deleteTaskType(req: Request, res: Response) {
    const { id } = req.params;
    const r = await GamificationModel.deleteTaskType(id);
    if (!r.ok) return sendError(res, r.error);
    return res.json(toTaskTypeDTO(r.value));
}
