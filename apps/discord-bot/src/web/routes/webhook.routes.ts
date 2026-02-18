import express from "express";
import { z } from "zod";
import { EmbedBuilder, TextChannel } from "discord.js";
import { config } from "../../config";
import { client } from "../../discord.bot";
import { ChannelNames, ErrorType, ErrorDetails, getErrorMessage } from "@clanscore/shared";
import { performSyncUsers } from "../../commands/user/syncusers";

export const webhookRouter = express.Router();

function verifySecret(req: express.Request): string | boolean {
    const token = req.header("x-webhook-token") ?? "";
    return config.WEBHOOK_SHARED_SECRET && token === config.WEBHOOK_SHARED_SECRET;
}

const UserStatusSchema = z.object({
  discordId: z.string().min(1),
  status: z.enum(["Accepted", "Denied"]),
  guildId: z.string().min(1).optional(), // API kann mitschicken; sonst DEFAULT_GUILD_ID
  roleName: z.string().min(1).optional(), // nur bei Accepted nötig
});

// POST /api/notifications/user-status
// Webhook-Endpoint: Wird von der clanscore-api aufgerufen, wenn eine Bewerbung akzeptiert/abgelehnt wird.
// Payload: { discordId, status: "Accepted"|"Denied", guildId?, roleName? }
// Effekt: Rolle setzen/entfernen & DM versenden.
webhookRouter.post("/user-status", async (req, res) => {
    try {
        if (!verifySecret(req)) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const body = UserStatusSchema.parse(req.body);
        const guildId = body.guildId ?? config.DISCORD_GUILD_ID;
        if (!guildId) return res.status(400).json({ error: "guildId required" });

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) return res.status(404).json({ error: "Guild not found" });

        const member = await guild.members.fetch(body.discordId).catch(() => null);
        if (!member) return res.status(404).json({ error: "Member not found" });

        if (body.status === "Accepted") {
            if (body.roleName) {
                const role = guild.roles.cache.find(r => r.name === body.roleName);
                if (!role) return res.status(404).json({ error: "Role not found" });
                await member.roles.add(role, "Application accepted");
            }

            try {
                await member.send(`✅ Hallo <@${member.id}>, deine Bewerbung wurde **angenommen**! Willkommen im Verein 🎉`);
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                const errorDetails: ErrorDetails = {
                    type: ErrorType.MessageNotSend,
                    details: {
                        message: `DM failed (Accepted): ${errorMessage}`,
                    }
                };
                getErrorMessage(errorDetails);
            }

            return res.json({ ok: true });
        }

        if (body.status === "Denied") {
            for (const name of ["Mitglied", "Vorstand"]) {
                const role = guild.roles.cache.find(r => r.name === name);
                if (role && member.roles.cache.has(role.id)) {
                await member.roles.remove(role, "Application denied").catch(() => {});
                }
            }

            try {
                await member.send(`🚫 Hallo <@${member.id}>, leider wurde deine Bewerbung **abgelehnt**. Falls du Fragen hast, melde dich beim Vorstand.`);
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                const errorDetails: ErrorDetails = {
                    type: ErrorType.MessageNotSend,
                    details: {
                        message: `DM failed (Denied): ${errorMessage}`,
                    }
                };
                getErrorMessage(errorDetails);
            }

            return res.json({ ok: true });
        }

        return res.status(400).json({ error: "Unsupported status" });
    } catch (err: any) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const errorDetails: ErrorDetails = {
            type: ErrorType.UnknownError,
            details: {
                message: `user-status error: ${errorMessage}`,
            }
        };
        getErrorMessage(errorDetails);
        if (err?.issues) {
            return res.status(400).json({ error: "ValidationError", details: err.issues });
        }
        return res.status(500).json({ error: "InternalError" });
    }
});

const RoleChangedSchema = z.object({
    discordId: z.string().min(1),
    username: z.string().min(1),
    guildId: z.string().min(1).optional(),
    addRoles: z.array(z.string()).optional().default([]),
    removeRoles: z.array(z.string()).optional().default([]),
    changedBy: z.string().optional(), // Wer hat die Änderung gemacht (z.B. Admin-Name)
});

// POST /api/notifications/role-changed
// Webhook-Endpoint: Wird von der clanscore-api aufgerufen, wenn Benutzerrollen im Dashboard geändert werden.
// Payload: { discordId, username, guildId?, addRoles: string[], removeRoles: string[], changedBy? }
// Effekt: Discord-Rollen setzen/entfernen & Benachrichtigung in Log-Channel senden.
webhookRouter.post("/role-changed", async (req, res) => {
    try {
        if (!verifySecret(req)) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const body = RoleChangedSchema.parse(req.body);
        const guildId = body.guildId ?? config.DISCORD_GUILD_ID;
        if (!guildId) return res.status(400).json({ error: "guildId required" });

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) return res.status(404).json({ error: "Guild not found" });

        const member = await guild.members.fetch(body.discordId).catch(() => null);
        if (!member) return res.status(404).json({ error: "Member not found" });

        const addedRoles: string[] = [];
        const removedRoles: string[] = [];
        const errors: string[] = [];

        for (const roleName of body.addRoles) {
            const role = guild.roles.cache.find(r => r.name === roleName);
            if (!role) {
                errors.push(`Rolle "${roleName}" nicht gefunden`);
                continue;
            }
            if (!member.roles.cache.has(role.id)) {
                try {
                    await member.roles.add(role, "Dashboard: Rolle hinzugefügt");
                    addedRoles.push(roleName);
                } catch (e) {
                    errors.push(`Fehler beim Hinzufügen von "${roleName}"`);
                }
            }
        }

        for (const roleName of body.removeRoles) {
            const role = guild.roles.cache.find(r => r.name === roleName);
            if (!role) {
                errors.push(`Rolle "${roleName}" nicht gefunden`);
                continue;
            }
            if (member.roles.cache.has(role.id)) {
                try {
                    await member.roles.remove(role, "Dashboard: Rolle entfernt");
                    removedRoles.push(roleName);
                } catch (e) {
                    errors.push(`Fehler beim Entfernen von "${roleName}"`);
                }
            }
        }

        if (addedRoles.length > 0 || removedRoles.length > 0) {
            const logChannel = guild.channels.cache.find(
                c => c.name === ChannelNames.BotLog
            ) as TextChannel | undefined;

            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setTitle("🔄 Rollenänderung (Dashboard)")
                    .setColor(0x3498db)
                    .addFields(
                        { name: "Benutzer", value: `<@${body.discordId}> (${body.username})`, inline: true },
                        { name: "Geändert von", value: body.changedBy ?? "Dashboard", inline: true },
                    )
                    .setTimestamp();

                if (addedRoles.length > 0) {
                    embed.addFields({
                        name: "➕ Hinzugefügt",
                        value: addedRoles.map(r => `\`${r}\``).join(", "),
                        inline: false,
                    });
                }

                if (removedRoles.length > 0) {
                    embed.addFields({
                        name: "➖ Entfernt",
                        value: removedRoles.map(r => `\`${r}\``).join(", "),
                        inline: false,
                    });
                }

                if (errors.length > 0) {
                    embed.addFields({
                        name: "⚠️ Fehler",
                        value: errors.join("\n"),
                        inline: false,
                    });
                }

                await logChannel.send({ embeds: [embed] }).catch( /* ignore */ );
            }
        }

        return res.json({
            ok: true,
            addedRoles,
            removedRoles,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (err: any) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const errorDetails: ErrorDetails = {
            type: ErrorType.UnknownError,
            details: {
                message: `role-changed error: ${errorMessage}`,
            }
        };
        getErrorMessage(errorDetails);
        if (err?.issues) {
            return res.status(400).json({ error: "ValidationError", details: err.issues });
        }
        return res.status(500).json({ error: "InternalError" });
    }
});

const RoleUpdatedSchema = z.object({
    guildId: z.string().min(1).optional(),
    oldName: z.string().min(1),
    newName: z.string().min(1),
    color: z.string().nullable().optional(),
    permissions: z.string().nullable().optional(),
    hoist: z.boolean().optional(),
    mentionable: z.boolean().optional(),
    changedBy: z.string().optional(),
});

// POST /api/notifications/role-updated
// Webhook-Endpoint: Wird aufgerufen wenn eine Rolle im Dashboard geändert wird (Name, Farbe, etc.)
// Payload: { guildId?, oldName, newName, color?, permissions?, hoist?, mentionable?, changedBy? }
// Effekt: Discord-Rolle aktualisieren & Log-Nachricht senden.
webhookRouter.post("/role-updated", async (req, res) => {
    try {
        if (!verifySecret(req)) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const body = RoleUpdatedSchema.parse(req.body);
        const guildId = body.guildId ?? config.DISCORD_GUILD_ID;
        if (!guildId) return res.status(400).json({ error: "guildId required" });

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) return res.status(404).json({ error: "Guild not found" });

        const role = guild.roles.cache.find(r => r.name === body.oldName);
        if (!role) {
            return res.status(404).json({ error: `Role "${body.oldName}" not found` });
        }

        const changes: string[] = [];

        try {
            const updateData: { name?: string; color?: number; hoist?: boolean; mentionable?: boolean } = {};

            if (body.newName !== body.oldName) {
                updateData.name = body.newName;
                changes.push(`Name: \`${body.oldName}\` → \`${body.newName}\``);
            }

            if (body.color !== undefined && body.color !== null) {
                const colorInt = parseInt(body.color.replace("#", ""), 16);
                if (!isNaN(colorInt) && role.hexColor !== body.color) {
                    updateData.color = colorInt;
                    changes.push(`Farbe: \`${role.hexColor}\` → \`${body.color}\``);
                }
            }

            if (body.hoist !== undefined && body.hoist !== role.hoist) {
                updateData.hoist = body.hoist;
                changes.push(`Hervorheben: \`${role.hoist}\` → \`${body.hoist}\``);
            }

            if (body.mentionable !== undefined && body.mentionable !== role.mentionable) {
                updateData.mentionable = body.mentionable;
                changes.push(`Erwähnbar: \`${role.mentionable}\` → \`${body.mentionable}\``);
            }

            if (Object.keys(updateData).length > 0) {
                await role.edit({ ...updateData, reason: "Dashboard: Rolle aktualisiert" });
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            const errorDetails: ErrorDetails = {
                type: ErrorType.RoleAssignmentFailed,
                details: {
                    message: `Error updating role: ${errorMessage}`,
                }
            };
            getErrorMessage(errorDetails);
            return res.status(500).json({ error: "Failed to update role" });
        }

        if (changes.length > 0) {
            const logChannel = guild.channels.cache.find(
                c => c.name === ChannelNames.BotLog
            ) as TextChannel | undefined;

            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setTitle("⚙️ Rolle aktualisiert (Dashboard)")
                    .setColor(0xf39c12)
                    .addFields(
                        { name: "Rolle", value: `\`${body.newName}\``, inline: true },
                        { name: "Geändert von", value: body.changedBy ?? "Dashboard", inline: true },
                        { name: "Änderungen", value: changes.join("\n"), inline: false },
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] }).catch( /* ignore */ );
            }
        }

        return res.json({ ok: true, changes });
    } catch (err: any) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const errorDetails: ErrorDetails = {
            type: ErrorType.UnknownError,
            details: {
                message: `role-updated error: ${errorMessage}`,
            }
        };
        getErrorMessage(errorDetails);
        if (err?.issues) {
            return res.status(400).json({ error: "ValidationError", details: err.issues });
        }
        return res.status(500).json({ error: "InternalError" });
    }
});

// POST /api/notifications/sync-users
// Webhook-Endpoint: Wird von der clanscore-api aufgerufen, um eine User-Synchronisierung durchzuführen (z.B. via Cron-Job).
// Payload: { guildId? }
// Effekt: Führt /syncusers aus und sendet Log-Nachricht.
webhookRouter.post("/sync-users", async (req, res) => {
    try {
        if (!verifySecret(req)) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const guildId = req.body.guildId ?? config.DISCORD_GUILD_ID;
        if (!guildId) return res.status(400).json({ error: "guildId required" });

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) return res.status(404).json({ error: "Guild not found" });

        const syncResult = await performSyncUsers(guild);
        if (!syncResult.ok) {
            return res.status(500).json({ 
                error: "Sync failed", 
                details: syncResult.error 
            });
        }

        return res.json({ 
            ok: true, 
            changes: syncResult.value.changes.length 
        });
    } catch (err: any) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const errorDetails: ErrorDetails = {
            type: ErrorType.UnknownError,
            details: {
                message: `sync-users error: ${errorMessage}`,
            }
        };
        getErrorMessage(errorDetails);
        return res.status(500).json({ error: "InternalError" });
    }
});
