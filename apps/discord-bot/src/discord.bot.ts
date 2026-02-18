import { Client, GatewayIntentBits, Partials } from "discord.js";
import { setClientInstance } from "./utils-discord/guild";
import { ErrorType, ErrorDetails, getErrorMessage } from "@clanscore/shared";

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [
        Partials.User,
        Partials.Message,
        Partials.Reaction,
        Partials.Channel,
    ],
});

client.on("error", (error) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails: ErrorDetails = {
        type: ErrorType.UnknownError,
        details: {
            message: `Discord client error: ${errorMessage}`,
        }
    };
    getErrorMessage(errorDetails);
});

process.on("unhandledRejection", (reason, promise) => {
    const reasonMessage = reason instanceof Error ? reason.message : String(reason);
    const errorDetails: ErrorDetails = {
        type: ErrorType.UnknownError,
        details: {
            message: `Unhandled Rejection: ${reasonMessage}`,
        }
    };
    getErrorMessage(errorDetails);
});

export async function startBot(token: string): Promise<void> {
    setClientInstance(client);
    await client.login(token);
}
