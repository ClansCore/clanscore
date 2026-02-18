import mongoose from "mongoose";
import { handleMongooseError } from "../errors/mongooseAdapter";
import {
    ErrorType,
    ErrorDetails,
    ok,
    Result,
    err,
} from "@clanscore/shared";
import { IPerson, Person, PersonInput } from "../../domain/user/Person";
import { IRole, Role, RoleInput } from "../../domain/user/Role";
import {
    IUserRolePopulated,
    UserRole,
} from "../../domain/user/UserRole";
import { IJoinDataTemp, JoinDataTemp } from "../../domain/user/JoinDataTemp";
import { PersonEntity, toPersonEntity } from "./mappers/user/person.mapper";
import { RoleEntity, toRoleEntity } from "./mappers/user/role.mapper";
import { toUserRoleEntity, toUserRoleWithRoleEntity, UserRoleEntity, UserRoleWithRoleEntity } from "./mappers/user/userRole.mapper";
import { JoinDataTempEntity, toJoinDataTempEntity } from "./mappers/user/joinDataTemp.mapper";
import bcrypt from 'bcrypt';
export const getFirstUser = async (): Promise<
    Result<PersonEntity, ErrorDetails>
> => {
    try {
        const firstUser = await Person.findOne()
            .sort({ _id: 1 })
            .lean<IPerson | null>();
        if (!firstUser) return err(ErrorType.UserNotFound);
        return ok(toPersonEntity(firstUser));
    } catch (error) {
        return handleMongooseError(error);
    }
};

export async function getPersonFromDiscordId(
    discordId: string,
): Promise<Result<PersonEntity, ErrorDetails>> {
    try {
        const person = await Person.findOne({
            discordId,
        }).lean<IPerson | null>();
        if (!person) return err(ErrorType.UserNotFound, { discordId: discordId });
        return ok(toPersonEntity(person));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getPersonFromNickname(
    nickname: string,
): Promise<Result<PersonEntity, ErrorDetails>> {
    try {
        const person = await Person.findOne({
            nickname,
        }).lean<IPerson | null>();
        if (!person) return err(ErrorType.UserNotFound, { nickname: nickname });
        return ok(toPersonEntity(person));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getAllPersons(): Promise<
    Result<PersonEntity[], ErrorDetails>
> {
    try {
        const person = await Person.find().lean<IPerson[]>();
        if (person.length === 0) return err(ErrorType.UserNotFound);
        return ok(person.map(toPersonEntity));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function savePerson(
    personData: PersonInput,
): Promise<Result<PersonEntity, ErrorDetails>> {
    try {
        const saved = await new Person(personData).save();
        return ok(toPersonEntity((saved).toObject()));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getPerson(
    personId: string | mongoose.Types.ObjectId,
): Promise<Result<PersonEntity, ErrorDetails>> {
    try {
        const person = await Person.findById(personId).lean<IPerson | null>();
        if (!person) return err(ErrorType.UserNotFound, { userId: personId.toString() });
        return ok(toPersonEntity(person));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function removePerson(
    personId: string | mongoose.Types.ObjectId, session?: mongoose.ClientSession
): Promise<Result<PersonEntity, ErrorDetails>> {
    try {
        const query = Person.findOneAndDelete({
            _id: personId,
        }).lean<IPerson | null>();
        if (session) query.session(session);
        const person = await query;

        if (!person) return err(ErrorType.UserNotFound, { userId: personId.toString() });
        return ok(toPersonEntity(person));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getPersonByDiscordId(
    discordId: string,
): Promise<Result<PersonEntity, ErrorDetails>> {
    try {
        const person = await Person.findOne({
            discordId,
        }).lean<IPerson | null>();
        if (!person) return err(ErrorType.UserNotFound, { discordId: discordId });
        return ok(toPersonEntity(person));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getPersonByApplicationMessage(
    targetMessageId: string,
): Promise<Result<PersonEntity, ErrorDetails>> {
    try {
        const person = await Person.findOne({
            applicationMessageId: targetMessageId,
        }).lean<IPerson | null>();
        if (!person) return err(ErrorType.UserNotFound);
        return ok(toPersonEntity(person));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function updatePersonApplicationMessageId(
    personId: string | mongoose.Types.ObjectId,
    applicationMessageId: string,
): Promise<Result<PersonEntity, ErrorDetails>> {
    try {
        const updatedPerson = await Person.findByIdAndUpdate(
            personId,
            { $set: { applicationMessageId: applicationMessageId } },
            { new: true, lean: true }
        );
        if (!updatedPerson) return err(ErrorType.UserNotFound);
        return ok(toPersonEntity(updatedPerson));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function updatePersonStatus(
    personId: string | mongoose.Types.ObjectId,
    status: "Pending" | "Accepted" | "ToBeDeleted",
): Promise<Result<PersonEntity, ErrorDetails>> {
    try {
        const updatedPerson = await Person.findByIdAndUpdate(
            personId,
            { $set: { status } },
            { new: true, lean: true }
        );
        if (!updatedPerson) return err(ErrorType.UserNotFound);
        return ok(toPersonEntity(updatedPerson));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function updatePerson(
    personId: string | mongoose.Types.ObjectId,
    personData: PersonInput,
): Promise<Result<PersonEntity, ErrorDetails>> {
    try {
        const updatedPerson = await Person.findByIdAndUpdate(
            personId,
            personData
        );
        if (!updatedPerson) return err(ErrorType.UserNotFound);
        return ok(toPersonEntity(updatedPerson));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function updatePersonStatusAndDeletionDate(
    personId: string | mongoose.Types.ObjectId,
    status: "Pending" | "Accepted" | "ToBeDeleted",
    deletionDate: Date,
): Promise<Result<PersonEntity, ErrorDetails>> {
    try {
        const updatedPerson = await Person.findByIdAndUpdate(
            personId,
            { $set: { status, deletionDate } },
            { new: true, lean: true }
        );
        if (!updatedPerson) return err(ErrorType.UserNotFound);
        return ok(toPersonEntity(updatedPerson));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getPersonsByRole(
    role: string | mongoose.Types.ObjectId,
): Promise<Result<PersonEntity[], ErrorDetails>> {
    try {
        if (mongoose.connection.readyState !== 1) {
            return err(ErrorType.DatabaseConnectionError, {
                message: "Database connection not ready",
            });
        }

        const userRoles = await UserRole.find({ roleId: role })
            .populate<{ userId: IPerson }>("userId")
            .lean<IUserRolePopulated[]>();

        const persons = userRoles
            .map((ur) => ur.userId)
            .filter((person): person is IPerson => person != null);

        return ok(persons.map(toPersonEntity));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function updatePersonRoleAndStatus(
    personId: string | mongoose.Types.ObjectId,
    roleId: string | mongoose.Types.ObjectId,
    status: "Pending" | "Accepted" | "ToBeDeleted",
): Promise<Result<PersonEntity, ErrorDetails>> {
    try {
        const updatedPerson = await Person.findByIdAndUpdate(
            personId,
            { $set: { status } },
            { new: true, lean: true },
        );
        if (!updatedPerson) return err(ErrorType.UserNotFound);
        const existing = await UserRole.findOne({ userId: personId, roleId }).lean();
        if (!existing) await UserRole.create({ userId: personId, roleId });
        return ok(toPersonEntity(updatedPerson));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function findOrCreatePersonByDiscordId(
    memberId: string,
    memberUsername: string | null
): Promise<Result<PersonEntity, ErrorDetails>> {
    try {
        let person = await Person.findOne({ discordId: memberId }).lean<IPerson | null>();
        if (!person) {
            const personInput: PersonInput = {
                firstName: "Vorname_" + memberUsername,
                lastName: "Nachname_" + memberUsername,
                nickname: memberUsername,
                birthdate: new Date(2000, 0, 1),
                address: "Unbekannt",
                discordId: memberId,
                notes: "Erstellt durch Bot nach Discord-Sync",
                status: "Accepted",
                hasPaid: true,
                score: 0,
            };
            const newPerson = await Person.create(personInput);
            person = newPerson.toObject();
        }
        return ok(toPersonEntity(person));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function updatePersonStatusAndDeletion(
    person: IPerson,
    status: "Accepted" | "ToBeDeleted",
    deletionDate?: Date
): Promise<Result<PersonEntity, ErrorDetails>> {
    try {
        const updated = await Person.findByIdAndUpdate(
            person._id,
            {
                status,
                deletionDate: status === "ToBeDeleted" ? (deletionDate || null) : null,
            },
            { new: true, lean: true },
        );
        if (!updated) return err(ErrorType.UserNotFound);
        return ok(toPersonEntity(updated));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getUserRolesByUserId(
    userId: string | mongoose.Types.ObjectId
): Promise<Result<UserRoleWithRoleEntity[], ErrorDetails>> {
    try {
        const rows = await UserRole.find({ userId })
            .populate("roleId")
            .populate("userId")
            .lean();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = rows.map(r => toUserRoleWithRoleEntity(r as any));
        return ok(mapped);
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getRolesByNames(
    roleNames: string[]
): Promise<Result<RoleEntity[], ErrorDetails>> {
    try {
        const roles = await Role.find({ name: { $in: roleNames } }).lean<IRole[]>();
        return ok(roles.map(toRoleEntity));
    } catch (error) {
        return handleMongooseError(error);
    }
}

// für Synch
export async function addUserRoleIfNotExists(
    userId: string | mongoose.Types.ObjectId,
    roleId: string | mongoose.Types.ObjectId
): Promise<Result<null, ErrorDetails>> {
    try {
        const existing = await UserRole.findOne({ userId, roleId });
        if (!existing) {
            await UserRole.create({ userId, roleId });
        }
        return ok(null);
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function removeUserRoleById(
    userRoleId: string | mongoose.Types.ObjectId
): Promise<Result<null, ErrorDetails>> {
    try {
        await UserRole.deleteOne({ _id: userRoleId });
        return ok(null);
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function saveRole(
    roleData: RoleInput,
): Promise<Result<RoleEntity, ErrorDetails>> {
    try {
        const saved = await new Role(roleData).save();
        return ok(toRoleEntity(saved.toObject()));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function updateRole(
    roleId: string | mongoose.Types.ObjectId,
    roleData: RoleInput,
): Promise<Result<RoleEntity, ErrorDetails>> {
    try {
        const updatedRole = await Role.findByIdAndUpdate(
            roleId,
            roleData,
            { new: true, lean: true },
        );
        if (!updatedRole) return err(ErrorType.RoleNotFound, { roleId: roleId?.toString() });
        return ok(toRoleEntity(updatedRole));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function removeRole(
    roleId: string | mongoose.Types.ObjectId,
): Promise<Result<RoleEntity, ErrorDetails>> {
    try {
            const query = Role.findOneAndDelete({
                _id: roleId,
            }).lean<IRole | null>();
            const role = await query;
    
            if (!role) return err(ErrorType.RoleNotFound, { roleId: roleId.toString() });
    
            return ok(toRoleEntity(role));
        } catch (error) {
            return handleMongooseError(error);
        }    
}

export async function getUserRolesByRoleId(
  roleId: string | mongoose.Types.ObjectId,
): Promise<Result<UserRoleWithRoleEntity[], ErrorDetails>> {
    try {
        const userRoles = await UserRole.find({ roleId })
            .populate("userId")
            .populate("roleId")
            .lean();
            
        const validUserRoles = userRoles.filter(
            (ur) => ur.roleId != null && ur.userId != null
        );
        const mapped = validUserRoles.map((ur) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            toUserRoleWithRoleEntity(ur as any)
        );
        return ok(mapped);
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getJoinTempDataByDiscordId(
    discordId: string,
): Promise<Result<JoinDataTempEntity[], ErrorDetails>> {
    try {
        const joinData = await JoinDataTemp
            .find({ discordId })
            .lean<IJoinDataTemp[]>();
        if (!joinData || joinData.length === 0) {
            return err(ErrorType.UserNotFound, { discordId });
        }
        return ok(joinData.map(toJoinDataTempEntity));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function updateJoinTempData(
    discordId: string,
    step1Data: Partial<IJoinDataTemp["step1Data"]>
): Promise<Result<JoinDataTempEntity[], ErrorDetails>> {
    try {
        await JoinDataTemp.updateOne(
            { discordId },
            {
                $set: {
                    discordId,
                    step1Data: {
                        ...step1Data
                    }
                }
            },
            { upsert: true }
        );
        const refreshedData = await JoinDataTemp
            .find({ discordId })
            .lean<IJoinDataTemp[]>();
        return ok(refreshedData.map(toJoinDataTempEntity));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function deleteJoinTempData(
    discordId: string,
): Promise<Result<null, ErrorDetails>> {
    try {
        const result = await JoinDataTemp.deleteMany({ discordId });
        if (result.deletedCount === 0) {
            return err(ErrorType.UserNotFound, { discordId });
        }
        return ok(null);
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getRoleByName(
    roleName: string,
): Promise<Result<RoleEntity, ErrorDetails>> {
    try {
        const role = await Role.findOne({ name: roleName }).lean<IRole | null>();
        if (!role) return err(ErrorType.RoleNotFound, { roleName: roleName });
        return ok(toRoleEntity(role));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getRoleById(
    roleId: string | mongoose.Types.ObjectId,
): Promise<Result<RoleEntity, ErrorDetails>> {
    try {
        const role = await Role.findById(roleId).lean<IRole | null>();
        if (!role)
            return err(ErrorType.RoleNotFound, { roleId: roleId.toString() });
        return ok(toRoleEntity(role));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getAllRoles(): Promise<Result<RoleEntity[], ErrorDetails>> {
    try {
        const roles = await Role.find().lean<IRole[]>();
        return ok(roles.map(toRoleEntity));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function addUserRole(
    userId: string | mongoose.Types.ObjectId,
    roleId: string | mongoose.Types.ObjectId,
): Promise<Result<UserRoleEntity, ErrorDetails>> {
    try {
        const existing = await UserRole.findOne({ userId, roleId }).lean();
        if (existing) return ok(toUserRoleEntity(existing));
        const created = await UserRole.create({ userId, roleId });
        return ok(toUserRoleEntity(created.toObject()));
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function removeUserRole(
    userId: string | mongoose.Types.ObjectId,
    roleId: string | mongoose.Types.ObjectId,
): Promise<Result<null, ErrorDetails>> {
    try {
        await UserRole.deleteOne({ userId, roleId });
        return ok(null);
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function getUserRoles(
  userId: string | mongoose.Types.ObjectId,
): Promise<Result<UserRoleWithRoleEntity[], ErrorDetails>> {
    try {
        const roles = await UserRole.find({ userId })
            .populate("roleId")
            .populate("userId")
            .lean();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = roles.map((r) => toUserRoleWithRoleEntity(r as any));
        return ok(mapped);
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function checkLoginCredentials(
    email: string,
    password: string
): Promise<Result<{token: string, user: IPerson}, ErrorDetails>> {
    try {
        const person = await Person.findOne({
            email,
        }).lean<IPerson | null>();
        if (!person)
            return err(ErrorType.UserNotFound, { email: email });
        if (!person.webPW) {
            return err(ErrorType.UserNotManageable, { message: "No password set for this user" });
        }
        const isMatch = await bcrypt.compare(password, person.webPW);
        if (!isMatch) return err(ErrorType.UserNotManageable);
        return ok({token: "asdf", user: person})
    } catch (error) {
        return handleMongooseError(error);
    }
}

export async function setUserPassword(
    personId: string | mongoose.Types.ObjectId,
    password: string
): Promise<Result<PersonEntity, ErrorDetails>> {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const updatedPerson = await Person.findByIdAndUpdate(
            personId,
            { $set: { webPW: hashedPassword } },
            { new: true, lean: true }
        ).lean<IPerson | null>();
        if (!updatedPerson) return err(ErrorType.UserNotFound, { userId: personId.toString() });
        return ok(toPersonEntity(updatedPerson));
    } catch (error) {
        return handleMongooseError(error);
    }
}