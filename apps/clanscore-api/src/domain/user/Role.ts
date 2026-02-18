import mongoose from "mongoose";

// de: Rolle
const roleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    discordColor: { type: String, default: null },
    discordPosition: { type: Number, required: true },
    discordPermissions: { type: String, default: null },
    hoist: { type: Boolean, default: false },
    mentionable: { type: Boolean, default: false },
});

export interface IRole {
    _id: mongoose.Types.ObjectId;
    name: string;
    discordColor?: string | null;
    discordPosition: number;
    discordPermissions?: string | null;
    hoist?: boolean;
    mentionable?: boolean;
}

export type RoleInput = Omit<IRole, "_id">;

export const Role = mongoose.model<IRole>("Role", roleSchema);
