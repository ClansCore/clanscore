import { RoleDTO } from "@clanscore/shared";
import type { IRole } from "../../../../domain/user/Role";
import { toId } from "../core";

export type RoleEntity = {
    _id: string;
    name: string;
    discordColor?: string | null;
    discordPosition: number;
    discordPermissions?: string | null;
    hoist?: boolean;
    mentionable?: boolean;
};

export const toRoleEntity = (doc: IRole): RoleEntity => ({
    _id: toId(doc),
    name: doc.name,
    discordColor: doc.discordColor ?? null,
    discordPosition: Number(doc.discordPosition),
    discordPermissions: doc.discordPermissions ?? null,
    hoist: !!doc.hoist,
    mentionable: !!doc.mentionable,
});

export const toRoleDTO = (role: RoleEntity): RoleDTO => ({
    id: role._id,
    name: role.name,
    discordColor: role.discordColor ?? null,
    discordPosition: role.discordPosition ?? 0,
    discordPermissions: role.discordPermissions ?? null,
    hoist: role.hoist ?? false,
    mentionable: role.mentionable ?? false,
});
