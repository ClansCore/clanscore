import { Router } from "express";
import * as ctl from "../controllers/user.controller";
import { requirePasswordAdmin, requireAuth } from "../../infrastructure/security/jwt";

export const usersRouter = Router();

usersRouter.get("/", ctl.getAllUsers);
usersRouter.get("/firstUser", ctl.getFirstUser);
usersRouter.get("/application/temp/by-discord/:discordId", ctl.getJoinTempDataByDiscordId);
usersRouter.patch("/application/temp/by-discord/:discordId", ctl.updateJoinTempData);
usersRouter.delete("/application/temp/by-discord/:discordId", ctl.deleteJoinTempData);

usersRouter.post("/:personId/application/accept", ctl.acceptApplication);
usersRouter.post("/:personId/application/deny", ctl.denyApplication);
usersRouter.get("/:personId/application/is-pending", ctl.isApplicationPending);
usersRouter.patch("/:personId/application-message", ctl.updatePersonApplicationMessageId);
// usersRouter.post("/:personId/application/reset", ctl.resetApplication);

usersRouter.patch("/", ctl.savePerson);
usersRouter.post("/sync", ctl.syncUsers);
usersRouter.patch("/:personId", ctl.updatePerson);
usersRouter.get("/by-discord/:discordId", ctl.getPersonByDiscordId);
usersRouter.get("/by-discord/:discordId/data", ctl.getPersonDataByDiscordId);
usersRouter.get("/by-role/:roleName", ctl.getPersonsByRoleName);
usersRouter.patch("/:personId/status-deletion", ctl.updatePersonStatusAndDeletion);
usersRouter.delete("/:personId", ctl.deletePerson);
usersRouter.post("/:personId/roles", ctl.addUserRole);
usersRouter.delete("/:personId/roles/:roleId", ctl.removeUserRole);
usersRouter.get("/:personId/roles", ctl.getUserRolesByUserId);
usersRouter.patch("/:personId/role-status", ctl.updatePersonRoleStatus);
usersRouter.post("/:personId/points/increment", ctl.incrementPersonPoints);
usersRouter.post("/:personId/points/decrement", ctl.decrementPersonPoints);
usersRouter.get("/:personId/points", ctl.getPointsByUserId);
usersRouter.get("/:personId/points/history", ctl.getPointHistory);
usersRouter.post("/me/password", requireAuth, ctl.changeOwnPassword);
usersRouter.post("/:personId/password", requirePasswordAdmin, ctl.setUserPassword);
usersRouter.get("/:personId", ctl.getPersonById);
