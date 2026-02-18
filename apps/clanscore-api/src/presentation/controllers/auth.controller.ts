import { Request, Response } from "express";
import * as Users from "../../infrastructure/database/user.db.service";
import { toRoleDTO } from "../../infrastructure/database/mappers/user/role.mapper";
import { toPersonDTO, toPersonEntity } from "../../infrastructure/database/mappers/user/person.mapper";
import { sendError } from "../middleware/error.middleware";
import { ErrorType } from "@clanscore/shared";
import { UserModel } from "../../application/user/user.model";
import { signToken } from "../../infrastructure/security/jwt";
import { config } from "../../config";

export async function login(req: Request, res: Response) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return sendError(res, {
                type: ErrorType.ValidationError,
                details: { message: "Email and password are required" }
            });
        }

        const ADMIN_USERNAME = config.CLANSCORE_ADMIN_USERNAME;
        const ADMIN_PASSWORD = config.CLANSCORE_ADMIN_PW;
        
        if (ADMIN_PASSWORD && email === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            const token = signToken({
                userId: "admin",
                email: ADMIN_USERNAME,
                firstName: "Admin",
                lastName: "User",
                nickname: "admin",
            });
            
            const userApiModel = {
                id: "admin",
                firstName: "Admin",
                lastName: "User",
                nickname: "admin",
                birthdate: "",
                address: "",
                phone: "",
                email: ADMIN_USERNAME,
                score: 0,
                roles: ["PASSWORD_ADMIN"],
            };
            
            return res.json({
                token,
                user: userApiModel
            });
        }

        const result = await Users.checkLoginCredentials(email, password);
        if (!result.ok) return sendError(res, result.error);
        
        const personEntity = toPersonEntity(result.value.user);
        const rolesResult = await UserModel.getUserRolesByUserId(personEntity._id);
        const roleIds = rolesResult.ok 
            ? rolesResult.value.map(r => String(r.role._id))
            : [];
        
        // Check if user has 'Vorstand' role - only Vorstand members can log in
        const vorstandRoleResult = await UserModel.getRoleByName("Vorstand");
        if (!vorstandRoleResult.ok) {
            return sendError(res, {
                type: ErrorType.RoleNotFound,
                details: { message: "Vorstand role not found in system" }
            });
        }
        
        const vorstandRoleId = String(vorstandRoleResult.value._id);
        const hasVorstandRole = roleIds.includes(vorstandRoleId);
        
        if (!hasVorstandRole) {
            return sendError(res, {
                type: ErrorType.UserNotManageable,
                details: { message: "Only users with the 'Vorstand' role can log in" }
            });
        }
        
        const personDTO = toPersonDTO(personEntity);
        
        const token = signToken({
            userId: personDTO.id,
            email: personDTO.email || "",
            firstName: personDTO.firstName,
            lastName: personDTO.lastName,
            nickname: personDTO.nickname || undefined,
        });
        
        const userApiModel = {
            id: personDTO.id,
            firstName: personDTO.firstName,
            lastName: personDTO.lastName,
            nickname: personDTO.nickname || "",
            birthdate: personDTO.birthdate || "",
            address: personDTO.address,
            phone: personDTO.phone || "",
            email: personDTO.email || "",
            score: personDTO.score,
            roles: roleIds,
        };
        
        return res.json({
            token,
            user: userApiModel
        });
    } catch (error) {
        return sendError(res, {
            type: ErrorType.UnknownError,
            details: { message: error instanceof Error ? error.message : String(error) }
        });
    }
}

export async function register(req: Request, res: Response) {
    const { user } = req.body;
    const result = await Users.savePerson(user);
    if (!result.ok) return sendError(res, result.error);
    res.json(result.value);
}

export async function logout(req: Request, res: Response) {
    const result = true
    res.json(result);
}

export async function getAllRoles(req: Request, res: Response) {
    const r = await Users.getAllRoles();
    if (!r.ok) return sendError(res, r.error);
    return res.json(r.value.map(toRoleDTO));
}
