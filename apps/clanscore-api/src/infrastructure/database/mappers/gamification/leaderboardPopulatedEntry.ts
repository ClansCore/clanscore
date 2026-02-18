import { LeaderboardRankingEntryDTO } from "@clanscore/shared";
import { PopulatedLeaderboardEntry } from "../../../../domain/gamification/LeaderboardEntry";

export function mapPopulatedToDTO(
    entry: PopulatedLeaderboardEntry,
): LeaderboardRankingEntryDTO {
    return {
        id: entry._id.toString(),
        leaderboardId: entry.leaderboardId.toString(),
        person: {
            id: entry.personId._id.toString(),
            nickname: entry.personId.nickname ?? null,
        },
        score: entry.score,
    };
}
