// Notification-Event-Typen für plattformübergreifende Benachrichtigungen.

export type RoleChangedEvent = {
    type: "role_changed";
    userId: string;           // Interne User-ID
    platformUserId: string;   // Plattform-spezifische ID (z.B. Discord-ID)
    username: string;
    addedRoles: string[];
    removedRoles: string[];
    changedBy?: string;
};

export type UserCreatedEvent = {
    type: "user_created";
    userId: string;
    platformUserId: string;
    username: string;
};

export type UserStatusChangedEvent = {
    type: "user_status_changed";
    userId: string;
    platformUserId: string;
    username: string;
    oldStatus: string;
    newStatus: string;
};

export type ApplicationAcceptedEvent = {
    type: "application_accepted";
    userId: string;
    platformUserId: string;
    username: string;
    roleName?: string;
};

export type ApplicationDeniedEvent = {
    type: "application_denied";
    userId: string;
    platformUserId: string;
    username: string;
};

export type RoleUpdatedEvent = {
    type: "role_updated";
    roleId: string;
    oldName: string;
    newName: string;
    color?: string | null;
    permissions?: string | null;
    hoist?: boolean;
    mentionable?: boolean;
    changedBy?: string;
};

export type NotificationEvent =
    | RoleChangedEvent
    | UserCreatedEvent
    | UserStatusChangedEvent
    | ApplicationAcceptedEvent
    | ApplicationDeniedEvent
    | RoleUpdatedEvent;
