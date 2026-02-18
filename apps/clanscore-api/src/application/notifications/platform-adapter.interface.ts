import type {
    RoleChangedEvent,
    UserCreatedEvent,
    UserStatusChangedEvent,
    ApplicationAcceptedEvent,
    ApplicationDeniedEvent,
    RoleUpdatedEvent,
} from "./notification.events";

export interface PlatformAdapter {
    readonly name: string;

    isEnabled(): boolean;

    onRoleChanged(event: RoleChangedEvent): Promise<void>;

    onUserCreated(event: UserCreatedEvent): Promise<void>;

    onUserStatusChanged(event: UserStatusChangedEvent): Promise<void>;

    onApplicationAccepted(event: ApplicationAcceptedEvent): Promise<void>;

    onApplicationDenied(event: ApplicationDeniedEvent): Promise<void>;

    onRoleUpdated(event: RoleUpdatedEvent): Promise<void>;
}

export abstract class BasePlatformAdapter implements PlatformAdapter {
    abstract readonly name: string;

    abstract isEnabled(): boolean;

    async onRoleChanged(_event: RoleChangedEvent): Promise<void> {}

    async onUserCreated(_event: UserCreatedEvent): Promise<void> {}

    async onUserStatusChanged(_event: UserStatusChangedEvent): Promise<void> {}

    async onApplicationAccepted(_event: ApplicationAcceptedEvent): Promise<void> {}

    async onApplicationDenied(_event: ApplicationDeniedEvent): Promise<void> {}

    async onRoleUpdated(_event: RoleUpdatedEvent): Promise<void> {}
}
