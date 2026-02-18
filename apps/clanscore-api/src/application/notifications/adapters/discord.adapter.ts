import { config } from "../../../config";
import { BasePlatformAdapter } from "../platform-adapter.interface";
import type {
    RoleChangedEvent,
    ApplicationAcceptedEvent,
    ApplicationDeniedEvent,
    RoleUpdatedEvent,
} from "../notification.events";
import { ErrorType, ErrorDetails, getErrorMessage } from "@clanscore/shared";

export class DiscordAdapter extends BasePlatformAdapter {
    readonly name = "discord";
    private baseUrl: string;
    private secret: string;

    constructor() {
        super();
        this.baseUrl = config.DISCORD_BOT_WEBHOOK_URL;
        this.secret = config.WEBHOOK_SHARED_SECRET;
    }

    isEnabled(): boolean {
        return !!this.baseUrl && !!this.secret;
    }

    async onRoleChanged(event: RoleChangedEvent): Promise<void> {
        if (!this.isEnabled()) return;

        try {
            const response = await fetch(`${this.baseUrl}/api/notifications/role-changed`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-webhook-token": this.secret,
                },
                body: JSON.stringify({
                    discordId: event.platformUserId,
                    username: event.username,
                    guildId: config.DISCORD_GUILD_ID,
                    addRoles: event.addedRoles,
                    removeRoles: event.removedRoles,
                    changedBy: event.changedBy,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                const errorDetails: ErrorDetails = {
                    type: ErrorType.NotificationFailed,
                    details: {
                        message: `DiscordAdapter.onRoleChanged failed: ${response.status} - ${errorText}`,
                        status: response.status,
                    }
                };
                getErrorMessage(errorDetails);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails: ErrorDetails = {
                type: ErrorType.NetworkFailure,
                details: {
                    message: `DiscordAdapter.onRoleChanged error: ${errorMessage}`,
                }
            };
            getErrorMessage(errorDetails);
        }
    }

    async onApplicationAccepted(event: ApplicationAcceptedEvent): Promise<void> {
        if (!this.isEnabled()) return;

        try {
            const response = await fetch(`${this.baseUrl}/api/notifications/user-status`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-webhook-token": this.secret,
                },
                body: JSON.stringify({
                    discordId: event.platformUserId,
                    status: "Accepted",
                    guildId: config.DISCORD_GUILD_ID,
                    roleName: event.roleName,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                const errorDetails: ErrorDetails = {
                    type: ErrorType.NotificationFailed,
                    details: {
                        message: `DiscordAdapter.onApplicationAccepted failed: ${response.status} - ${errorText}`,
                        status: response.status,
                    }
                };
                getErrorMessage(errorDetails);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails: ErrorDetails = {
                type: ErrorType.NetworkFailure,
                details: {
                    message: `DiscordAdapter.onApplicationAccepted error: ${errorMessage}`,
                }
            };
            getErrorMessage(errorDetails);
        }
    }

    async onApplicationDenied(event: ApplicationDeniedEvent): Promise<void> {
        if (!this.isEnabled()) return;

        try {
            const response = await fetch(`${this.baseUrl}/api/notifications/user-status`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-webhook-token": this.secret,
                },
                body: JSON.stringify({
                    discordId: event.platformUserId,
                    status: "Denied",
                    guildId: config.DISCORD_GUILD_ID,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                const errorDetails: ErrorDetails = {
                    type: ErrorType.NotificationFailed,
                    details: {
                        message: `DiscordAdapter.onApplicationDenied failed: ${response.status} - ${errorText}`,
                        status: response.status,
                    }
                };
                getErrorMessage(errorDetails);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails: ErrorDetails = {
                type: ErrorType.NetworkFailure,
                details: {
                    message: `DiscordAdapter.onApplicationDenied error: ${errorMessage}`,
                }
            };
            getErrorMessage(errorDetails);
        }
    }

    async onRoleUpdated(event: RoleUpdatedEvent): Promise<void> {
        if (!this.isEnabled()) return;

        try {
            const response = await fetch(`${this.baseUrl}/api/notifications/role-updated`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-webhook-token": this.secret,
                },
                body: JSON.stringify({
                    guildId: config.DISCORD_GUILD_ID,
                    oldName: event.oldName,
                    newName: event.newName,
                    color: event.color,
                    permissions: event.permissions,
                    hoist: event.hoist,
                    mentionable: event.mentionable,
                    changedBy: event.changedBy,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                const errorDetails: ErrorDetails = {
                    type: ErrorType.NotificationFailed,
                    details: {
                        message: `DiscordAdapter.onRoleUpdated failed: ${response.status} - ${errorText}`,
                        status: response.status,
                    }
                };
                getErrorMessage(errorDetails);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails: ErrorDetails = {
                type: ErrorType.NetworkFailure,
                details: {
                    message: `DiscordAdapter.onRoleUpdated error: ${errorMessage}`,
                }
            };
            getErrorMessage(errorDetails);
        }
    }
}
