import {
    CommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
} from "discord.js";
import { replyWithDeferredError } from "../../errors/dsicordAdapter";
import { withRoleAccess } from "../../utils-discord/accessControl";
import { api } from "../../api/apiClient";

export const data = new SlashCommandBuilder()
    .setName("getdata")
    .setDescription("Zeigt deine gespeicherten Daten aus der Datenbank.");

export async function handleGetDataCommand(
    interaction: CommandInteraction,
): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const userDiscordId = interaction.user.id;

    const personDataResult = await api.getPersonDataByDiscordId(userDiscordId);
    if (!personDataResult.ok) {
        await replyWithDeferredError(interaction, personDataResult.error);
        return;
    }
    const {
        person,
        roles: roleAssignments,
        tasks: taskParticipants,
        donations: donationHistory,
        rewards,
        leaderboardEntries,
        transactions,
    } = personDataResult.value;

    const roles =
        roleAssignments.length > 0
            ? roleAssignments
                  .map((userRole) => userRole.role.name)
                  .join(", ")
            : "Keine";

    const tasks =
        taskParticipants.length > 0
            ? taskParticipants
                  .map(
                      (task) =>
                          `${task.taskId || "Unbekannt"} (Abgeschlossen: ${task.completedByParticipant ?? false})`,
                  )
                  .join("\n")
            : "Keine";

    const donations =
        donationHistory.length > 0
            ? donationHistory
                  .map((donation) => {
                      const dateLabel = donation.date
                          ? new Date(donation.date).toISOString()
                          : "Unbekanntes Datum";
                      return `${donation.amount} CHF am ${dateLabel}`;
                  })
                  .join("\n")
            : "Keine";

    const rewardsLabel =
        rewards.length > 0
            ? rewards.map((reward) => reward.name || "Unbekannt").join(", ")
            : "Keine";

    const leaderboardEntriesLabel =
        leaderboardEntries.length > 0
            ? leaderboardEntries
                  .map(
                      (entry) =>
                          `${entry.leaderboardId || "Unbekannt"}: ${entry.score} Punkte`,
                  )
                  .join("\n")
            : "Keine";

    const transactionsLabel =
        transactions.length > 0
            ? transactions
                  .map((tx) => {
                      const sign = tx.rewardId ? "-" : "+";
                      const absAmount = Math.abs(tx.amount);
                      return `${sign}${absAmount} Punkte (${tx.status})`;
                  })
                  .join("\n")
            : "Keine";

    const embed = new EmbedBuilder()
        .setTitle(`📊 Aktuelle Daten aus der Datenbank über ${person.nickname}`)
        .setColor(0x00ff00)
        .addFields(
            {
                name: "Name",
                value: String(`${person.firstName} ${person.lastName}`),
                inline: false,
            }, {
                name: "Nickname",
                value: String(person.nickname || "None"),
                inline: false,
            }, {
                name: "Discord-ID",
                value: String(person.discordId || "None"),
                inline: false,
            }, {
                name: "Geburtsdatum",
                value: person.birthdate
                    ? person.birthdate.toString()
                    : "None",
                inline: false,
            }, {
                name: "Adresse",
                value: String(person.address || "None"),
                inline: false,
            }, {
                name: "Email",
                value: String(person.email || "None"),
                inline: false,
            }, {
                name: "Telefonnummer",
                value: String(person.phone || "None"),
                inline: false,
            }, { 
                name: "Rollen", 
                value: String(roles), 
                inline: false,
            }, {
                name: "Punkte-Konto",
                value: String(person.score || 0),
                inline: false,
            }, {
                name: "Aufgaben",
                value: String(tasks),
                inline: false,
            }, {
                name: "Spenden",
                value: String(donations),
                inline: false,
            }, {
                name: "Belohnungen",
                value: String(rewardsLabel),
                inline: false,
            }, {
                name: "Ranglisten-Einträge",
                value: String(leaderboardEntriesLabel),
                inline: false,
            }, {
                name: "Transaktionen",
                value: String(transactionsLabel),
                inline: false,
            },
        )
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

export const execute = withRoleAccess(handleGetDataCommand, [
    "Vorstand",
    "Mitglied",
]);
