import {
  ButtonInteraction,
  CommandInteraction,
  MessageFlags,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
} from "discord.js";
import { ErrorDetails, getErrorMessage, ErrorType } from "@clanscore/shared";

// type AnyInteraction =
//   | CommandInteraction
//   | ModalSubmitInteraction
//   | ButtonInteraction
//   | StringSelectMenuInteraction;

// export async function replyWithError(interaction: AnyInteraction, error: ErrorDetails) {
//   const content = getUserMessage(error);
//   try {
//     return await interaction.reply({ content, flags: MessageFlags.Ephemeral });
//   } catch (err: unknown) {
//     const code = (err as any)?.code;
//     if (code === "InteractionAlreadyReplied" || interaction.deferred || interaction.replied) {
//       return interaction.editReply({ content });
//     }
//     throw err;
//   }
// }

// export class BotCommandError extends Error {
//   constructor(public details: ErrorDetails) {
//     super(details.type);
//   }
// }

export async function replyWithError(
    interaction:
        | CommandInteraction
        | ModalSubmitInteraction
        | ButtonInteraction
        | StringSelectMenuInteraction,
    error: ErrorDetails,
) {
    try {
        return await interaction.reply({
            content: getErrorMessage(error),
            flags: MessageFlags.Ephemeral,
        });
    } catch (err: unknown) {
        if (
            typeof err === "object" &&
            err !== null &&
            "code" in err &&
            typeof (err as { code?: unknown }).code === "string" &&
            (err as { code: string }).code === "InteractionAlreadyReplied"
        ) {
            return;
        }
        throw err;
    }
}

// Discord requires a reply within 3 seconds, we need to tell Discord here that we need more time.
// Deferred Replies can only be edited and can't have a Ephemeral Flag.
// The Ephemeral Flag has to be set on the defer.
// (https://discordjs.guide/slash-commands/response-methods.html#deferred-responses)
export async function replyWithDeferredError(
    interaction:
        | CommandInteraction
        | ModalSubmitInteraction
        | ButtonInteraction
        | StringSelectMenuInteraction,
    error: ErrorDetails,
) {
    try {
        if (interaction.replied || interaction.deferred) {
            return interaction.editReply({
                content: getErrorMessage(error),
            });
        } else {
            return interaction.reply({
                content: getErrorMessage(error),
            });
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDetails: ErrorDetails = {
            type: ErrorType.UnknownError,
            details: {
                message: `Failed to respond to interaction: ${errorMessage}`,
            }
        };
        getErrorMessage(errorDetails);
    }
}

// Error for throwing with ErrorDetails
export class BotCommandError extends Error {
    public details: ErrorDetails;

    constructor(details: ErrorDetails) {
        super(details.type); // for stack trace
        this.details = details;
    }
}
