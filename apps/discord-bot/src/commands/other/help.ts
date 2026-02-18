import { MessageFlags, SlashCommandBuilder, GuildMember } from "discord.js";
import { CommandInteraction } from "discord.js";
import { config } from "../../config";

export const data = new SlashCommandBuilder()
    .setName("help")
    .setDescription(
        "Zeigt eine Übersicht aller verfügbaren Befehle und deren Beschreibung.",
    );

export async function execute(interaction: CommandInteraction) {
    const member = interaction.member as GuildMember;
    const isVorstand = member.roles.cache.some(
        (role) => role.name.toLowerCase() === "vorstand",
    );

    const MANUAL_URI = config.MANUAL_URL;

    let helpText = `
**Hilfe - Verfügbare Befehle:**

Hier geht es zum [Benutzerhandbuch](${MANUAL_URI})

📥  \`/join\` - Bewirb dich als Vereinsmitglied. 

📅  \`/events\` - Zeigt dir die bevorstehenden Vereins-Events. 

⭐  \`/score\` - Zeigt deinen aktuellen Punktestand. 

✅  \`/completetask\` - Markiert eine Aufgabe als erledigt. 

🎁  \`/rewards\` - Zeigt alle verfügbaren Belohnungen für Punkte. 

🧠  \`/getdata\` - Zeigt deine gespeicherten Daten aus der Datenbank. 

📤  \`/leave\` - Austritt aus dem Verein.
\n`;

    if (isVorstand) {
        helpText += `\n
**Vorstands-Befehle:**

💰  \`/donation\` - Protokolliere eine Spende. 

📝  \`/createtask\` - Erstelle eine Aufgabe. 

📚  \`/statustasks\` - Zeigt den jeweiligen Stand aller Aufgaben.

🏆  \`/createleaderboard\` - Erstelle eine Rangliste. 


**Admin-Befehle:**

📆  \`/linkcalendar\` - Verknüpfe den Vereins-Kalender. 

📊  \`/synccalendar\` - Synchronisiere Kalender-Events. 

🛡️  \`/syncroles\` - Synchronisiere Rollen mit der Datenbank. 

👥  \`/syncusers\` - Synchronisiere Mitglieder mit der Datenbank.
\n`;
    }

    await interaction.reply({
        content: helpText,
        flags: MessageFlags.Ephemeral,
    });
}
