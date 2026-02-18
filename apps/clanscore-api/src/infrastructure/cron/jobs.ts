import cron from "node-cron";
import { deleteScheduledPersons } from "../../application/user/user.service";
import { config } from "../../config";
import { ErrorType, ErrorDetails, getErrorMessage } from "@clanscore/shared";

export function registerCronJobs() {
    // Geplante Löschung von Personen und User-Synchronisierung
    cron.schedule("0 3 * * *", async () => {
        console.log("Starte geplante Löschung...");
        await deleteScheduledPersons();
        
        console.log("Starte User-Synchronisierung...");
        try {
            const response = await fetch(`${config.DISCORD_BOT_WEBHOOK_URL}/api/notifications/sync-users`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-webhook-token": config.WEBHOOK_SHARED_SECRET,
                },
                body: JSON.stringify({
                    guildId: config.DISCORD_GUILD_ID,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                const errorDetails: ErrorDetails = {
                    type: ErrorType.NetworkFailure,
                    details: {
                        message: `User-Synchronisierung fehlgeschlagen: ${response.status} - ${errorText}`,
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
                    message: `Fehler bei User-Synchronisierung: ${errorMessage}`,
                }
            };
            getErrorMessage(errorDetails);
        }
    });

    console.log("✅ Registered all Cron-Jobs");
}
