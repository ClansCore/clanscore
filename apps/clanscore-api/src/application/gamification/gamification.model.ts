import * as db from "../../infrastructure/database/gamification.db.service";
import {
    TransactionInput,
    LeaderboardInput,
    ILeaderboardEntry,
    TaskInput,
    TaskParticipantInput,
    DonationInput,
    LeaderboardTransactionInput,
} from "./gamification.types";
import { incrementActiveLeaderboardEntriesPoints } from "./leaderboard.service";
import { TransactionEntity } from "../../infrastructure/database/mappers/gamification/transaction.mapper";
import { RewardInput } from "../../domain/gamification/Reward";
import { RewardEntity } from "../../infrastructure/database/mappers/gamification/reward.mapper";
import { GamificationParameterEntity } from "../../infrastructure/database/mappers/gamification/gamificationParameter.mapper";
import { TaskTypeInput } from "../../domain/gamification/TaskType";
import { TaskTypeEntity } from "../../infrastructure/database/mappers/gamification/tasktype.mapper";

export class GamificationModel {
    static getTransaction(id: string) {
        return db.getTransaction(id);
    }

    static saveTransaction(input: TransactionInput) {
        return db.saveTransaction(input);
    }

    static updateTransactionStatusByID(
        transactionId: string,
        status: "Pending" | "Done" | "Failed",
    ) {
        return db.updateTransactionStatusByID(transactionId, status);
    }

    static getTransactionsByPersonId(personId: string) {
        return db.getTransactionsByPersonId(personId);
    }

    static getTransactionsByPersonIdWithDetails(personId: string) {
        return db.getTransactionsByPersonIdWithDetails(personId);
    }

    static getTransactionByDonationId(donationId: string) {
        return db.getTransactionByDonationId(donationId);
    }

    static getCompletedPositiveTransactionsInTimeframe(
        startDate: Date,
        endDate: Date,
    ) {
        return db.getCompletedPositiveTransactionsInTimeframe(
            startDate,
            endDate,
        );
    }

    static deleteTransactionsByPerson(personId: string) {
        return db.deleteTransactionsByPerson(personId);
    }

    static getLeaderboards() {
        return db.getLeaderboards();
    }

    static getLeaderboardEntriesByLeaderboardId(leaderboardId: string, numberOfEntries: number) {
        return db.getLeaderboardEntriesByLeaderboardId(leaderboardId, numberOfEntries);
    }

    static getActiveLeaderboards() {
        return db.getActiveLeaderboards();
    }

    static saveLeaderboard(input: LeaderboardInput) {
        return db.saveLeaderboard(input);
    }

    static getLeaderboardEntriesByPersonId(personId: string) {
        return db.getLeaderboardEntriesByPersonId(personId);
    }

    static saveLeaderboardEntry(entry: ILeaderboardEntry) {
        return db.saveLeaderboardEntry(entry);
    }

    static getLeaderboardRanking(
        leaderboardId: string,
        limit: number,
    ) {
        return db.getLeaderboardRanking(leaderboardId, limit);
    }

    static incrementLeaderboardEntry(
        personId: string,
        leaderboardId: string,
        points: number,
    ) {
        return db.incrementLeaderboardEntry(personId, leaderboardId, points);
    }

    static incrementLeaderboardPoints(
        personId: string,
        points: number,
    ) {
        return db.incrementLeaderboardPoints(personId, points);
    }

    static saveLeaderboardTransaction(data: LeaderboardTransactionInput) {
        return db.saveLeaderboardTransaction(data);
    }

    static incrementActiveLeaderboardEntriesPoints(transaction: TransactionEntity) {
        return incrementActiveLeaderboardEntriesPoints(transaction);
    }

    static incrementPersonPoints(
        personId: string,
        points: number,
    ) {
        return db.incrementPersonPoints(personId, points);
    }

    static decrementPersonPoints(
        personId: string,
        points: number,
    ) {
        return db.decrementPersonPoints(personId, points);
    }

    static saveTask(input: TaskInput) {
        return db.saveTask(input);
    }

    static updateTaskResponsible(
        taskId: string,
        responsibleUserId: string,
    ) {
        return db.updateTaskResponsible(taskId, responsibleUserId);
    }

    static updateTaskEvent(
        taskId: string,
        eventId: string,
    ) {
        return db.updateTaskEvent(taskId, eventId);
    }

    static updateTaskCompleted(
        taskId: string,
        completed: boolean,
    ) {
        return db.updateTaskCompleted(taskId, completed);
    }

    static getTask(taskId: string) {
        return db.getTask(taskId);
    }

    static getExpiredTasks() {
        return db.getExpiredTasks();
    }

    static getOpenTasks() {
        return db.getOpenTasks();
    }

    static getDoneTasks() {
        return db.getDoneTasks();
    }

    static getAllTasks() {
        return db.getAllTasks();
    }

    static saveTaskParticipant(input: TaskParticipantInput) {
        return db.saveTaskParticipant(input);
    }

    static getParticipantsByTaskId(taskId: string) {
        return db.getParticipantsByTaskId(taskId);
    }

    static getTaskParticipantsByTaskId(taskId: string) {
        return db.getTaskParticipantsByTaskId(taskId);
    }

    static getTaskParticipant(id: string) {
        return db.getTaskParticipant(id);
    }

    static getTaskParticipantByPersonIdAndTaskId(
        taskId: string,
        personId: string,
    ) {
        return db.getTaskParticipantByPersonIdAndTaskId(taskId, personId);
    }

    static getTaskParticipantsByPerson(personId: string) {
        return db.getTaskParticipantsByPerson(personId);
    }

    static updateTaskParticipantCompleted(
        id: string,
        completed: boolean,
    ) {
        return db.updateTaskParticipantCompleted(id, completed);
    }

    static deleteTaskParticipantsByPerson(personId: string) {
        return db.deleteTaskParticipantsByPerson(personId);
    }

    static getRewards() {
        return db.getRewards();
    }

    static getReward(rewardId: string) {
        return db.getReward(rewardId);
    }

    static getRewardsByPersonId(personId: string) {
        return db.getRewardsByPersonId(personId);
    }

    static deleteRewardsByPerson(personId: string) {
        return db.deleteRewardsByPerson(personId);
    }

    static addReward(rewardData: RewardInput) {
        return db.addReward(rewardData);
    }

    static updateReward(rewardId: string, update: Partial<RewardEntity>) {
        return db.updateReward(rewardId, update);
    }

    static deleteReward(rewardId: string) {
        return db.deleteReward(rewardId);
    }

    static getDonation(id: string) {
        return db.getDonation(id);
    }

    static getDonationsByPersonId(personId: string) {
        return db.getDonationsByPersonId(personId);
    }

    static saveDonation(input: DonationInput) {
        return db.saveDonation(input);
    }

    static updateDonationDonor(
        donationId: string,
        donatorId: string,
    ) {
        return db.updateDonationDonor(donationId, donatorId);
    }

    static deleteDonationsByPerson(personId: string) {
        return db.deleteDonationsByPerson(personId);
    }

    static getPointsByUserId(personId: string) {
        return db.getPointsByUserId(personId);
    }

    static getGamificationparameter() {
        return db.getGamificationParameter();
    }

    static updateGamificationparameter(update: Partial<GamificationParameterEntity>) {
        return db.updateGamificationParameter(update);
    }

    static addTaskType(input: TaskTypeInput) {
        return db.addTaskType(input);
    }

    static updateTaskType(id: string, update: Partial<TaskTypeEntity>) {
        return db.updateTaskType(id, update);
    }

    static deleteTaskType(id: string) {
        return db.deleteTaskType(id);
    }
}
