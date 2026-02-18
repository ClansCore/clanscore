import { Router } from "express";
import * as ctl from "../controllers/roles.controller";

export const rolesRouter = Router();
rolesRouter.get("/by-name/:name", ctl.byName);

rolesRouter.get("/", ctl.getAllRoles);
rolesRouter.post("/", ctl.addRole);
rolesRouter.post("/sync", ctl.syncRoles);
rolesRouter.patch("/:roleId", ctl.updateRole);
rolesRouter.delete("/:roleId", ctl.deleteRole);