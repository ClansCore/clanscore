import type { PlatformAdapter } from "./platform-adapter.interface";
import type {
    RoleChangedEvent,
    UserCreatedEvent,
    UserStatusChangedEvent,
    ApplicationAcceptedEvent,
    ApplicationDeniedEvent,
    RoleUpdatedEvent,
    NotificationEvent,
} from "./notification.events";
import { ErrorType, ErrorDetails, getErrorMessage } from "@clanscore/shared";

export class NotificationService {
    private adapters: Map<string, PlatformAdapter> = new Map();

    register(adapter: PlatformAdapter): void {
        if (adapter.isEnabled()) {
            this.adapters.set(adapter.name, adapter);
            console.log(`✅ NotificationService: ${adapter.name} adapter registered`);
        } else {
            console.log(`⏭️ NotificationService: ${adapter.name} adapter skipped (not enabled)`);
        }
    }

    unregister(adapterName: string): void {
        this.adapters.delete(adapterName);
    }

    getRegisteredAdapters(): string[] {
        return Array.from(this.adapters.keys());
    }

    async notifyRoleChanged(event: Omit<RoleChangedEvent, "type">): Promise<void> {
        const fullEvent: RoleChangedEvent = { ...event, type: "role_changed" };
        await this.broadcast("onRoleChanged", fullEvent);
    }

    async notifyUserCreated(event: Omit<UserCreatedEvent, "type">): Promise<void> {
        const fullEvent: UserCreatedEvent = { ...event, type: "user_created" };
        await this.broadcast("onUserCreated", fullEvent);
    }

    async notifyUserStatusChanged(event: Omit<UserStatusChangedEvent, "type">): Promise<void> {
        const fullEvent: UserStatusChangedEvent = { ...event, type: "user_status_changed" };
        await this.broadcast("onUserStatusChanged", fullEvent);
    }

    async notifyApplicationAccepted(event: Omit<ApplicationAcceptedEvent, "type">): Promise<void> {
        const fullEvent: ApplicationAcceptedEvent = { ...event, type: "application_accepted" };
        await this.broadcast("onApplicationAccepted", fullEvent);
    }

    async notifyApplicationDenied(event: Omit<ApplicationDeniedEvent, "type">): Promise<void> {
        const fullEvent: ApplicationDeniedEvent = { ...event, type: "application_denied" };
        await this.broadcast("onApplicationDenied", fullEvent);
    }

    async notifyRoleUpdated(event: Omit<RoleUpdatedEvent, "type">): Promise<void> {
        const fullEvent: RoleUpdatedEvent = { ...event, type: "role_updated" };
        await this.broadcast("onRoleUpdated", fullEvent);
    }

    private async broadcast<K extends keyof PlatformAdapter>(
        method: K,
        event: NotificationEvent
    ): Promise<void> {
        const promises = Array.from(this.adapters.values()).map(async (adapter) => {
            try {
                const handler = adapter[method];
                if (typeof handler === "function") {
                    await (handler as (event: NotificationEvent) => Promise<void>).call(adapter, event);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                const errorDetails: ErrorDetails = {
                    type: ErrorType.NotificationFailed,
                    details: {
                        message: `NotificationService: Error in ${adapter.name}.${method}: ${errorMessage}`,
                        adapter: adapter.name,
                        method: String(method),
                    }
                };
                getErrorMessage(errorDetails);
            }
        });

        await Promise.allSettled(promises);
    }
}

// Singleton-Instanz
export const notificationService = new NotificationService();
