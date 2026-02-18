import { GuildScheduledEvent, TextChannel, EmbedBuilder } from "discord.js";
import { getChannelByName } from "../../utils-discord/guild";
import { config } from "../../config";
import { AuthToken, ChannelNames, err, ErrorDetails, ErrorType, IEvent, ok, Result } from "@clanscore/shared";
import { api } from "../../api/apiClient";
import { formatEvents } from "./event-format.service";

export async function sendEventOverviewToChannel(): Promise<
    Result<boolean, ErrorDetails>
> {
    const eventsResult = await api.getUpcomingEvents(5);
    if (!eventsResult.ok) return eventsResult;

    if (!eventsResult.value || eventsResult.value.length === 0) {
        return ok(true);
    }

    const formatted = formatEvents(eventsResult.value);
    if (!formatted.ok) return formatted;

    const channelResult = await getChannelByName(
        config.DISCORD_GUILD_ID,
        ChannelNames.EVENTS,
    );
    if (!channelResult.ok) return channelResult;

    try {
        const channel = channelResult.value as TextChannel;
        const newEmbed = formatted.value;

        const calendarInfoResult = await api.getCalendarInfo(config.DISCORD_GUILD_ID);
        let existingMessageId: string | null = null;
        
        if (calendarInfoResult.ok && calendarInfoResult.value.eventOverviewMessageId) {
            existingMessageId = calendarInfoResult.value.eventOverviewMessageId;
        }

        if (existingMessageId) {
            try {
                const existingMessage = await channel.messages.fetch(existingMessageId);
                
                // Compare embed content by checking if all relevant embed data matches
                const existingEmbed = existingMessage.embeds[0];
                const newEmbedData = newEmbed.toJSON();
                
                if (existingEmbed) {
                    const titleMatches = existingEmbed.title === newEmbedData.title;
                    const descriptionMatches = existingEmbed.description === newEmbedData.description;
                    const colorMatches = existingEmbed.color === newEmbedData.color;
                    const fieldsMatch = JSON.stringify(existingEmbed.fields || []) === JSON.stringify(newEmbedData.fields || []);
                    
                    if (titleMatches && descriptionMatches && colorMatches && fieldsMatch) {
                        return ok(true);
                    }
                }

                await existingMessage.edit({ embeds: [newEmbed] });
                return ok(true);
            } catch (error) {
                existingMessageId = null;
            }
        }

        if (!existingMessageId) {
            const oldMessages = await channel.messages.fetch({ limit: 10 });
            if (oldMessages.size > 0) {
                await channel.bulkDelete(oldMessages, true);
            }

            const sentMessage = await channel.send({ embeds: [newEmbed] });
            await api.saveEventOverviewMessageId(config.DISCORD_GUILD_ID, sentMessage.id);
        }
    } catch (error) {
        return err(ErrorType.MessageNotSend);
    }

    return ok(true);
}
