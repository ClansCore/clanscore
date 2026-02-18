import * as db from "../../infrastructure/database/user.db.service";
import { PersonInput, IJoinDataTemp, IPerson, RoleInput } from "./user.types";

export class UserModel {
    static getPersonByDiscordId(discordId: string) {
        return db.getPersonByDiscordId(discordId);
    }

    static getPersonByApplicationMessage(messageId: string) {
        return db.getPersonByApplicationMessage(messageId);
    }

    static getPerson(personId: string) {
        return db.getPerson(personId);
    }

    static getPersonFromNickname(nickname: string) {
        return db.getPersonFromNickname(nickname);
    }

    static getAllPersons() {
        return db.getAllPersons();
    }

    static getPersonsByRole(roleId: string) {
        return db.getPersonsByRole(roleId);
    }

    static updatePersonApplicationMessageId(
        personId: string,
        messageId: string,
    ) {
        return db.updatePersonApplicationMessageId(personId, messageId);
    }

    static updatePersonStatus(
        personId: string,
        status: "Pending" | "Accepted" | "ToBeDeleted",
    ) {
        return db.updatePersonStatus(personId, status);
    }

    static updatePersonStatusAndDeletionDate(
        personId: string,
        status: "Pending" | "Accepted" | "ToBeDeleted",
        deletionDate: Date,
    ) {
        return db.updatePersonStatusAndDeletionDate(
            personId,
            status,
            deletionDate,
        );
    }

    static updatePersonRoleAndStatus(
        personId: string,
        roleId: string,
        status: "Pending" | "Accepted" | "ToBeDeleted",
    ) {
        return db.updatePersonRoleAndStatus(personId, roleId, status);
    }

    static findOrCreatePersonByDiscordId(memberId: string, memberUsername: string) {
        return db.findOrCreatePersonByDiscordId(memberId, memberUsername);
    }

    static updatePersonStatusAndDeletion(
        person: IPerson,
        status: "Accepted" | "ToBeDeleted",
        deletionDate?: Date
    ) {
        return db.updatePersonStatusAndDeletion(
            person,
            status,
            deletionDate
        )
    }

    static getUserRolesByUserId(
        userId: string
    ) {
        return db.getUserRolesByUserId(userId)
    }

    static getJoinTempDataByDiscordId(discordId: string) {
        return db.getJoinTempDataByDiscordId(discordId);
    }

    static getRolesByNames(
        roleNames: string[]
    ) {
        return db.getRolesByNames(roleNames);
    }

    static addUserRoleIfNotExists(
        userId: string,
        roleId: string
    ) {
        return db.addUserRoleIfNotExists(userId, roleId);
    }

    static removeUserRoleById(
        userRoleId: string
    ) {
        return db.removeUserRoleById(userRoleId);
    }
    
    static updateJoinTempData(
        discordId: string,
        step1Data: Partial<IJoinDataTemp["step1Data"]>
    ) {
        return db.updateJoinTempData(discordId, step1Data);
    }

    static saveRole(roleData: RoleInput) {
        return db.saveRole(roleData);
    }

    static updateRole(roleId: string, roleData: RoleInput) {
        return db.updateRole(roleId, roleData);
    }

    static removeRole(roleId: string) {
        return db.removeRole(roleId);
    }

    static getUserRolesByRoleId(
        roleId: string
    ) {
        return db.getUserRolesByRoleId(roleId);
    }

    static deleteJoinTempData(discordId: string) {
        return db.deleteJoinTempData(discordId);
    }

    static savePerson(input: PersonInput) {
        return db.savePerson(input);
    }

    static updatePerson(personId: string, personData: PersonInput) {
        return db.updatePerson(personId, personData);
    }

    static removePerson(personId: string) {
        return db.removePerson(personId);
    }

    static getRoleByName(roleName: string) {
        return db.getRoleByName(roleName);
    }

    static getRoleById(roleId: string) {
        return db.getRoleById(roleId);
    }

    static getAllRoles() {
        return db.getAllRoles();
    }

    static addUserRole(
        userId: string,
        roleId: string,
    ) {
        return db.addUserRole(userId, roleId);
    }

    static removeUserRole(
        userId: string,
        roleId: string,
    ) {
        return db.removeUserRole(userId, roleId);
    }

    static getUserRoles(userId: string) {
        return db.getUserRoles(userId);
    }

    static getFirstUser() {
        return db.getFirstUser();
    }

    static setUserPassword(personId: string, password: string) {
        return db.setUserPassword(personId, password);
    }
}
