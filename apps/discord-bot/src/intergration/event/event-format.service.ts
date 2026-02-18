import { EventDetailsDTO, Result, ok } from "@clanscore/shared";
import { EmbedBuilder } from "discord.js";

export function formatEvents(events: EventDetailsDTO[]): Result<EmbedBuilder> {
    const embed = new EmbedBuilder()
        .setTitle("🗓️  ÜBERSICHT  DER  KOMMENDEN  EVENTS\n------------------------------------------------")
        .setColor(0x34dbca)
        .setTimestamp();

    if (!events || events.length === 0) {
        embed.setDescription("📭 **Keine kommenden Events gefunden.**");
        return ok(embed);
    }

    const formatter = new Intl.DateTimeFormat("de-CH", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    });

    const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

    for (const event of events) {
        const date = formatter.format(new Date(event.startDate));
        const location = event.location || "Unbekannter Ort";
        const summary = event.name || "Ohne Titel";

        fields.push({
            name: "",
            value: "",
            inline: true,
        });

        fields.push({
            name: summary,
            value: `📅 ${date} Uhr\n📍 ${location}`,
            inline: false,
        });
    }

    embed.addFields(fields);

    return ok(embed);
}
