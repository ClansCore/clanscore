import { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { sendError } from "../middleware/error.middleware";
import { fromPersonDTOtoPersonEntity, toPersonDTO, toPersonSummaryDTO } from "../../infrastructure/database/mappers/user/person.mapper";
import { Person } from "../../domain/user/Person";
import { toJoinDataTempDTO } from "../../infrastructure/database/mappers/user/joinDataTemp.mapper";
import { ErrorType, PersonDataDTO, DiscordMemberInput, SyncUsersResponseDTO, UserStatusChange, PersonDTO } from "@clanscore/shared";
import { toUserRoleDTO, toUserRoleWithRoleDTO } from "../../infrastructure/database/mappers/user/userRole.mapper";
import { toDonationDTO, toLeaderboardEntryDTO, toRewardDTO, toTaskParticipantDTO, toTransactionDTO } from "../../infrastructure/database/mappers/gamification/personData.mapper";
import type { DonationEntity } from "../../infrastructure/database/mappers/gamification/donation.mapper";
import type { LeaderboardEntryEntity } from "../../infrastructure/database/mappers/gamification/leaderboardEntry.mapper";
import { toTransactionEntity, type TransactionEntity } from "../../infrastructure/database/mappers/gamification/transaction.mapper";
import { handleAcceptApplication, handleDenyApplication } from "../../application/user/user.service";
import { UserModel } from "../../application/user/user.model";
import { GamificationModel } from "../../application/gamification/gamification.model";
import { notificationService } from "../../application/notifications";
import { getChangedByFromRequest } from "../../infrastructure/security/jwt";

// Ping

export async function getFirstUser(req: Request, res: Response) {
    const r = await UserModel.getFirstUser();
    if (!r.ok) return sendError(res, r.error);
    return res.json(toPersonDTO(r.value));
}

// Join

export async function getJoinTempDataByDiscordId(req: Request, res: Response) {
    const r = await UserModel.getJoinTempDataByDiscordId(req.params.discordId);
    if (!r.ok) return sendError(res, r.error);
    return res.json(r.value.map(toJoinDataTempDTO));
}

export async function updateJoinTempData(req: Request, res: Response) {
    try {
        const { discordId } = req.params;
        const { step1Data } = req.body;
        if (!step1Data) {
            return sendError(res, {
                type: ErrorType.ValidationError,
                details: { message: "Missing step1Data in body" }
            });
        }
        const r = await UserModel.updateJoinTempData(discordId, step1Data);
        if (!r.ok) return sendError(res, r.error);
        return res.json(r.value.map(toJoinDataTempDTO));
    } catch (err) {
        return sendError(res, {
            type: ErrorType.UnknownError,
            details: { message: err instanceof Error ? err.message : String(err) }
        });
    }
}

export async function deleteJoinTempData(req: Request, res: Response) {
    const { discordId } = req.params;
    const r = await UserModel.deleteJoinTempData(discordId);
    if (!r.ok) return sendError(res, r.error);
    return res.json({ ok: true });
}

export async function acceptApplication(req: Request, res: Response) {
    const { personId } = req.params;
    const { roleId, reviewerId } = req.body;

    if (!roleId) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Missing roleId" },
        });
    }

    const personResult = await UserModel.getPerson(personId);
    if (!personResult.ok) return sendError(res, personResult.error);

    const roleResult = await UserModel.getRoleById(roleId);
    if (!roleResult.ok) return sendError(res, roleResult.error);

    const result = await handleAcceptApplication(
        personResult.value,
        roleResult.value.name
    );
    if (!result.ok) return sendError(res, result.error);

    return res.json({
        person: toPersonDTO(result.value),
        assignedRole: roleId,
        reviewerId: reviewerId
    });
}

export async function denyApplication(req: Request, res: Response) {
    const { personId } = req.params;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { reviewerId, guildId } = req.body;

    const personResult = await UserModel.getPerson(personId);
    if (!personResult.ok) return sendError(res, personResult.error);

    const result = await handleDenyApplication(
        personResult.value
    );
    if (!result.ok) return sendError(res, result.error);

    return res.json(toPersonDTO(result.value));
}

export async function isApplicationPending(req: Request, res: Response) {
    const r = await UserModel.getPerson(req.params.personId);
    if (!r.ok) return sendError(res, r.error);

    const pending = r.value.status === "Pending";
    return res.json({ pending });
}

export async function updatePersonApplicationMessageId(req: Request, res: Response) {
    const { applicationMessageId } = req.body as { applicationMessageId: string };
    const r = await UserModel.updatePersonApplicationMessageId(req.params.personId, applicationMessageId ?? "");
    if (!r.ok) return sendError(res, r.error);
    return res.json(toPersonDTO(r.value));
}

export async function resetApplication(req: Request, res: Response) {
    const r = await UserModel.updatePersonStatus(req.params.personId, "Pending");
    if (!r.ok) return sendError(res, r.error);
    return res.json({ ok: true });
}

// User

export async function savePerson(req: Request, res: Response) {
    try {
        const person = req.body?.person;
        if (!person) {
            return sendError(res, {
                type: ErrorType.ValidationError,
                details: { message: "Missing person object in body" }
            });
        }
        const roleIds = (person as any).roles || [];
        const r = await UserModel.savePerson(person);
        if (!r.ok) return sendError(res, r.error);
        
        // Sync roles
        const currentUserRolesResult = await UserModel.getUserRolesByUserId(r.value._id);
        const currentUserRoles = currentUserRolesResult.ok ? currentUserRolesResult.value : [];
        const currentRoleIds = new Set(currentUserRoles.map(ur => ur.role._id?.toString()));
        const newRoleIds = new Set(roleIds.map((id: string) => id.toString()));
        
        // Add new roles
        for (const roleId of roleIds) {
            if (!currentRoleIds.has(roleId.toString())) {
                await UserModel.addUserRole(r.value._id, roleId);
            }
        }
        
        // Remove roles that are no longer assigned
        for (const userRole of currentUserRoles) {
            if (userRole.role._id && !newRoleIds.has(userRole.role._id.toString())) {
                await UserModel.removeUserRole(r.value._id, userRole.role._id);
            }
        }
        
        // Return person with roles like getAllUsers does
        const rolesResult = await UserModel.getUserRolesByUserId(r.value._id);
        const finalRoleIds = rolesResult.ok
            ? rolesResult.value.map(ur => ur.role._id)
            : [];
        return res.json({ ...toPersonDTO(r.value), roles: finalRoleIds });
    } catch (err) {
        return sendError(res, {
            type: ErrorType.UnknownError,
            details: { message: err instanceof Error ? err.message : String(err) }
        });
    }
}

export async function updatePerson(req: Request, res: Response) {
    try {
        const person = req.body?.person as PersonDTO & { roles?: string[] };
        if (!person) {
            return sendError(res, {
                type: ErrorType.ValidationError,
                details: { message: "Missing person object in body" }
            });
        }
        if (!person.id) {
            return sendError(res, {
                type: ErrorType.ValidationError,
                details: { message: "Missing person._id in body" }
            });
        }
        const roleIds = person.roles || [];
        const updatedPerson = await UserModel.updatePerson(person.id, fromPersonDTOtoPersonEntity(person));
        if (!updatedPerson.ok) return sendError(res, updatedPerson.error);
        
        // Sync roles
        const currentUserRolesResult = await UserModel.getUserRolesByUserId(updatedPerson.value._id);
        const currentUserRoles = currentUserRolesResult.ok ? currentUserRolesResult.value : [];
        const currentRoleIds = new Set(currentUserRoles.map(ur => ur.role._id?.toString()));
        const newRoleIds = new Set(roleIds.map(id => id.toString()));
        
        // Add new roles
        for (const roleId of roleIds) {
            if (!currentRoleIds.has(roleId.toString())) {
                await UserModel.addUserRole(updatedPerson.value._id, roleId);
            }
        }
        
        // Remove roles that are no longer assigned
        for (const userRole of currentUserRoles) {
            if (userRole.role._id && !newRoleIds.has(userRole.role._id.toString())) {
                await UserModel.removeUserRole(updatedPerson.value._id, userRole.role._id);
            }
        }
        
        // Return person with roles like getAllUsers does
        const rolesResult = await UserModel.getUserRolesByUserId(updatedPerson.value._id);
        const finalRoleIds = rolesResult.ok
            ? rolesResult.value.map(ur => ur.role._id)
            : [];
        return res.json({ ...toPersonDTO(updatedPerson.value), roles: finalRoleIds });
    } catch (err) {
        return sendError(res, {
            type: ErrorType.UnknownError,
            details: { message: err instanceof Error ? err.message : String(err) }
        });
    }
}

export async function getPersonById(req: Request, res: Response) {
    const r = await UserModel.getPerson(req.params.personId);
    if (!r.ok) return sendError(res, r.error);
    return res.json(toPersonDTO(r.value));
}

export async function getAllPersons(req: Request, res: Response) {
    const r = await UserModel.getAllPersons();
    if (!r.ok) return sendError(res, r.error);
    return res.json(r.value.map(toPersonDTO));
}

export async function getAllUsers(req: Request, res: Response) {
    const r = await UserModel.getAllPersons();
    if (!r.ok) return sendError(res, r.error);
    const persons = r.value;
    const personsWithRoles = await Promise.all(
        persons.map(async (person) => {
            const rolesResult = await UserModel.getUserRolesByUserId(person._id);
            const roleIds = rolesResult.ok
                ? rolesResult.value.map(ur => ur.role._id)
                : [];
            return { person, roles: roleIds };
        })
    );
    return res.json(personsWithRoles.map(({ person, roles }) => ({ ...toPersonDTO(person), roles })));
}

export async function getPersonByDiscordId(req: Request, res: Response) {
    const r = await UserModel.getPersonByDiscordId(req.params.discordId);
    if (!r.ok) return sendError(res, r.error);
    return res.json(toPersonDTO(r.value));
}

export async function incrementPersonPoints(req: Request, res: Response) {
    const { personId } = req.params;
    const { amount } = req.body;

    if (amount === undefined || amount === null || typeof amount !== "number") {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Missing or invalid amount in body" },
        });
    }

    const result = await GamificationModel.incrementPersonPoints(personId, amount);
    if (!result.ok) return sendError(res, result.error);
    return res.json({ ok: true });
}

export async function decrementPersonPoints(req: Request, res: Response) {
    const { personId } = req.params;
    const { amount } = req.body;

    if (!amount || typeof amount !== "number") {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Missing or invalid amount in body" },
        });
    }

    const result = await GamificationModel.decrementPersonPoints(personId, amount);
    if (!result.ok) return sendError(res, result.error);
    return res.json({ ok: true });
}

export async function getPersonsByRoleName(req: Request, res: Response) {
    const { roleName } = req.params;
    const roleResult = await UserModel.getRoleByName(roleName);
    if (!roleResult.ok) return sendError(res, roleResult.error);

    const personsResult = await UserModel.getPersonsByRole(roleResult.value._id);
    if (!personsResult.ok) return sendError(res, personsResult.error);

    return res.json(personsResult.value.map(toPersonSummaryDTO));
}

export async function getPersonDataByDiscordId(req: Request, res: Response) {
    const { discordId } = req.params;
    const personResult = await UserModel.getPersonByDiscordId(discordId);
    if (!personResult.ok) return sendError(res, personResult.error);

    const person = personResult.value;
    const personId = person._id;

    const [
        rolesResult,
        tasksResult,
        donationsResult,
        rewardsResult,
        leaderboardEntriesResult,
        transactionsResult,
    ] = await Promise.all([
        UserModel.getUserRolesByUserId(personId),
        GamificationModel.getTaskParticipantsByPerson(personId),
        GamificationModel.getDonationsByPersonId(personId),
        GamificationModel.getRewardsByPersonId(personId),
        GamificationModel.getLeaderboardEntriesByPersonId(personId),
        GamificationModel.getTransactionsByPersonId(personId),
    ]);

    if (!rolesResult.ok) return sendError(res, rolesResult.error);
    if (!tasksResult.ok) return sendError(res, tasksResult.error);
    if (!rewardsResult.ok) return sendError(res, rewardsResult.error);

    let donations: DonationEntity[] = [];
    if (donationsResult.ok) {
        donations = donationsResult.value;
    } else if (donationsResult.error.type !== ErrorType.NotFound) {
        return sendError(res, donationsResult.error);
    }

    let leaderboardEntries: LeaderboardEntryEntity[] = [];
    if (leaderboardEntriesResult.ok) {
        leaderboardEntries = leaderboardEntriesResult.value;
    } else if (leaderboardEntriesResult.error.type !== ErrorType.LeaderboardEntryNotFound) {
        return sendError(res, leaderboardEntriesResult.error);
    }

    let transactions: TransactionEntity[] = [];
    if (transactionsResult.ok) {
        transactions = transactionsResult.value;
    } else if (transactionsResult.error.type !== ErrorType.TransactionNotFound) {
        return sendError(res, transactionsResult.error);
    }

    const payload: PersonDataDTO = {
        person: toPersonDTO(person),
        roles: rolesResult.value.map(toUserRoleWithRoleDTO),
        tasks: tasksResult.value.map(toTaskParticipantDTO),
        donations: donations.map(toDonationDTO),
        rewards: rewardsResult.value.map(toRewardDTO),
        leaderboardEntries: leaderboardEntries.map(toLeaderboardEntryDTO),
        transactions: transactions.map(toTransactionDTO),
    };

    return res.json(payload);
}

export async function updatePersonStatusAndDeletion(req: Request, res: Response) {
    const { personId } = req.params;
    const { status, deletionDateIso } = req.body;

    if (!status) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "status missing" }
        });
    }

    const r = await UserModel.updatePersonStatusAndDeletionDate(
        personId,
        status,
        deletionDateIso ? new Date(deletionDateIso) : new Date()
    );

    if (!r.ok) return sendError(res, r.error);
    return res.json(toPersonDTO(r.value));
}

export async function deletePerson(req: Request, res: Response) {
    const r = await UserModel.removePerson(req.params.personId);
    if (!r.ok) return sendError(res, r.error);
    return res.json(toPersonDTO(r.value));
}

// Roles

export async function addUserRole(req: Request, res: Response) {
    const { personId } = req.params;
    const { roleId } = req.body;
    if (!roleId) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Missing roleId in body" },
        });
    }
    const r = await UserModel.addUserRole(personId, roleId);
    if (!r.ok) return sendError(res, r.error);

    const [personResult, roleResult] = await Promise.all([
        UserModel.getPerson(personId),
        UserModel.getRoleById(roleId),
    ]);

    if (personResult.ok && roleResult.ok && personResult.value.discordId) {
        await notificationService.notifyRoleChanged({
            userId: personId,
            platformUserId: personResult.value.discordId,
            username: personResult.value.nickname ?? personResult.value.discordId,
            addedRoles: [roleResult.value.name],
            removedRoles: [],
            changedBy: getChangedByFromRequest(req),
        });
    }

    return res.json(toUserRoleDTO(r.value));
}

export async function removeUserRole(req: Request, res: Response) {
    const { personId, roleId } = req.params;

    if (!roleId) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Missing roleId in params" },
        });
    }

    const [personResult, roleResult] = await Promise.all([
        UserModel.getPerson(personId),
        UserModel.getRoleById(roleId),
    ]);

    const r = await UserModel.removeUserRole(personId, roleId);
    if (!r.ok) return sendError(res, r.error);

    if (personResult.ok && roleResult.ok && personResult.value.discordId) {
        await notificationService.notifyRoleChanged({
            userId: personId,
            platformUserId: personResult.value.discordId,
            username: personResult.value.nickname ?? personResult.value.discordId,
            addedRoles: [],
            removedRoles: [roleResult.value.name],
            changedBy: getChangedByFromRequest(req),
        });
    }

    return res.json({ ok: true });
}

export async function getUserRolesByUserId(req: Request, res: Response) {
    const r = await UserModel.getUserRolesByUserId(req.params.personId);
    if (!r.ok) return sendError(res, r.error);
    return res.json(r.value.map(toUserRoleWithRoleDTO));
}

export async function updatePersonRoleStatus(req: Request, res: Response) {
    const { personId } = req.params;
    const { roleId, status } = req.body;

    if (!roleId || !status) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "roleId or status missing" }
        });
    }

    const r = await UserModel.updatePersonRoleAndStatus(personId, roleId, status);
    if (!r.ok) return sendError(res, r.error);

    return res.json(toPersonDTO(r.value));
}

export async function getPointsByUserId(req: Request, res: Response) {
    const { personId } = req.params;
    if (!mongoose.isValidObjectId(personId)) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Invalid personId" },
        });
    }
    const r = await GamificationModel.getPointsByUserId(personId);
    if (!r.ok) return sendError(res, r.error);
    return res.json(r.value);
}

export async function getPointHistory(req: Request, res: Response) {
    try {
        const { personId } = req.params;
        if (!mongoose.isValidObjectId(personId)) {
            return sendError(res, {
                type: ErrorType.ValidationError,
                details: { message: "Invalid personId" },
            });
        }
        const result = await GamificationModel.getTransactionsByPersonIdWithDetails(personId);
        if (!result.ok) {
            if (result.error.type === ErrorType.TransactionNotFound) {
                return res.json([]);
            }
            return sendError(res, result.error);
        }
        const transformed = result.value.map(tx => {
        const transactionEntity = toTransactionEntity(tx);

        let type: 'Spende' | 'Aufgabe' | 'Belohnung' = 'Aufgabe';
        let typeDetail: string = '';
        if (tx.donationId && typeof tx.donationId === 'object') {
            type = 'Spende';
            typeDetail = tx.donationId.amount.toString();
        } else if (tx.rewardId && typeof tx.rewardId === 'object') {
            type = 'Belohnung';
            typeDetail = tx.rewardId.name;
        } else if (tx.taskId && typeof tx.taskId === 'object') {
            type = 'Aufgabe';
            typeDetail = tx.taskId.name;
        }

        return {
            score: transactionEntity.amount,
            date: transactionEntity.updatedAt?.toISOString(),
            type,
            typeDetail
        };
    });
        return res.json(transformed);
    } catch (err) {
        return sendError(res, {
            type: ErrorType.UnknownError,
            details: { message: err instanceof Error ? err.message : String(err) }
        });
    }
}

export async function setUserPassword(req: Request, res: Response) {
    try {
        const { personId } = req.params;
        const { password } = req.body;

        if (!password || typeof password !== "string") {
            return sendError(res, {
                type: ErrorType.ValidationError,
                details: { message: "Missing or invalid password in body" },
            });
        }

        if (!mongoose.isValidObjectId(personId)) {
            return sendError(res, {
                type: ErrorType.ValidationError,
                details: { message: "Invalid personId" },
            });
        }

        const result = await UserModel.setUserPassword(personId, password);
        if (!result.ok) return sendError(res, result.error);
        
        return res.json({ ok: true, message: "Password set successfully" });
    } catch (err) {
        return sendError(res, {
            type: ErrorType.UnknownError,
            details: { message: err instanceof Error ? err.message : String(err) }
        });
    }
}

export async function changeOwnPassword(req: Request, res: Response) {
    try {
        // Get userId from JWT token (set by requireAuth middleware)
        const userId = req.user?.userId;
        if (!userId) {
            return sendError(res, {
                type: ErrorType.ValidationError,
                details: { message: "User ID not found in token" },
            });
        }

        const { password, currentPassword } = req.body;

        if (!password || typeof password !== "string") {
            return sendError(res, {
                type: ErrorType.ValidationError,
                details: { message: "Missing or invalid password in body" },
            });
        }

        if (!currentPassword || typeof currentPassword !== "string") {
            return sendError(res, {
                type: ErrorType.ValidationError,
                details: { message: "Missing or invalid currentPassword in body" },
            });
        }

        if (!mongoose.isValidObjectId(userId)) {
            return sendError(res, {
                type: ErrorType.ValidationError,
                details: { message: "Invalid userId" },
            });
        }

        // Verify current password before allowing change
        // Query Person directly to get webPW field
        const personResult = await UserModel.getPerson(userId);
        const person = personResult.ok ? personResult.value : null;
        if (!person) {
            return sendError(res, {
                type: ErrorType.UserNotFound,
                details: { message: "User not found" },
            });
        }

        if (!person.webPW) {
            return sendError(res, {
                type: ErrorType.UserNotManageable,
                details: { message: "No password set for this user" },
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, person.webPW);
        if (!isCurrentPasswordValid) {
            return sendError(res, {
                type: ErrorType.UserNotManageable,
                details: { message: "Current password is incorrect" },
            });
        }

        const result = await UserModel.setUserPassword(userId, password);
        if (!result.ok) return sendError(res, result.error);
        
        return res.json({ ok: true, message: "Password changed successfully" });
    } catch (err) {
        return sendError(res, {
            type: ErrorType.UnknownError,
            details: { message: err instanceof Error ? err.message : String(err) }
        });
    }
}

export async function syncUsers(req: Request, res: Response) {
    try {
        const { discordMembers } = req.body as { discordMembers: DiscordMemberInput[] };

        if (!discordMembers || !Array.isArray(discordMembers)) {
            return sendError(res, {
                type: ErrorType.ValidationError,
                details: { message: "Missing or invalid discordMembers array in body" }
            });
        }

        const [mitgliedRoleResult, vorstandRoleResult] = await Promise.all([
            UserModel.getRoleByName("Mitglied"),
            UserModel.getRoleByName("Vorstand"),
        ]);

        if (!mitgliedRoleResult.ok || !vorstandRoleResult.ok) {
            return sendError(res, {
                type: ErrorType.RoleNotFound,
                details: { message: "Mitglied or Vorstand role not found in database" }
            });
        }

        const allPersonsResult = await UserModel.getAllPersons();
        const allPersons = allPersonsResult.ok ? allPersonsResult.value : [];
        const personsByDiscordId = new Map(
            allPersons.filter(p => p.discordId).map(p => [p.discordId, p])
        );

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const discordMembersMap = new Map(
            discordMembers.map(m => [m.discordId, m])
        );

        const changes: UserStatusChange[] = [];

        for (const member of discordMembers) {
            const hasMitglied = member.roleNames.includes("Mitglied");
            const hasVorstand = member.roleNames.includes("Vorstand");

            let person = personsByDiscordId.get(member.discordId);

            if (!hasMitglied && !hasVorstand) {
                if (person && person.status !== "ToBeDeleted") {
                    const deletionDate = new Date();
                    deletionDate.setMonth(deletionDate.getMonth() + 3);

                    await UserModel.updatePersonStatusAndDeletionDate(
                        person._id,
                        "ToBeDeleted",
                        deletionDate
                    );

                    changes.push({
                        discordId: member.discordId,
                        username: member.username,
                        changeType: "marked_for_deletion",
                        details: `Status von "Accepted" auf "ToBeDeleted" gesetzt. Löschung am ${deletionDate.toLocaleDateString("de-CH")}.`
                    });
                }
                continue;
            }

            if (!person) {
                const createResult = await UserModel.findOrCreatePersonByDiscordId(
                    member.discordId,
                    member.username
                );
                if (createResult.ok) {
                    person = createResult.value;
                    changes.push({
                        discordId: member.discordId,
                        username: member.username,
                        changeType: "created",
                        details: "Neue Person erstellt"
                    });
                } else {
                    continue;
                }
            }

            if (person.status === "ToBeDeleted" && (hasMitglied || hasVorstand)) {
                await UserModel.updatePersonStatusAndDeletionDate(
                    person._id,
                    "Accepted",
                    new Date()
                );
                changes.push({
                    discordId: member.discordId,
                    username: member.username,
                    changeType: "reactivated",
                    details: "Status zurückgesetzt von 'ToBeDeleted' auf 'Accepted'"
                });
            }

            // Sync roles
            const matchedDbRolesResult = await UserModel.getRolesByNames(member.roleNames);
            const matchedDbRoles = matchedDbRolesResult.ok ? matchedDbRolesResult.value : [];

            const currentUserRolesResult = await UserModel.getUserRolesByUserId(person._id);
            const currentUserRoles = currentUserRolesResult.ok ? currentUserRolesResult.value : [];
            
            const currentRoleIds = new Set(currentUserRoles.map(ur => ur.role?._id?.toString()));
            const matchedRoleIds = new Set(matchedDbRoles.map(r => r._id.toString()));

            const rolesToAdd = matchedDbRoles.filter(r => !currentRoleIds.has(r._id.toString()));
            const rolesToRemove = currentUserRoles.filter(ur => 
                ur.role && !matchedRoleIds.has(ur.role._id.toString())
            );

            const roleChangeLog: string[] = [];

            for (const r of rolesToAdd) {
                await UserModel.addUserRoleIfNotExists(person._id, r._id);
                roleChangeLog.push(`+ ${r.name}`);
            }

            for (const ur of rolesToRemove) {
                await UserModel.removeUserRoleById(ur._id);
                roleChangeLog.push(`- ${ur.role?.name ?? "Unbekannt"}`);
            }

            if (roleChangeLog.length > 0) {
                changes.push({
                    discordId: member.discordId,
                    username: member.username,
                    changeType: "roles_changed",
                    details: roleChangeLog.join(" ")
                });
            }
        }

        const response: SyncUsersResponseDTO = { changes };
        return res.json(response);
    } catch (err) {
        return sendError(res, {
            type: ErrorType.UnknownError,
            details: { message: err instanceof Error ? err.message : String(err) }
        });
    }
}
