import { CalendarDTO } from "@clanscore/shared";
import type { ICalendar } from "../../../../domain/event/Calendar";

export type CalendarEntity = {
    _id: string;
    guildId: string;
    // Tokens nie direkt an den Bot/API-Client rausgeben!
    accessToken: string;
    refreshToken: string;
    expirationTime: number;
    eventOverviewMessageId?: string | null;
};

export const toCalendarEntity = (doc: ICalendar): CalendarEntity => ({
    _id: doc._id.toString(),
    guildId: doc.guildId,
    accessToken: doc.accessToken,
    refreshToken: doc.refreshToken,
    expirationTime: doc.expirationTime,
    eventOverviewMessageId: doc.eventOverviewMessageId ?? null
});

export function toCalendarDTO(entity: CalendarEntity): CalendarDTO {
    return {
        id: entity._id,
        guildId: entity.guildId,
        accessToken: entity.accessToken,
        refreshToken: entity.refreshToken,
        expirationTime: entity.expirationTime,
        eventOverviewMessageId: entity.eventOverviewMessageId ?? null,
    };
}
