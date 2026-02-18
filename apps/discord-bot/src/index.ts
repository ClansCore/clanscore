import { startHttpServer } from "./web/server";
import { registerDiscordHandlers } from "./discord.handler";
import { client, startBot } from "./discord.bot";
import { registerDiscordCommands } from "./deploy.commands"
import { config } from "./config";
import { ErrorType, ErrorDetails, getErrorMessage } from "@clanscore/shared";

// Handler registrieren
registerDiscordHandlers(client);

// HTTP-Server starten
startHttpServer();

// Commands registrieren
registerDiscordCommands(config.DISCORD_GUILD_ID);

// Bot einloggen
startBot(config.DISCORD_TOKEN)
    .then(() => console.log("✅ Discord bot started successfully"))
    .catch((err) => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const errorDetails: ErrorDetails = {
            type: ErrorType.UnknownError,
            details: {
                message: `Login failed: ${errorMessage}`,
            }
        };
        getErrorMessage(errorDetails);
        process.exit(1);
    });
