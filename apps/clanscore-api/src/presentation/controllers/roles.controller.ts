import { Request, Response } from "express";
import { UserModel } from "../../application/user/user.model";
import { sendError } from "../middleware/error.middleware";
import { toRoleDTO } from "../../infrastructure/database/mappers/user/role.mapper";
import { notificationService } from "../../application/notifications";
import { getChangedByFromRequest } from "../../infrastructure/security/jwt";
import { ErrorType, SyncRolesResponseDTO, DiscordRoleInput, UserRoleAssignment } from "@clanscore/shared";

export async function byName(req: Request, res: Response) {
    const r = await UserModel.getRoleByName(req.params.name);
    if (!r.ok) return sendError(res, r.error);
    return res.json(toRoleDTO(r.value));
}

export async function getAllRoles(req: Request, res: Response) {
    const r = await UserModel.getAllRoles();
    if (!r.ok) return sendError(res, r.error);
    return res.json(r.value.map(toRoleDTO));
}

export async function addRole(req: Request, res: Response) {
    try {
            const role = req.body?.role;
            if (!role) {
                return sendError(res, {
                    type: ErrorType.ValidationError,
                    details: { message: "Missing person object in body" }
                });
            }
            const r = await UserModel.saveRole(role);
            if (!r.ok) return sendError(res, r.error);
            return res.json(toRoleDTO(r.value));
        } catch (err) {
            return sendError(res, {
                type: ErrorType.UnknownError,
                details: { message: err instanceof Error ? err.message : String(err) }
            });
        }
}

export async function updateRole(req: Request, res: Response) {
    try {
        const role = req.body?.role;
        
        if (!role) {
            return sendError(res, {
                type: ErrorType.ValidationError,
                details: { message: "Missing role object in body" }
            });
        }

        const oldRoleResult = await UserModel.getRoleById(role.id);
        if (!oldRoleResult.ok) return sendError(res, oldRoleResult.error);
        const oldRole = oldRoleResult.value;

        const updatedRole = await UserModel.updateRole(role.id, role);
        if (!updatedRole.ok) return sendError(res, updatedRole.error);

        await notificationService.notifyRoleUpdated({
            roleId: role.id,
            oldName: oldRole.name,
            newName: role.name ?? oldRole.name,
            color: role.discordColor,
            permissions: role.discordPermissions,
            hoist: role.hoist,
            mentionable: role.mentionable,
            changedBy: getChangedByFromRequest(req),
        });

        return res.json(role);
    } catch (err) {
        return sendError(res, {
            type: ErrorType.UnknownError,
            details: { message: err instanceof Error ? err.message : String(err) }
        });
    }
}

export async function deleteRole(req: Request, res: Response) {
    const { roleId } = req.params;
    if (!roleId) {
        return sendError(res, {
            type: ErrorType.ValidationError,
            details: { message: "Missing roleId in params" }
        });
    }
    const r = await UserModel.removeRole(roleId);
    if (!r.ok) return sendError(res, r.error);
    return res.json(toRoleDTO(r.value));
}

export async function syncRoles(req: Request, res: Response) {
    try {
        const { discordRoles } = req.body as { discordRoles: DiscordRoleInput[] };

        if (!discordRoles || !Array.isArray(discordRoles)) {
            return sendError(res, {
                type: ErrorType.ValidationError,
                details: { message: "Missing or invalid discordRoles array in body" }
            });
        }

        const dbRolesResult = await UserModel.getAllRoles();
        if (!dbRolesResult.ok) return sendError(res, dbRolesResult.error);
        const dbRoles = dbRolesResult.value;

        const dbRolesMap = new Map(dbRoles.map(r => [r.name, r]));
        const discordRolesMap = new Map(discordRoles.map(r => [r.name, r]));

        const createdInDb: string[] = [];
        const updatedInDb: string[] = [];

        for (const [name, role] of discordRolesMap) {
            const roleData = {
                name: role.name,
                discordColor: role.discordColor,
                discordPosition: role.discordPosition,
                discordPermissions: role.discordPermissions,
                hoist: role.hoist ?? false,
                mentionable: role.mentionable ?? false,
            };

            const existing = dbRolesMap.get(name);
            if (!existing) {
                const saveResult = await UserModel.saveRole(roleData);
                if (saveResult.ok) {
                    createdInDb.push(name);
                }
            } else {
                const updateResult = await UserModel.updateRole(existing._id, roleData);
                if (updateResult.ok) {
                    updatedInDb.push(name);
                }
            }
        }

        const rolesToCreateInDiscord = dbRoles
            .filter(r => !discordRolesMap.has(r.name))
            .map(toRoleDTO);

        const userRoleAssignments: UserRoleAssignment[] = [];

        for (const role of dbRoles) {
            const usersWithRoleResult = await UserModel.getUserRolesByRoleId(role._id);
            if (!usersWithRoleResult.ok) continue;

            for (const userRole of usersWithRoleResult.value) {
                if (!userRole.userId) continue;

                const personResult = await UserModel.getPerson(userRole.userId);
                if (!personResult.ok || !personResult.value.discordId) continue;

                userRoleAssignments.push({
                    discordId: personResult.value.discordId,
                    roleName: role.name,
                });
            }
        }

        const response: SyncRolesResponseDTO = {
            createdInDb,
            updatedInDb,
            rolesToCreateInDiscord,
            userRoleAssignments,
        };

        return res.json(response);
    } catch (err) {
        return sendError(res, {
            type: ErrorType.UnknownError,
            details: { message: err instanceof Error ? err.message : String(err) }
        });
    }
}
