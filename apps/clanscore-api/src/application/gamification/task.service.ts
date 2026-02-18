import mongoose, { Types } from "mongoose";
import {
    getPerson,
    getPersonByDiscordId,
} from "../../infrastructure/database/user.db.service";
import {
    getParticipantsByTaskId,
    getTask,
    getTaskParticipantByPersonIdAndTaskId,
    getTaskParticipantsByTaskId,
    incrementPersonPoints,
    saveTaskParticipant,
    saveTransaction,
    updateTaskParticipantCompleted,
    updateTaskCompleted,
} from "../../infrastructure/database/gamification.db.service";
import {
    err,
    ErrorType,
    ok
} from "@clanscore/shared";
import { incrementActiveLeaderboardEntriesPoints } from "./leaderboard.service";

export async function rewardPointsCore(taskId: string, personId: string) {
    const taskRes = await getTask(taskId);
    if (!taskRes.ok) return taskRes;
    const personRes = await getPerson(personId);
    if (!personRes.ok) return personRes;

    if (taskRes.value.points > 0) {
        const inc = await incrementPersonPoints(personId, taskRes.value.points);
        if (!inc.ok) return inc;
    }

    const tx = await saveTransaction({
        personId: new mongoose.Types.ObjectId(personId),
        taskId: new mongoose.Types.ObjectId(taskId),
        amount: taskRes.value.points,
        status: "Done",
    });
    if (!tx.ok) return tx;

    const lb = await incrementActiveLeaderboardEntriesPoints(tx.value);
    if (!lb.ok) {
        console.error(`Failed to increment leaderboard entries after task reward: ${lb.error.type}`);
    }

    const participantsRes = await getParticipantsByTaskId(taskId);
    if (participantsRes.ok) {
        const currentParticipants = participantsRes.value.length;
        const maxParticipants = taskRes.value.maxParticipants;
        
        if (currentParticipants >= maxParticipants) {
            const participantRecordsRes = await getTaskParticipantsByTaskId(taskId);
            if (participantRecordsRes.ok) {
                const allCompleted = participantRecordsRes.value.every(
                    (participant) => participant.completedByParticipant === true
                );
                
                if (allCompleted) {
                    const updateTaskResult = await updateTaskCompleted(taskId, true);
                    if (!updateTaskResult.ok) return updateTaskResult;
                }
            }
        }
    }

    return ok(undefined);
}

export async function claimTaskCore(userIdByPlatform: string, taskId: string) {
    if (!mongoose.isValidObjectId(taskId)) return err(ErrorType.TaskNotFound);
    const taskRes = await getTask(taskId);
    if (!taskRes.ok) return taskRes;
    const task = taskRes.value;

    if (task.completed) return err(ErrorType.TaskAlreadyCompleted);
    if (task.deadline && task.deadline <= new Date()) return err(ErrorType.TaskDeadlineReached);

    const participantsRes = await getParticipantsByTaskId(task._id);
    if (!participantsRes.ok) return participantsRes;

    if (participantsRes.value.length >= task.maxParticipants)
        return err(ErrorType.MaxParticipantsAmountReached);

    const userRes = await getPersonByDiscordId(userIdByPlatform); // später: generisch auflösen
    if (!userRes.ok) return userRes;

    const already = participantsRes.value.some(p => p._id === userRes.value._id);
    if (already) return err(ErrorType.TaskAlreadyClaimed);

    const saved = await saveTaskParticipant({
        participantId: new Types.ObjectId(userRes.value._id),
        taskId: new Types.ObjectId(task._id),
    });
    if (!saved.ok) return saved;

    const maxReached = participantsRes.value.length + 1 >= task.maxParticipants;
    return ok({ participant: saved.value, maxReached });
}

export async function completeTaskCore(taskId: string, userDiscordId: string) {
    if (!mongoose.isValidObjectId(taskId)) return err(ErrorType.TaskNotFound);

    const taskRes = await getTask(taskId);
    if (!taskRes.ok) return taskRes;
    const task = taskRes.value;
    if (task.completed) return err(ErrorType.TaskAlreadyCompleted);

    const personRes = await getPersonByDiscordId(userDiscordId); // getPersonByExternalId(provider, externalId)
    if (!personRes.ok) return personRes;
    const person = personRes.value;

    const tpRes = await getTaskParticipantByPersonIdAndTaskId(task._id, person._id);
    if (!tpRes.ok) return tpRes;
    if (tpRes.value.completedByParticipant) return err(ErrorType.TaskAlreadyCompleted);

    // ToDo: responsible mention auflösen (ohne Discord-Importe)
    let responsibleMention: string | undefined;
    if (task.responsible) {
        const respRes = await getPerson(task.responsible);
        if (respRes.ok && respRes.value.discordId) {
            responsibleMention = `<@${respRes.value.discordId}>`;
        }
    }

    const upd = await updateTaskParticipantCompleted(tpRes.value._id, true);
    if (!upd.ok) return upd;

    return ok({ task, person, participant: tpRes.value, responsibleMention });
}
