import { ChatInputCommandInteraction, CommandInteraction } from "discord.js";
import { replyWithError } from "../errors/dsicordAdapter";
import { ErrorType } from "@clanscore/shared";

export async function checkRoleAccess(
    interaction: CommandInteraction | ChatInputCommandInteraction,
    allowedRoles: string[],
): Promise<boolean> {
    const guildId = interaction.guildId;
    if (!guildId) {
        await replyWithError(interaction, {
            type: ErrorType.NotAServer,
        });
        return false;
    }

    const member = await interaction.guild?.members.fetch(interaction.user.id);
    if (!member) {
        await replyWithError(interaction, {
            type: ErrorType.UserNotFound,
            details: { discordId: interaction.user.id },
        });
        return false;
    }

    const hasRole = member.roles.cache.some((role) =>
        allowedRoles.includes(role.name),
    );
    if (!hasRole) {
        await replyWithError(interaction, {
            type: ErrorType.PermissionDenied,
        });
        return false;
    }

    return true;
}

export function withRoleAccess(
    handler: (
        interaction: CommandInteraction | ChatInputCommandInteraction,
    ) => Promise<void>,
    allowedRoles: string[],
): (interaction: CommandInteraction) => Promise<void> {
    return async function (interaction: CommandInteraction) {
        const ok = await checkRoleAccess(interaction, allowedRoles);
        if (!ok) return;
        await handler(interaction);
    };
}
