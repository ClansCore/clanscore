import mongoose from "mongoose";
import { handleMongooseError } from "../errors/mongooseAdapter";
import {
    ErrorType,
    ErrorDetails,
    ok,
    Result,
    err,
    getErrorMessage,
} from "@clanscore/shared";
import { IPerson, Person } from "../../domain/user/Person";
import {
    Transaction,
    TransactionInput,
} from "../../domain/gamification/Transaction";
import {
    Leaderboard,
    LeaderboardInput,
} from "../../domain/gamification/Leaderboard";
import {
    ILeaderboardEntry,
    LeaderboardEntry,
} from "../../domain/gamification/LeaderboardEntry";
import {
    LeaderboardTransaction,
    LeaderboardTransactionInput,
} from "../../domain/gamification/LeaderboardTransaction";
import { ITask, Task, TaskInput } from "../../domain/gamification/Task";
import {
    TaskParticipant,
    TaskParticipantInput,
} from "../../domain/gamification/TaskParticipant";
import {
    Donation,
    DonationInput,
} from "../../domain/gamification/Donation";
import { Reward, RewardInput } from "../../domain/gamification/Reward";
import { toTransactionEntity, TransactionEntity } from "./mappers/gamification/transaction.mapper";
import { LeaderboardEntity, toLeaderboardEntity } from "./mappers/gamification/leaderboard.mapper";
import { LeaderboardEntryEntity, LeaderboardPopulatedEntryEntity, toLeaderboardEntryEntity, toLeaderboardEntryWithPersonEntity } from "./mappers/gamification/leaderboardEntry.mapper";
import { LeaderboardTransactionEntity, toLeaderboardTransactionEntity } from "./mappers/gamification/leaderboardTransaction.mapper";
import { TaskEntity, toTaskEntity } from "./mappers/gamification/task.mapper";
import { TaskParticipantEntity, TaskParticipantWithTaskEntity, toTaskParticipantEntity, toTaskParticipantWithTaskEntity } from "./mappers/gamification/taskParticipant.mapper";
import { PersonEntity, toPersonEntity } from "./mappers/user/person.mapper";
import { DonationEntity, toDonationEntity } from "./mappers/gamification/donation.mapper";
import { RewardEntity, toRewardEntity } from "./mappers/gamification/reward.mapper";
import { ITaskType, TaskType, TaskTypeInput } from "../../domain/gamification/TaskType";
import { GamificationParameter, IGamificationParameter } from "../../domain/gamification/GamificationParameter";
import { GamificationParameterEntity } from "./mappers/gamification/gamificationParameter.mapper";
import { AnnualPlan, IAnnualPlan } from "../../domain/gamification/AnnualPlan";
import { AnnualPlanEntity, toAnnualPlanEntity } from "./mappers/gamification/annualPlan.mapper";
import { TaskTypeEntity, toTaskTypeEntity } from "./mappers/gamification/tasktype.mapper";
export async function getTransaction(
    transactionId: string,
): Promise<Result<TransactionEntity, ErrorDetails>> {
    try {
        const transaction = await Transaction.findById(
            transactionId,
        ).lean();
        if (!transaction) return err(ErrorType.TransactionNotFound);
        return ok(toTransactionEntity(transaction));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function saveTransaction(
    transactionData: TransactionInput,
): Promise<Result<TransactionEntity, ErrorDetails>> {
    try {
        const transaction = new Transaction(transactionData);
        const saved = await transaction.save();
        return ok(toTransactionEntity(saved.toObject()));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function updateTransactionStatusByID(
    transactionId: string | mongoose.Types.ObjectId,
    newStatus: "Pending" | "Done" | "Failed",
): Promise<Result<void, ErrorDetails>> {
    try {
        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return err(ErrorType.NotFound);
        }

        transaction.status = newStatus;
        transaction.updatedAt = new Date();
        await transaction.save();
        return ok(undefined);
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getTransactionsByPersonId(
    personId: string | mongoose.Types.ObjectId,
): Promise<Result<TransactionEntity[], ErrorDetails>> {
    try {
        const transactions = await Transaction.find({ personId }).lean();
        if (!transactions || transactions?.length === 0) {
            return err(ErrorType.TransactionNotFound, {
                personId: personId.toString(),
            });
        }
        return ok(transactions.map(toTransactionEntity));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getTransactionsByPersonIdWithDetails(
    personId: string | mongoose.Types.ObjectId,
): Promise<Result<any[], ErrorDetails>> {   // raw documents
    try {
        const transactions = await Transaction.find({ personId, status: "Done" })
            .sort({ updatedAt: -1 })
            .populate({ path: "taskId", select: "name" })
            .populate({ path: "donationId", select: "amount" })
            .populate({ path: "rewardId", select: "name" })
            .lean();

        if (!transactions || transactions.length === 0) {
            return err(ErrorType.TransactionNotFound, { personId: personId.toString() });
        }

        return ok(transactions);
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getTransactionByDonationId(
    donationId: string | mongoose.Types.ObjectId,
): Promise<Result<TransactionEntity, ErrorDetails>> {
    try {
        const transaction = await Transaction.findOne({
            donationId: donationId,
        }).lean();
        if (!transaction) return err(ErrorType.TransactionNotFound);
        return ok(toTransactionEntity(transaction));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getCompletedPositiveTransactionsInTimeframe(
    startDate: Date,
    endDate: Date,
): Promise<Result<TransactionEntity[], ErrorDetails>> {
    try {
        const activeTransactions = await Transaction.find({
            createdAt: { $gte: startDate, $lte: endDate },
            status: "Done",
            amount: { $gt: 0 },
        }).lean();

        return ok(activeTransactions.map(toTransactionEntity));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function deleteTransactionsByPerson(
    personId: string | mongoose.Types.ObjectId, session?: mongoose.ClientSession
) {
    try {
        const query = Transaction.deleteMany({ personId });
        if (session) query.session(session);
        await query;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDetails: ErrorDetails = {
            type: ErrorType.DatabaseGenericError,
            details: {
                message: `Error deleting transactions: ${errorMessage}`,
            }
        };
        getErrorMessage(errorDetails);
    }
}

export async function getLeaderboards(): Promise<
    Result<LeaderboardEntity[], ErrorDetails>
> {
    try {
        const leaderboards = await Leaderboard.find().lean();
        if (leaderboards.length === 0) return err(ErrorType.LeaderboardNotFound);
        return ok(leaderboards.map(toLeaderboardEntity));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getActiveLeaderboards(): Promise<
    Result<LeaderboardEntity[], ErrorDetails>
> {
    try {
        const now = new Date();

        const activeLeaderboards = await Leaderboard.find({
            startDate: { $lte: now },
            endDate: { $gte: now },
        }).lean();

        if (!activeLeaderboards || activeLeaderboards.length === 0) {
            return err(ErrorType.LeaderboardNotFound);
        }

        return ok(activeLeaderboards.map(toLeaderboardEntity));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function saveLeaderboard(
    leaderboardData: LeaderboardInput,
): Promise<Result<LeaderboardEntity, ErrorDetails>> {
    try {
        const leaderboard = new Leaderboard(leaderboardData);
        const saved = await leaderboard.save();
        return ok(toLeaderboardEntity(saved.toObject()));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getLeaderboardEntriesByPersonId(
    personId: string | mongoose.Types.ObjectId,
): Promise<Result<LeaderboardEntryEntity[], ErrorDetails>> {
    try {
        const result = await LeaderboardEntry.find({
            personId,
        }).lean();
        if (!result) return err(ErrorType.LeaderboardEntryNotFound);
        return ok(result.map(toLeaderboardEntryEntity));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function saveLeaderboardEntry(
    leaderboardEntryData: ILeaderboardEntry,
): Promise<Result<LeaderboardEntryEntity, ErrorDetails>> {
    try {
        const leaderboardEntry = new LeaderboardEntry(leaderboardEntryData);
        const saved = await leaderboardEntry.save();
        return ok(toLeaderboardEntryEntity(saved.toObject()));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getLeaderboardRanking(
    leaderboardId: string | mongoose.Types.ObjectId,
    numberVisibleEntries: number,
): Promise<Result<LeaderboardPopulatedEntryEntity[], ErrorDetails>> {
    try {
        const entries = await LeaderboardEntry.find({ leaderboardId })
            .sort({ score: -1 }) // Highest first
            .limit(numberVisibleEntries)
            .populate({
                path: "personId",
                select: "nickname",
            })
            .lean();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return ok((entries as any[]).map(toLeaderboardEntryWithPersonEntity));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function incrementPersonPoints(
    personId: string | mongoose.Types.ObjectId,
    points: number,
): Promise<Result<void, ErrorDetails>> {
    try {
        const result = await Person.updateOne(
            { _id: personId },
            { $inc: { score: points } },
        );
        if (result.modifiedCount === 0) return err(ErrorType.UserNotFound);
        return ok(undefined);
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function decrementPersonPoints(
    personId: string | mongoose.Types.ObjectId,
    points: number,
): Promise<Result<void, ErrorDetails>> {
    try {
        const result = await Person.updateOne(
            { _id: personId },
            { $inc: { score: -points } },
        );
        if (result.modifiedCount === 0) return err(ErrorType.UserNotFound);
        return ok(undefined);
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function incrementLeaderboardPoints(
    personId: string | mongoose.Types.ObjectId,
    points: number,
): Promise<Result<LeaderboardEntryEntity, ErrorDetails>> {
    try {
        const updated = await LeaderboardEntry.findOneAndUpdate(
            { personId },
            { $inc: { score: points }, updatedAt: Date.now() },
            { new: true },
        );
        if (!updated) return err(ErrorType.LeaderboardEntryNotFound);
        return ok(toLeaderboardEntryEntity(updated));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function incrementLeaderboardEntry(
    personId: string | mongoose.Types.ObjectId,
    leaderboardId: string | mongoose.Types.ObjectId,
    points: number,
) {
    try {
        const entry = await LeaderboardEntry.findOneAndUpdate(
            { personId, leaderboardId: leaderboardId },
            {
                $inc: { score: points },
                $set: { updatedAt: new Date() },
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            },
        );
        return ok(toLeaderboardEntryEntity(entry));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function saveLeaderboardTransaction(
    data: LeaderboardTransactionInput,
): Promise<Result<LeaderboardTransactionEntity, ErrorDetails>> {
    try {
        const saved = await new LeaderboardTransaction(data).save();
        return ok(toLeaderboardTransactionEntity(saved.toObject()));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function saveTask(
    taskData: TaskInput
): Promise<Result<TaskEntity, ErrorDetails>> {
    try {
        const saved = await new Task(taskData).save();
        return ok(toTaskEntity(saved.toObject()));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function updateTask(
    task: TaskEntity
): Promise<Result<TaskEntity, ErrorDetails>> {
    try {
        const updatedTask = await Task.findByIdAndUpdate(
            task._id,
            task
        );
        if (!updatedTask) return err(ErrorType.TaskNotFound);
        return ok(task);
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function removeTask(
    taskId: string | mongoose.Types.ObjectId, session?: mongoose.ClientSession
): Promise<Result<TaskEntity, ErrorDetails>> {
    try {
        const query = Task.findOneAndDelete({
            _id: taskId,
        }).lean<TaskEntity | null>();
        if (session) query.session(session);
        const task = await query;

        if (!task) return err(ErrorType.TaskNotFound, { taskId: taskId?.toString() });

        return ok(task);
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function updateTaskResponsible(
    taskId: string | mongoose.Types.ObjectId,
    responsibleUserId: string | mongoose.Types.ObjectId,
) {
    try {
        const result = await Task.findByIdAndUpdate(
            taskId,
            { responsible: responsibleUserId },
            { new: true, lean: true }
        );
        if (!result) return err(ErrorType.TaskNotFound, { taskId: taskId.toString() });
        return ok(toTaskEntity(result));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function updateTaskEvent(
    taskId: string | mongoose.Types.ObjectId,
    eventId: string | mongoose.Types.ObjectId,
) {
    try {
        const result = await Task.findByIdAndUpdate(
            taskId,
            { eventId: eventId },
            { new: true, lean: true }
        );
        if (!result) return err(ErrorType.TaskNotFound, { taskId: taskId.toString() });
        return ok(toTaskEntity(result));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function updateTaskCompleted(
    taskId: string | mongoose.Types.ObjectId,
    completed: boolean,
) {
    try {
        const result = await Task.findByIdAndUpdate(
            taskId,
            { completed },
            { new: true, lean: true }
        );
        if (!result) return err(ErrorType.TaskNotFound, { taskId: taskId.toString() });
        return ok(toTaskEntity(result));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getAllTasks(): Promise<Result<TaskEntity[], ErrorDetails>> {
    try {
        const tasks = await Task.find().lean<ITask[]>();
        const tasksWithCounts = await Promise.all(tasks.map(async task => {
        const participantCount = await TaskParticipant.countDocuments({ taskId: task._id });
        return { ...toTaskEntity(task), participantCount };
        }));
        return ok(tasksWithCounts);
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getTask(
    taskId: string,
): Promise<Result<TaskEntity, ErrorDetails>> {
    try {
        const task = await Task.findById(taskId).lean<ITask | null>();
        if (!task) return err(ErrorType.TaskNotFound, { taskId: taskId });
        return ok(toTaskEntity(task));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getExpiredTasks(): Promise<
    Result<TaskEntity[], ErrorDetails>
> {
    try {
        const expiredTasks = await Task.find({
            deadline: { $ne: null, $lte: Date.now() },
            completed: false,
        });
        return ok(expiredTasks.map(toTaskEntity));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getOpenTasks(): Promise<
    Result<TaskEntity[], ErrorDetails>
> {
    try {
        const tasks = await Task.find({
            completed: false,
        }).lean<ITask[]>();
        return ok(tasks.map(toTaskEntity));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getDoneTasks(): Promise<
    Result<TaskEntity[], ErrorDetails>
> {
    try {
        const tasks = await Task.find({
            completed: true,
        }).lean<ITask[]>();
        return ok(tasks.map(toTaskEntity));
    } catch (error) {
        return handleMongooseError(error);
    }
}


export async function saveTaskParticipant(
    participantData: TaskParticipantInput,
): Promise<Result<TaskParticipantEntity, ErrorDetails>> {
    try {
        const newParticipant = new TaskParticipant(participantData);
        const saved = await newParticipant.save();
        return ok(toTaskParticipantEntity(saved.toObject()));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getParticipantsByTaskId(
    taskId: string | mongoose.Types.ObjectId,
): Promise<Result<PersonEntity[], ErrorDetails>> {
    try {
        const participants = await TaskParticipant
            .find({ taskId })
            .populate<{ participantId: IPerson }>("participantId")
            .lean();
        const people = participants
            .map((p) => p.participantId)
            .filter(
                (person): person is IPerson =>
                    person !== null && typeof person === "object",
            );
        return ok(people.map(toPersonEntity));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getTaskParticipantsByTaskId(
    taskId: string | mongoose.Types.ObjectId,
): Promise<Result<TaskParticipantEntity[], ErrorDetails>> {
    try {
        const participants = await TaskParticipant
            .find({ taskId })
            .lean();
        return ok(participants.map(toTaskParticipantEntity));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getTaskParticipant(
    taskParticipantId: string | mongoose.Types.ObjectId,
): Promise<Result<TaskParticipantEntity, ErrorDetails>> {
    try {
        const participant = await TaskParticipant.findById(taskParticipantId).lean();
        if (!participant) return err(ErrorType.TaskParticipantNotFound);
        return ok(toTaskParticipantEntity(participant));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getTaskParticipantByPersonIdAndTaskId(
    taskId: string | mongoose.Types.ObjectId,
    personId: string | mongoose.Types.ObjectId,
): Promise<Result<TaskParticipantEntity, ErrorDetails>> {
    try {
        const participant = await TaskParticipant
            .findOne({
                taskId: taskId,
                participantId: personId,
            })
            .lean();
        if (!participant) {
            return err(ErrorType.TaskParticipantNotFound);
        }
        return ok(toTaskParticipantEntity(participant));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getTaskParticipantsByPerson(
    personId: string | mongoose.Types.ObjectId,
): Promise<Result<TaskParticipantWithTaskEntity[], ErrorDetails>> {
    try {
        const participants = await TaskParticipant.find({ participantId: personId })
            .populate<{ taskId: ITask | null }>("taskId")
            .lean();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = (participants as any[])
            .map(toTaskParticipantWithTaskEntity)
            .filter((p): p is TaskParticipantWithTaskEntity => p !== null);
        return ok(mapped);
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function updateTaskParticipantCompleted(
    id: string | mongoose.Types.ObjectId,
    completed: boolean,
) {
    try {
        const updatedTaskParticipant = await TaskParticipant.findByIdAndUpdate(
            id,
            { completedByParticipant: completed },
            { new: true, lean: true }
        );
        if (!updatedTaskParticipant) {
            return err(ErrorType.TaskParticipantNotFound);
        }
        return ok(toTaskParticipantEntity(updatedTaskParticipant));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function deleteTaskParticipantsByPerson(
    personId: string | mongoose.Types.ObjectId, session?: mongoose.ClientSession
) {
    try {
        const query = TaskParticipant.deleteMany({ participantId: personId });
        if (session) query.session(session);
        await query;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDetails: ErrorDetails = {
            type: ErrorType.DatabaseGenericError,
            details: {
                message: `Error deleting task participants: ${errorMessage}`,
            }
        };
        getErrorMessage(errorDetails);
    }
}

export async function getDonation(
    donationId: string | mongoose.Types.ObjectId,
): Promise<Result<DonationEntity, ErrorDetails>> {
    try {
        const donation = await Donation.findById(donationId).lean();
        if (!donation) return err(ErrorType.NotFound);
        return ok(toDonationEntity(donation));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getDonationsByPersonId(
    personId: string | mongoose.Types.ObjectId,
): Promise<Result<DonationEntity[], ErrorDetails>> {
    try {
        const donations = await Donation.find({ donatorId: personId }).lean();
        if (!donations || donations.length === 0) {
            return err(ErrorType.NotFound, { personId: personId.toString() });
        }
        return ok(donations.map(toDonationEntity));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function saveDonation(
    donationData: DonationInput,
): Promise<Result<DonationEntity, ErrorDetails>> {
    try {
        const newDonation = new Donation(donationData);
        const saved = await newDonation.save();
        return ok(toDonationEntity(saved.toObject()));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function updateDonationDonor(
    donationId: string | mongoose.Types.ObjectId,
    donatorId: string | mongoose.Types.ObjectId,
): Promise<Result<DonationEntity, ErrorDetails>> {
    try {
        const result = await Donation.findByIdAndUpdate(
            donationId,
            { donatorId: donatorId },
            { new: true, lean: true }
        );
        if (!result) return err(ErrorType.NotFound);
        return ok(toDonationEntity(result));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function deleteDonationsByPerson(
    personId: string | mongoose.Types.ObjectId, session?: mongoose.ClientSession
) {
    try {
        const query = Donation.deleteMany({ donatorId: personId });
        if (session) query.session(session);
        await query;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDetails: ErrorDetails = {
            type: ErrorType.DatabaseGenericError,
            details: {
                message: `Error deleting donations: ${errorMessage}`,
            }
        };
        getErrorMessage(errorDetails);
    }
}

export async function getReward(
    rewardId: string | mongoose.Types.ObjectId,
): Promise<Result<RewardEntity, ErrorDetails>> {
    try {
        const reward = await Reward.findById(rewardId).lean();
        if (!reward) return err(ErrorType.RewardNotFound);
        return ok(toRewardEntity(reward));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getRewards(): Promise<Result<RewardEntity[], ErrorDetails>> {
    try {
        const rewards = await Reward.find().lean();
        if (!rewards) return err(ErrorType.RewardNotFound);
        return ok(rewards.map(toRewardEntity));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getRewardsByPersonId(
    personId: string | mongoose.Types.ObjectId,
): Promise<Result<RewardEntity[], ErrorDetails>> {
    try {
        const transactions = await Transaction.find({ personId, rewardId: { $ne: null } })
            .select("rewardId")
            .lean();
        const rewardIds = [...new Set(transactions.map(t => String(t.rewardId)))];
        if (rewardIds.length === 0) return ok([]);
        const rewards = await Reward.find({ _id: { $in: rewardIds } }).lean();
        return ok(rewards.map(toRewardEntity));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function deleteRewardsByPerson(personId: string | mongoose.Types.ObjectId, session?: mongoose.ClientSession) {
    try {
        const query = Reward.deleteMany({ reciverId: personId });
        if (session) query.session(session);
        await query;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDetails: ErrorDetails = {
            type: ErrorType.DatabaseGenericError,
            details: {
                message: `Error deleting rewards: ${errorMessage}`,
            }
        };
        getErrorMessage(errorDetails);
    }
}

export async function addReward(
    rewardData: RewardInput,
): Promise<Result<RewardEntity, ErrorDetails>> {
    try {
        const reward = new Reward(rewardData);
        const saved = await reward.save();
        return ok(toRewardEntity(saved.toObject()));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function updateReward(
    rewardId: string | mongoose.Types.ObjectId,
    update: Partial<RewardEntity>,
    session?: mongoose.ClientSession
): Promise<Result<RewardEntity, ErrorDetails>> {
    try {
        const query = Reward.findOneAndUpdate(
            { _id: rewardId },
            update,
            { new: true }      // return updated document
        ).lean<RewardEntity | null>();

        if (session) query.session(session);

        const reward = await query;

        if (!reward)
            return err(ErrorType.RewardNotFound, { rewardId: rewardId.toString() });

        return ok(reward);
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function deleteReward(
    rewardId: string | mongoose.Types.ObjectId,
    session?: mongoose.ClientSession
): Promise<Result<RewardEntity, ErrorDetails>> {
    try {
        const query = Reward.findOneAndDelete({
            _id: rewardId,
        }).lean<RewardEntity | null>();

        if (session) query.session(session);

        const reward = await query;

        if (!reward)
            return err(ErrorType.RewardNotFound, { rewardId: rewardId.toString() });

        return ok(reward);
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getLeaderboardEntriesByLeaderboardId(
    leaderboardId: string | mongoose.Types.ObjectId,
    numberOfEntries: number
): Promise<Result<LeaderboardEntryEntity[], ErrorDetails>> {
    try {
        const result = await LeaderboardEntry.find({
            leaderboardId,
        })
        .sort({score: -1})
        .limit(numberOfEntries)
        .populate("personId")
        .lean<LeaderboardEntryEntity[] | null>();
        if (!result) return err(ErrorType.LeaderboardEntryNotFound);
        return ok(result);
    } catch (error) {
        return handleMongooseError(error);
    }
}


export async function getAllTaskTypes(): Promise<
    Result<ITaskType[], ErrorDetails>
> {
    try {
        const taskTypes = await TaskType.find().lean<ITaskType[]>();
        if (taskTypes.length === 0) return err(ErrorType.TaskNotFound);
        return ok(taskTypes);
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function addTaskType(input: TaskTypeInput): Promise<Result<TaskTypeEntity, ErrorDetails>> {
    try {
        const taskType = new TaskType(input);
        const saved = await taskType.save();
        // Add a new AnnualPlan with all fields 0 except taskTypeId
        await AnnualPlan.create({
          taskTypeId: saved._id,
          amount: 0,
          amountPerActivity: 0
        });
        return ok(toTaskTypeEntity(saved.toObject()));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function updateTaskType(id: string, update: Partial<TaskTypeEntity>): Promise<Result<TaskTypeEntity, ErrorDetails>> {
    try {
        const taskType = await TaskType.findByIdAndUpdate(id, update, { new: true }).lean<ITaskType>();
        if (!taskType) return err(ErrorType.TaskNotFound);
        return ok(toTaskTypeEntity(taskType));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function deleteTaskType(id: string): Promise<Result<TaskTypeEntity, ErrorDetails>> {
    try {
        const taskType = await TaskType.findByIdAndDelete(id).lean<ITaskType>();
        if (!taskType) return err(ErrorType.TaskNotFound);
        return ok(toTaskTypeEntity(taskType));
    } catch (error) {
        return handleMongooseError(error);
    }
}
export async function getPointsByUserId(
    personId: string,
): Promise<Result<number, ErrorDetails>> {
    try {
        const points = await Person.findById(personId).select('score').lean();
        if (!points) return err(ErrorType.UserNotFound);
        return ok(points.score);
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getGamificationParameter(): Promise<Result<GamificationParameterEntity, ErrorDetails>> {
    try {
        const gamificationParameter = await GamificationParameter.find().lean<GamificationParameterEntity>();
        return ok(gamificationParameter);
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function updateGamificationParameter(update: Partial<GamificationParameterEntity>): Promise<Result<GamificationParameterEntity, ErrorDetails>> {
    try {
        const query = GamificationParameter.findOneAndUpdate(
            {}, // empty filter to update any existing document
            update,
            { new: true }
        ).lean<GamificationParameterEntity>();

        const gamificationParameter = await query;

        if (!gamificationParameter)
            return err(ErrorType.GamificationParameterNotFound);

        return ok(gamificationParameter);
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getAnnualPlans(): Promise<Result<AnnualPlanEntity[], ErrorDetails>> {
  try {
    const annualPlans = await AnnualPlan.find()
      .populate<{ taskTypeId: ITaskType | null }>('taskTypeId')
      .lean();
    
    // Filter out annual plans where the TaskType was deleted (populated taskTypeId is null)
    const validAnnualPlans = (annualPlans as any[])
      .filter((plan) => plan.taskTypeId !== null && plan.taskTypeId !== undefined)
      .map(toAnnualPlanEntity);
    
    return ok(validAnnualPlans);
  } catch (error) {
    return handleMongooseError(error);
  }
}

export async function updateAnnualPlan(updateId: string, update: Partial<AnnualPlanEntity>): Promise<Result<AnnualPlanEntity, ErrorDetails>> {
  try {
    const allowedUpdate: Partial<AnnualPlanEntity> = {};
    if (typeof update.amount !== 'undefined') allowedUpdate.amount = update.amount;
    if (typeof update.amountPerActivity !== 'undefined') allowedUpdate.amountPerActivity = update.amountPerActivity;
    const query = AnnualPlan.findByIdAndUpdate(
      updateId,
      allowedUpdate,
      { new: true }
    ).lean<AnnualPlanEntity>();
    const annualPlan = await query;
    if (!annualPlan) return err(ErrorType.AnnualPlanNotFound);
    return ok(annualPlan);
  } catch (error) {
    return handleMongooseError(error);
  }
}

