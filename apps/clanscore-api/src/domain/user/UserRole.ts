import mongoose from "mongoose";
import { IPerson } from "./Person";

const userRoleSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Person",
        required: true,
    },
    roleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
        required: true,
    },
});

export interface IUserRole {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    roleId: mongoose.Types.ObjectId;
}

export interface IUserRolePopulated {
    _id: mongoose.Types.ObjectId;
    userId: IPerson;
    roleId: mongoose.Types.ObjectId;
}

export type UserRoleInput = Omit<IUserRole, "_id">;

export const UserRole = mongoose.model<IUserRole>("UserRole", userRoleSchema);
