export type RoleDTO = {
    id: string;
    name: string;
    discordColor?: string | null;
    discordPosition: number;
    discordPermissions?: string | null;
    hoist?: boolean;
    mentionable?: boolean;
};

export type UserRoleDTO = {
    id: string;
    userId: string;
    roleId: string;
};

export type UserRoleWithRoleDTO = {
    id: string;
    userId: string;
    role: RoleDTO;
};

export type DiscordRoleInput = {
    name: string;
    discordColor: string;
    discordPosition: number;
    discordPermissions: string;
    hoist: boolean;
    mentionable: boolean;
};

export type UserRoleAssignment = {
    discordId: string;
    roleName: string;
};

export type SyncRolesRequestDTO = {
    discordRoles: DiscordRoleInput[];
};

export type SyncRolesResponseDTO = {
    createdInDb: string[];
    updatedInDb: string[];
    rolesToCreateInDiscord: RoleDTO[];
    userRoleAssignments: UserRoleAssignment[];
};
