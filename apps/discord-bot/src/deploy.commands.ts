import { REST, Routes } from "discord.js";
import { config } from "./config";
import { commands } from "./commands";
import { ErrorType, ErrorDetails, getErrorMessage } from "@clanscore/shared";

const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

export async function registerDiscordCommands(guildId: string) {
    try {
        const commandsData = Object.values(commands).map((command) =>
            command.data.toJSON(),
        );

        console.log(
            `🚀 Deploying ${commandsData.length} application (/) commands to guild ${guildId}...`,
        );

        await rest.put(
            Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, guildId),
            { body: commandsData },
        );

        console.log("✅ Commands successfully registered / updated.");
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDetails: ErrorDetails = {
            type: ErrorType.UnknownError,
            details: {
                message: `Error deploying commands: ${errorMessage}`,
            }
        };
        getErrorMessage(errorDetails);
    }
}

async function main() {
    const guildId = config.DISCORD_GUILD_ID;
    if (!guildId) {
        const errorDetails: ErrorDetails = {
            type: ErrorType.UnknownError,
            details: {
                message: "DISCORD_GUILD_ID not set in config/env",
            }
        };
        getErrorMessage(errorDetails);
        process.exit(1);
    }

    await registerDiscordCommands(guildId);
}
