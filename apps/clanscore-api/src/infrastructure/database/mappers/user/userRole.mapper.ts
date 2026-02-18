import type { IUserRole, IUserRolePopulated } from "../../../../domain/user/UserRole";
import { toId } from "../core";
import { toRoleEntity, RoleEntity, toRoleDTO } from "./role.mapper";
import type { IPerson } from "../../../../domain/user/Person";
import { UserRoleDTO, UserRoleWithRoleDTO } from "@clanscore/shared";

export type UserRoleEntity = {
    _id: string;
    userId: string;
    roleId: string;
};

export type UserRoleWithRoleEntity = {
    _id: string;
    userId: string;
    role: RoleEntity;
};

export const toUserRoleEntity = (doc: IUserRole): UserRoleEntity => ({
    _id: toId(doc),
    userId: toId(doc.userId),
    roleId: toId(doc.roleId),
});

export const toUserRoleWithRoleEntity = (
    doc: IUserRolePopulated & { userId: IPerson }
): UserRoleWithRoleEntity => ({
    _id: toId(doc),
    userId: toId(doc.userId),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    role: toRoleEntity(doc.roleId as any), 
});

export function toUserRoleDTO(entity: UserRoleEntity): UserRoleDTO {
    return {
        id: entity._id,
        userId: entity.userId,
        roleId: entity.roleId,
    };
}

export function toUserRoleWithRoleDTO(
    entity: UserRoleWithRoleEntity
): UserRoleWithRoleDTO {
    return {
        id: entity._id,
        userId: entity.userId,
        role: toRoleDTO(entity.role),
    };
}
