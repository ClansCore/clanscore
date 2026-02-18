import { Client, MessageCreateOptions } from "discord.js";
import { ErrorType, ErrorDetails, getErrorMessage } from "@clanscore/shared";

export async function sendDm(
    discordId: string,
    client: Client,
    message: string | MessageCreateOptions,
): Promise<boolean> {
    try {
        const user = await client.users.fetch(discordId);
        if (typeof message === "string") {
            await user.send({ content: message });
        } else {
            await user.send(message);
        }
        return true;
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const errorDetails: ErrorDetails = {
            type: ErrorType.MessageNotSend,
            details: {
                message: `DM an ${discordId} fehlgeschlagen: ${errorMessage}`,
            }
        };
        getErrorMessage(errorDetails);
        return false;
    }
}
