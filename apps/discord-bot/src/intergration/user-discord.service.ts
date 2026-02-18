import {
    ActionRow,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonComponent,
    ComponentType,
    Guild,
    GuildMember,
    MessageActionRowComponent,
    MessageActionRowComponentBuilder,
} from "discord.js";
import {
    ErrorType,
    Result,
    ErrorDetails,
    ok,
    err,
    PersonDTO,
    ChannelNames,
    getErrorMessage,
} from "@clanscore/shared";
import { getChannelByName } from "../utils-discord/guild";
import { api } from "../api/apiClient";
import { config } from "../config";

export class UserApplicationDiscordService {

    public async markUserForDeletion(
        person: PersonDTO,
        guild: Guild,
    ): Promise<Result<PersonDTO, ErrorDetails>> {
        if (!person.discordId) {
            return err(ErrorType.UserNotFound);
        }

        const deletionDate = new Date();
        deletionDate.setMonth(deletionDate.getMonth() + 3);

        const updateResult = await api.updatePersonStatusAndDeletionDate(
            person.id, "ToBeDeleted", deletionDate.toISOString()
        );
        if (!updateResult.ok) return updateResult;

        try {
            const member = await guild.members.fetch(person.discordId);
            if (member) {
                const rolesToRemove = ["Mitglied", "Vorstand"];
                for (const roleName of rolesToRemove) {
                    const roleResult = await api.getRoleByName(roleName);
                    if (roleResult.ok) {
                        const role = guild.roles.cache.find((r) => r.name === roleResult.value.name);
                        if (role && member.roles.cache.has(role.id)) {
                            await member.roles.remove(role, "User has left the club");
                        }
                    }
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails: ErrorDetails = {
                type: ErrorType.RoleAssignmentFailed,
                details: {
                    message: `Fehler beim Entfernen von Rollen für ${person.discordId}: ${errorMessage}`,
                }
            };
            getErrorMessage(errorDetails);
        }

        return ok(updateResult.value);
    }
}

export async function resetJoinRequest(
    person: PersonDTO,
    guild: Guild,
): Promise<void> {
    if (!person.applicationMessageId || !person.discordId) return;

    const targetChannelResult = await getChannelByName(guild.id, ChannelNames.APPLICATIONS);
    if (!targetChannelResult.ok) return;

    const channel = targetChannelResult.value;
    if (!channel.isTextBased()) return;

    try {
        const message = await channel.messages.fetch(person.applicationMessageId);

        const rows = message.components as ActionRow<MessageActionRowComponent>[];

        await message.edit({
            components: rows.map((row) => {
                const newRow = new ActionRowBuilder<MessageActionRowComponentBuilder>();

                for (const component of row.components) {
                    if (component.type === ComponentType.Button) {
                        const btn = component as ButtonComponent;
                        newRow.addComponents(ButtonBuilder.from(btn).setDisabled(true));
                    } else {
                        newRow.addComponents(
                            component as unknown as MessageActionRowComponentBuilder,
                        );
                    }
                }
                return newRow;
            }),
        });
    } catch (err) {
        if ((err as { code?: number }).code === 10008) {
            await api.updatePersonApplicationMessageId(person.id, "");
        } else {
            const errorMessage = err instanceof Error ? err.message : String(err);
            const errorDetails: ErrorDetails = {
                type: ErrorType.UnknownError,
                details: {
                    message: `Fehler in resetJoinRequest: ${errorMessage}`,
                }
            };
            getErrorMessage(errorDetails);
        }
    }
}

export async function handleGuildMemberAdd(member: GuildMember): Promise<void> {
    const MANUAL_URI = config.MANUAL_URL;
    const welcomeMessage = `
Willkommen auf dem Server **${member.guild.name}**! 🎉

Bitte lies unsere Regeln im Regel-Chat durch. 
Die Nutzung des Servers bedeutet Zustimmung zu den allgemeinen Regeln!

🤖 **Im Discord-Bot Channel** kannst du mit \`/help\` alle Befehle vom Discord Vereins-Bot ansehen.

Hier geht es zum [Benutzerhandbuch](${MANUAL_URI})

⚠️ Die Befehle funktionieren **nur im Server** und nicht hier im privaten Chat!`;

    try {
        await member.send(welcomeMessage);
    } catch {
        // DM failed - ignore silently
    }
}
