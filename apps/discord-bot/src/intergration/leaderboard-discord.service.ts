import { ChannelNames, err, ErrorDetails, ErrorType, LeaderboardRankingEntryDTO, ok, Result } from "@clanscore/shared";
import { getChannelByName } from "../utils-discord/guild";
import { EmbedBuilder, TextChannel } from "discord.js";
import { config } from "../config";
import { api } from "../api/apiClient";

async function buildLeaderboardEmbed(
    title: string,
    entries: LeaderboardRankingEntryDTO[],
    startDate: string,
    endDate: string,
): Promise<EmbedBuilder> {
    const embed = new EmbedBuilder()
        .setTitle(`🏆 ${title}`)
        .setColor(0xffd900)
        .setTimestamp();

    if (entries.length === 0) {
        embed.setDescription("📊 **Rangliste**\n\nNoch keine Einträge\n*Sei der Erste, der punktet!*");
        return embed;
    }

    const sorted = [...entries].sort((a, b) => b.score - a.score);

    let lastScore: number | null = null;
    let currentRank = 0;
    let displayRank = 0;

    const formattedPromises = sorted.map(async (entry) => {
        currentRank++;
        if (entry.score !== lastScore) {
            displayRank = currentRank;
            lastScore = entry.score;
        }

        const medal =
            displayRank === 1
                ? "🥇"
                : displayRank === 2
                  ? "🥈"
                  : displayRank === 3
                    ? "🥉"
                    : `**${displayRank}.**`;

        let displayName = "Unbekannt";
        if (entry.person?.id) {
            const personResult = await api.getPersonById(entry.person.id);
            if (personResult.ok && personResult.value.discordId) {
                displayName = `<@${personResult.value.discordId}>`;
            } else if (entry.person && typeof entry.person.nickname === "string") {
                displayName = entry.person.nickname;
            }
        } else if (entry.person && typeof entry.person.nickname === "string") {
            displayName = entry.person.nickname;
        }

        const scoreFormatted = entry.score.toLocaleString("de-CH");
        
        return `${medal} ${displayName} - **${scoreFormatted}** Punkte`;
    });

    const formatted = (await Promise.all(formattedPromises)).join("\n");

    const startDateFormatted = new Date(startDate).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
    const endDateFormatted = new Date(endDate).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
    
    const dateRange = `Zeitraum: ${startDateFormatted} - ${endDateFormatted}`;

    embed.setDescription(`${dateRange}\n\n${formatted}`);
    return embed;
}

async function buildWinnersEmbed(
    leaderboards: Array<{ name: string; startDate: string; endDate: string }>,
    winners: Array<{ leaderboardName: string; winner: LeaderboardRankingEntryDTO | null }>,
): Promise<EmbedBuilder> {
    const embed = new EmbedBuilder()
        .setTitle("🎉 RANGLISTEN-SIEGER 🎉")
        .setColor(0xff0000)
        .setTimestamp();

    if (winners.length === 0 || winners.every(w => w.winner === null)) {
        embed.setDescription("Noch keine Einträge in den Ranglisten.");
        return embed;
    }

    const formattedPromises = winners
        .filter(w => w.winner !== null)
        .map(async ({ leaderboardName, winner }) => {
            if (!winner) return null;
            
            let displayName = "Unbekannt";
            if (winner.person?.id) {
                const personResult = await api.getPersonById(winner.person.id);
                if (personResult.ok && personResult.value.discordId) {
                    displayName = `<@${personResult.value.discordId}>`;
                } else if (winner.person && typeof winner.person.nickname === "string") {
                    displayName = winner.person.nickname;
                }
            } else if (winner.person && typeof winner.person.nickname === "string") {
                displayName = winner.person.nickname;
            }
            
            const scoreFormatted = winner.score.toLocaleString("de-CH");
            
            return `**${leaderboardName}**\n🥇 ${displayName} - **${scoreFormatted}** Punkte`;
        });

    const formattedResults = await Promise.all(formattedPromises);
    const formatted = formattedResults
        .filter((line): line is string => line !== null)
        .join("\n\n");

    embed.setDescription(`\n${formatted}`);
    return embed;
}

export async function updateLeaderboards(): Promise<
    Result<undefined, ErrorDetails>
> {
    const activeLeaderboardsResult = await api.getActiveLeaderboards();
    if (!activeLeaderboardsResult.ok) return activeLeaderboardsResult;

    const embeds: EmbedBuilder[] = [];
    const winners: Array<{ leaderboardName: string; winner: LeaderboardRankingEntryDTO | null }> = [];

    for (const lb of activeLeaderboardsResult.value) {
        const rankingResult = await api.getLeaderboardRanking(
            lb.id,
            lb.numberVisibleEntries,
        );
        if (!rankingResult.ok) return rankingResult;

        embeds.push(await buildLeaderboardEmbed(lb.name, rankingResult.value, lb.startDate, lb.endDate));

        const sorted = [...rankingResult.value].sort((a, b) => b.score - a.score);
        const winner = sorted.length > 0 ? sorted[0] : null;
        winners.push({
            leaderboardName: lb.name,
            winner: winner,
        });
    }

    embeds.push(await buildWinnersEmbed(activeLeaderboardsResult.value, winners));

    const channelResult = await getChannelByName(
        config.DISCORD_GUILD_ID,
        ChannelNames.LEADERBOARDS,
    );
    if (!channelResult.ok) return channelResult;

    try {
        const channel = channelResult.value as TextChannel;
        const oldMessages = await channel.messages.fetch({ limit: 1 });
        await channel.bulkDelete(oldMessages, true);
        await channel.send({ embeds });
    } catch {
        return err(ErrorType.MessageNotSend);
    }

    return ok(undefined);
}

export async function acceptRewardClaim(transactionId: string) {
    const result = await api.acceptRewardClaim(transactionId);
    if (!result.ok) {
        return result;
    }
    return ok(result.value);
}

export async function denyRewardClaim(transactionId: string) {
    const result = await api.denyRewardClaim(transactionId);
    if (!result.ok) {
        return result;
    }
    return ok(result.value);
}
