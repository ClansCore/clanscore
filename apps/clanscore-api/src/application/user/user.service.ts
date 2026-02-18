import {
    getRoleByName,
    removePerson,
    updatePersonStatus,
    addUserRoleIfNotExists,
} from "../../infrastructure/database/user.db.service";
import {
    deleteDonationsByPerson,
    deleteRewardsByPerson,
    deleteTaskParticipantsByPerson,
    deleteTransactionsByPerson,
} from "../../infrastructure/database/gamification.db.service";
import { Person } from "../../domain/user/Person";
import { UserRole } from "../../domain/user/UserRole";
import {
    Result,
    ErrorDetails,
    ok,
    err,
    ErrorType,
    getErrorMessage,
} from "@clanscore/shared";
import { PersonEntity } from "../../infrastructure/database/mappers/user/person.mapper";
import { notificationService } from "../notifications";
import mongoose from "mongoose";

export async function handleAcceptApplication(
    person: PersonEntity,
    roleName: string,
): Promise<Result<PersonEntity, ErrorDetails>> {
    if (!person.discordId) return err(ErrorType.UserNotFound);
    if (person.status !== "Pending" && person.status !== "ToBeDeleted") {
        return err(ErrorType.UserApplicationNotPending);
    }

    const roleResult = await getRoleByName(roleName);
    if (!roleResult.ok || !roleResult.value._id) {
        return err(ErrorType.RoleNotFound);
    }

    const updateStatusResult = await updatePersonStatus(person._id, "Accepted");
    if (!updateStatusResult.ok) return updateStatusResult;

    const roleAddResult = await addUserRoleIfNotExists(person._id, roleResult.value._id);
    if (!roleAddResult.ok) return roleAddResult;

    if (person.discordId) {
        const username = person.nickname?.trim() || `${person.firstName} ${person.lastName}`.trim() || "Unbekannt";
        await notificationService.notifyApplicationAccepted({
            userId: person._id.toString(),
            platformUserId: person.discordId,
            username,
            roleName,
        }).catch((error) => {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails: ErrorDetails = {
                type: ErrorType.NotificationFailed,
                details: {
                    message: `Bot konnte Benutzerstatus nicht senden: ${errorMessage}`,
                }
            };
            getErrorMessage(errorDetails);
        });
    }

    return ok(updateStatusResult.value);
}

export async function handleDenyApplication(
    person: PersonEntity,
): Promise<Result<PersonEntity, ErrorDetails>> {
    if (!["Pending", "ToBeDeleted"].includes(person.status ?? "")) {
        return err(ErrorType.UserApplicationNotPending);
    }

    await UserRole.deleteMany({ userId: new mongoose.Types.ObjectId(person._id) });

    let deniedPerson = person;
    if (person.status === "Pending") {
        const removed = await removePerson(person._id);
        if (!removed.ok) return removed;
        deniedPerson = removed.value;
    } else {
        const updateResult = await updatePersonStatus(person._id, "ToBeDeleted");
        if (!updateResult.ok) return updateResult;
        deniedPerson = updateResult.value;
    }

    if (person.discordId) {
        const username = person.nickname?.trim() || `${person.firstName} ${person.lastName}`.trim() || "Unbekannt";
        await notificationService.notifyApplicationDenied({
            userId: person._id.toString(),
            platformUserId: person.discordId,
            username,
        }).catch((error) => {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails: ErrorDetails = {
                type: ErrorType.NotificationFailed,
                details: {
                    message: `Bot konnte Ablehnungsnachricht nicht senden: ${errorMessage}`,
                }
            };
            getErrorMessage(errorDetails);
        });
    }

    return ok(deniedPerson);
}

export async function deleteScheduledPersons(): Promise<void> {
    const now = new Date();
    const toDelete = await Person.find({
        status: "ToBeDeleted",
        deletionDate: { $lte: now },
    });
    for (const person of toDelete) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
        await Promise.all([
            deleteTaskParticipantsByPerson(person._id, session),
            deleteTransactionsByPerson(person._id, session),
            deleteDonationsByPerson(person._id, session),
            deleteRewardsByPerson(person._id, session),
            removePerson(person._id.toString(), session),
        ]);
        await session.commitTransaction();
        }
        catch (error){
            await session.abortTransaction();
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails: ErrorDetails = {
                type: ErrorType.DatabaseGenericError,
                details: {
                    message: `Failed to delete ${person.nickname || person.firstName}: ${errorMessage}`,
                }
            };
            getErrorMessage(errorDetails);
        }
        finally{
            session.endSession();
        }
    }
}
