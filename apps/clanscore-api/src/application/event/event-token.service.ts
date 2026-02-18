import { getCalendarProvider } from "../../infrastructure/external/calendar";
import { CalendarProvider } from "../../infrastructure/external/calendar/CalendarProvider";
import {
    Result,
    ok,
    err,
    ErrorDetails,
    ErrorType,
} from "@clanscore/shared";
import { EventModel } from "./event.model";
import { config } from "../../config";

export async function getValidAccessToken(
    guildId: string,
    calendarProvider: CalendarProvider,
): Promise<Result<string, ErrorDetails>> {
    const calendarInfoResult = await EventModel.getCalendarInfo(guildId);

    if (!calendarInfoResult.ok) return calendarInfoResult;

    const { accessToken, refreshToken, expirationTime } =
        calendarInfoResult.value;

    if (expirationTime > Date.now()) {
        return ok(accessToken);
    }

    return await refreshAccessToken(refreshToken, guildId, calendarProvider);
}

async function refreshAccessToken(
    refreshToken: string,
    guildId: string,
    calendarProvider: CalendarProvider,
): Promise<Result<string, ErrorDetails>> {
    try {
        const refreshed =
            await calendarProvider.getRefreshedAccessToken(refreshToken);
        if (!refreshed.ok) return refreshed;

        const {
            accessToken,
            refreshToken: newRefresh,
            expirationTime,
        } = refreshed.value;

        const saved = await EventModel.saveCalendarInfo(
            guildId,
            accessToken,
            newRefresh,
            expirationTime,
        );
        if (!saved.ok) return saved;

        return ok(accessToken);
    } catch {
        return err(ErrorType.UnknownError);
    }
}

export async function saveTokensFromOAuthCallback(
    authCode: string,
): Promise<Result<boolean, ErrorDetails>> {
    const calendarProvider = getCalendarProvider("google");
    if (!calendarProvider.ok) {
        return calendarProvider;
    }

    const tokens = await calendarProvider.value.getTokens(authCode);
    if (!tokens.ok) {
        return tokens;
    }

    const savedCalendarInfo = await EventModel.saveCalendarInfo(
        config.DISCORD_GUILD_ID,
        tokens.value.accessToken,
        tokens.value.refreshToken,
        tokens.value.expirationTime,
    );

    if (!savedCalendarInfo.ok) {
        return savedCalendarInfo;
    }

    return ok(true);
}
