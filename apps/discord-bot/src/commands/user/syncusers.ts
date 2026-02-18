import {
    CommandInteraction,
    SlashCommandBuilder,
    Guild,
    PermissionsBitField,
    MessageFlags,
    EmbedBuilder,
    GuildMember,
    PermissionFlagsBits,
    TextChannel,
} from "discord.js";
import { getErrorMessage, ErrorType, DiscordMemberInput, ChannelNames, SyncUsersResponseDTO, Result, ErrorDetails } from "@clanscore/shared";
import { api } from "../../api/apiClient";

export const data = new SlashCommandBuilder()
    .setName("syncusers")
    .setDescription(
        "Admins-Only: Synchronisiere Mitglieder und Vorstand (inkl. Discord-Rollen) mit der Datenbank.",
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);


export async function performSyncUsers(guild: Guild, triggeredBy?: string): Promise<Result<SyncUsersResponseDTO, ErrorDetails>> {
    const mitgliedDiscordRole = guild.roles.cache.find(
        (r) => r.name === "Mitglied",
    );
    const vorstandDiscordRole = guild.roles.cache.find(
        (r) => r.name === "Vorstand",
    );
    if (!mitgliedDiscordRole || !vorstandDiscordRole) {
        return {
            ok: false,
            error: { type: ErrorType.SyncDiscordRolesNotFound }
        };
    }

    const botMember = guild.members.me as GuildMember;
    if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return {
            ok: false,
            error: { type: ErrorType.BotPermissionRolesUnsufficient }
        };
    }
    if (
        botMember.roles.highest.position <= mitgliedDiscordRole.position ||
        botMember.roles.highest.position <= vorstandDiscordRole.position
    ) {
        return {
            ok: false,
            error: { type: ErrorType.BotPermissionRolesUnsufficient }
        };
    }

    let allMembers;
    let usedCache = false;
    try {
        allMembers = await guild.members.fetch({ time: 120_000 }); // 120 Sekunden Timeout
    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDetails: ErrorDetails = {
            type: ErrorType.UnknownError,
            details: {
                message: `Failed to fetch all guild members: ${errorMessage}`,
            }
        };
        getErrorMessage(errorDetails);
        
        if (guild.members.cache.size > 0) {
            allMembers = guild.members.cache;
            usedCache = true;
        } else {
            return {
                ok: false,
                error: { 
                    type: ErrorType.UnknownError,
                    details: { 
                        message: "Failed to fetch guild members. Keine gecachten Mitglieder verfügbar.",
                        originalError: error?.message || String(error)
                    }
                }
            };
        }
    }
    
    const discordMembers: DiscordMemberInput[] = Array.from(allMembers.values()).map(
        (member) => ({
            discordId: member.id,
            username: member.user.username,
            roleNames: member.roles.cache.map((r) => r.name),
        })
    );

    const syncResult = await api.syncUsers(discordMembers);
    if (!syncResult.ok) {
        return syncResult;
    }

    const { changes } = syncResult.value;

    if (changes.length > 0) {
        const logChannel = guild.channels.cache.find(
            (c) => c.name === ChannelNames.BotLog
        ) as TextChannel | undefined;

        if (logChannel) {
            const newUsers = changes.filter((c) => c.changeType === "created");
            const reactivated = changes.filter((c) => c.changeType === "reactivated");
            const markedForDeletion = changes.filter((c) => c.changeType === "marked_for_deletion");
            const roleChanges = changes.filter((c) => c.changeType === "roles_changed");

            const logEmbed = new EmbedBuilder()
                .setTitle("👥 User-Synchronisierung")
                .setColor(0x9634eb)
                .setDescription(triggeredBy 
                    ? `Ausgeführt von ${triggeredBy}` 
                    : "Automatisch ausgeführt (Cron-Job)")
                .setTimestamp();

            if (usedCache) {
                logEmbed.addFields({
                    name: "⚠️ Hinweis",
                    value: `Es wurden nur gecachte Mitglieder verwendet (${allMembers.size}). Möglicherweise wurden nicht alle Mitglieder synchronisiert.`,
                    inline: false,
                });
            }

            if (newUsers.length > 0) {
                logEmbed.addFields({
                    name: "👤 Neue Personen",
                    value: `${newUsers.length} erstellt`,
                    inline: true,
                });
            }

            if (reactivated.length > 0) {
                logEmbed.addFields({
                    name: "📥 Wieder-Eintritte",
                    value: `${reactivated.length} reaktiviert`,
                    inline: true,
                });
            }

            if (markedForDeletion.length > 0) {
                logEmbed.addFields({
                    name: "📤 Austritte",
                    value: `${markedForDeletion.length} markiert`,
                    inline: true,
                });
            }

            if (roleChanges.length > 0) {
                logEmbed.addFields({
                    name: "🔁 Rollenänderungen",
                    value: `${roleChanges.length} geändert`,
                    inline: true,
                });
            }

            const detailLines = changes.slice(0, 5).map(c => {
                const emoji = c.changeType === "created" ? "👤" :
                              c.changeType === "reactivated" ? "📥" :
                              c.changeType === "marked_for_deletion" ? "📤" : "🔁";
                return `${emoji} **${c.username}**: ${c.details}`;
            });

            if (detailLines.length > 0) {
                logEmbed.addFields({
                    name: "Details",
                    value: detailLines.join("\n") + (changes.length > 5 ? `\n... (+${changes.length - 5} weitere)` : ""),
                    inline: false,
                });
            }

            await logChannel.send({ embeds: [logEmbed] }).catch( /* ignore */ );
        }
    }

    return syncResult;
}

export async function execute(interaction: CommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guild = interaction.guild as Guild;
    const syncResult = await performSyncUsers(guild, `<@${interaction.user.id}>`);

    if (!syncResult.ok) {
        return interaction.editReply(
            getErrorMessage(syncResult.error),
        );
    }

    const { changes } = syncResult.value;

    let content = `✅ User-Synchronisierung mit Datenbank abgeschlossen.`;
    const embeds = [];

    const newUsers = changes.filter((c) => c.changeType === "created");
    const reactivated = changes.filter((c) => c.changeType === "reactivated");
    const markedForDeletion = changes.filter((c) => c.changeType === "marked_for_deletion");
    const roleChanges = changes.filter((c) => c.changeType === "roles_changed");

    if (newUsers.length > 0) {
        const newUsersEmbed = new EmbedBuilder()
            .setColor(0x2ecc71)
            .setTitle("👤 Neue Personen erstellt")
            .setDescription(
                `${newUsers.length} Person(en):\n${newUsers
                    .map((c) => `**${c.username}** (${c.discordId})`)
                    .join("\n")}`,
            )
            .setTimestamp();
        embeds.push(newUsersEmbed);
    }

    if (reactivated.length > 0) {
        const reactivatedEmbed = new EmbedBuilder()
            .setColor(0x3498db)
            .setTitle("📥 Wieder-Eintritte")
            .setDescription(
                `${reactivated.length} Person(en):\n${reactivated
                    .map((c) => `**${c.username}** (${c.discordId}): ${c.details}`)
                    .join("\n")}`,
            )
            .setTimestamp();
        embeds.push(reactivatedEmbed);
    }

    if (markedForDeletion.length > 0) {
        const deletionEmbed = new EmbedBuilder()
            .setColor(0xe74c3c)
            .setTitle("📤 Austritte")
            .setDescription(
                `${markedForDeletion.length} Person(en):\n${markedForDeletion
                    .map((c) => `**${c.username}** (${c.discordId}): ${c.details}`)
                    .join("\n")}`,
            )
            .setTimestamp();
        embeds.push(deletionEmbed);
    }

    if (roleChanges.length > 0) {
        const roleChangesEmbed = new EmbedBuilder()
            .setColor(0xf1c40f)
            .setTitle("🔁 Rollenänderungen")
            .setDescription(
                `${roleChanges.length} Person(en):\n${roleChanges
                    .map((c) => `**${c.username}** (${c.discordId}): ${c.details}`)
                    .join("\n")}`,
            )
            .setTimestamp();
        embeds.push(roleChangesEmbed);
    }

    if (embeds.length === 0) {
        content += "\n\n⚠️ Keine Änderungen gefunden.";
    }

    await interaction.editReply({
        content,
        embeds,
    });
}
