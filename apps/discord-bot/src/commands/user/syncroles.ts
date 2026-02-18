import {
    CommandInteraction,
    SlashCommandBuilder,
    Guild,
    RoleData,
    ColorResolvable,
    PermissionResolvable,
    MessageFlags,
    ButtonStyle,
    ButtonBuilder,
    ActionRowBuilder,
    ComponentType,
    DiscordAPIError,
    EmbedBuilder,
    PermissionFlagsBits,
    TextChannel,
} from "discord.js";
import { getErrorMessage, ErrorType, DiscordRoleInput, ChannelNames, ErrorDetails } from "@clanscore/shared";
import { api } from "../../api/apiClient";

export const data = new SlashCommandBuilder()
    .setName("syncroles")
    .setDescription(
        "Admins-Only: Synchronisiere Rollen zwischen Discord und der Datenbank. (exkl. Bot-Rollen)",
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: CommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guild = interaction.guild as Guild;

    const discordRoles = guild.roles.cache.filter(
        (r) => r.name !== "@everyone" && !r.tags?.botId
    );

    const dbRolesResult = await api.getAllRoles();
    if (!dbRolesResult.ok) {
        return interaction.editReply(
            getErrorMessage({ type: ErrorType.RoleNotFound }),
        );
    }
    const dbRoles = dbRolesResult.value;

    const dbRolesMap = new Map(dbRoles.map((r) => [r.name, r]));
    const discordRolesMap = new Map(discordRoles.map((r) => [r.name, r]));

    const conflictingRoles = Array.from(discordRolesMap.entries())
        .filter(([name]) => dbRolesMap.has(name))
        .map(([name]) => name);

    if (conflictingRoles.length > 0) {
        const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("confirm_overwrite")
                .setLabel("Ja, überschreiben")
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId("cancel_overwrite")
                .setLabel("Abbrechen")
                .setStyle(ButtonStyle.Secondary),
        );

        await interaction.editReply({
            content:
                `⚠️ Die folgenden Rollen existieren bereits in der Datenbank und würden überschrieben werden:\n\n` +
                `${conflictingRoles.map((r) => `• ${r}`).join("\n")}\n\n` +
                `Möchtest du wirklich fortfahren?`,
            components: [confirmRow],
        });

        const confirmation = await interaction.channel
            ?.awaitMessageComponent({
                componentType: ComponentType.Button,
                time: 20_000,
                filter: (btnInt) => btnInt.user.id === interaction.user.id,
            })
            .catch(() => null);

        if (!confirmation || confirmation.customId === "cancel_overwrite") {
            return interaction.editReply({
                content: getErrorMessage({ type: ErrorType.SyncCancelled }),
                components: [],
            });
        }

        await confirmation.update({
            content: "🔄 Bestätigung erhalten. Synchronisiere Rollen...",
            components: [],
        });
    }

    const discordRolesInput: DiscordRoleInput[] = Array.from(discordRoles.values()).map(
        (role) => ({
            name: role.name,
            discordColor: role.hexColor,
            discordPosition: role.position,
            discordPermissions: role.permissions.bitfield.toString(),
            hoist: role.hoist ?? false,
            mentionable: role.mentionable ?? false,
        })
    );

    const syncResult = await api.syncRoles(discordRolesInput);
    if (!syncResult.ok) {
        return interaction.editReply(
            getErrorMessage({ type: ErrorType.UnknownError }),
        );
    }

    const { createdInDb, updatedInDb, rolesToCreateInDiscord, userRoleAssignments } =
        syncResult.value;

    const createdInDiscord: string[] = [];
    const failedToCreate: string[] = [];

    for (const role of rolesToCreateInDiscord) {
        const roleData: RoleData = {
            name: role.name,
            color: (role.discordColor as ColorResolvable) ?? undefined,
            permissions: (role.discordPermissions as PermissionResolvable) ?? [],
            hoist: role.hoist ?? false,
            mentionable: role.mentionable ?? false,
        };

        try {
            const newRole = await guild.roles.create({
                ...roleData,
                reason: "Synchronisierung mit DB",
            });

            if (typeof role.discordPosition === "number") {
                await newRole
                    .setPosition(role.discordPosition)
                    .catch( /* ignore */ );
            }

            createdInDiscord.push(newRole.name);
        } catch (error) {
            if (error instanceof DiscordAPIError && error.code === 50013) {
                failedToCreate.push(`${role.name} *(fehlende Berechtigung)*`);
            } else {
                const errorMessage = error instanceof Error ? error.message : String(error);
                const errorDetails: ErrorDetails = {
                    type: ErrorType.RoleAssignmentFailed,
                    details: {
                        message: `Fehler beim Erstellen der Rolle "${role.name}": ${errorMessage}`,
                    }
                };
                getErrorMessage(errorDetails);
                failedToCreate.push(`${role.name} *(unbekannter Fehler)*`);
            }
        }
    }

    const updatedDiscordRolesMap = new Map(
        guild.roles.cache.map((r) => [r.name, r])
    );

    for (const assignment of userRoleAssignments) {
        const member = guild.members.cache.get(assignment.discordId);
        if (!member) continue;

        const discordRole = updatedDiscordRolesMap.get(assignment.roleName);
        if (!discordRole) continue;

        if (!member.roles.cache.has(discordRole.id)) {
            try {
                await member.roles.add(discordRole, "Synchronisiert aus DB");
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                const errorDetails: ErrorDetails = {
                    type: ErrorType.RoleAssignmentFailed,
                    details: {
                        message: `Fehler beim Hinzufügen der Rolle "${assignment.roleName}" für Benutzer "${member.user.tag}": ${errorMessage}`,
                    }
                };
                getErrorMessage(errorDetails);
            }
        }
    }

    let content = `✅ Rollen-Synchronisierung abgeschlossen.`;
    const embeds = [];

    if (createdInDb.length > 0) {
        const createdInDbEmbed = new EmbedBuilder()
            .setColor(0x2ecc71)
            .setTitle("📥 In Datenbank erstellt")
            .setDescription(
                `${createdInDb.length} Rolle(n):\n- ${createdInDb.join("\n- ")}`,
            )
            .setTimestamp();
        embeds.push(createdInDbEmbed);
    }

    if (updatedInDb.length > 0) {
        const updatedInDbEmbed = new EmbedBuilder()
            .setColor(0xf1c40f)
            .setTitle("📝 In Datenbank aktualisiert")
            .setDescription(
                `${updatedInDb.length} Rolle(n):\n- ${updatedInDb.join("\n- ")}`,
            )
            .setTimestamp();
        embeds.push(updatedInDbEmbed);
    }

    if (createdInDiscord.length > 0) {
        const createdInDiscordEmbed = new EmbedBuilder()
            .setColor(0x3498db)
            .setTitle("📤 In Discord erstellt")
            .setDescription(
                `${createdInDiscord.length} Rolle(n):\n- ${createdInDiscord.join("\n- ")}`,
            )
            .setTimestamp();
        embeds.push(createdInDiscordEmbed);
    }

    if (failedToCreate.length > 0) {
        const failedToCreateEmbed = new EmbedBuilder()
            .setColor(0xe74c3c)
            .setTitle("⚠️ Fehler beim Erstellen folgender Rollen")
            .setDescription(failedToCreate.map((r) => `• ${r}`).join("\n"))
            .setFooter({
                text: "Für Rollen mit hohen Berechtigungen braucht der Bot gleichhohe oder höhere Rechte (Adminrechte).",
            })
            .setTimestamp();
        embeds.push(failedToCreateEmbed);
    }

    if (embeds.length === 0) {
        content += "\n\n⚠️ Keine Änderungen gefunden.";
    }

    await interaction.editReply({
        content,
        embeds,
    });

    if (embeds.length > 0) {
        const logChannel = guild.channels.cache.find(
            (c) => c.name === ChannelNames.BotLog
        ) as TextChannel | undefined;

        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle("🔄 Rollen-Synchronisierung")
                .setColor(0x9634eb)
                .setDescription(`Ausgeführt von <@${interaction.user.id}>`)
                .setTimestamp();

            if (createdInDb.length > 0) {
                logEmbed.addFields({
                    name: "📥 In DB erstellt",
                    value: createdInDb.slice(0, 10).join(", ") + (createdInDb.length > 10 ? ` ... (+${createdInDb.length - 10})` : ""),
                    inline: false,
                });
            }

            if (updatedInDb.length > 0) {
                logEmbed.addFields({
                    name: "📝 In DB aktualisiert",
                    value: updatedInDb.slice(0, 10).join(", ") + (updatedInDb.length > 10 ? ` ... (+${updatedInDb.length - 10})` : ""),
                    inline: false,
                });
            }

            if (createdInDiscord.length > 0) {
                logEmbed.addFields({
                    name: "📤 In Discord erstellt",
                    value: createdInDiscord.slice(0, 10).join(", ") + (createdInDiscord.length > 10 ? ` ... (+${createdInDiscord.length - 10})` : ""),
                    inline: false,
                });
            }

            if (failedToCreate.length > 0) {
                logEmbed.addFields({
                    name: "⚠️ Fehler",
                    value: failedToCreate.slice(0, 5).join("\n") + (failedToCreate.length > 5 ? `\n... (+${failedToCreate.length - 5})` : ""),
                    inline: false,
                });
            }

            await logChannel.send({ embeds: [logEmbed] }).catch( /* ignore */ );
        }
    }
}
