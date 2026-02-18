import { ISODate } from "./common.js";

/**
 * Raw Discord scheduled event data as received from the Discord bot.
 * This matches the serialized GuildScheduledEvent object.
 * Note: scheduledStartAt/scheduledEndAt are getters in Discord.js and won't serialize,
 * so we also support scheduledStartTimestamp/scheduledEndTimestamp as fallbacks.
 */
export interface DiscordScheduledEventData {
    id: string;
    name: string;
    description?: string | null;
    scheduledStartAt?: string | null;
    scheduledEndAt?: string | null;
    scheduledStartTimestamp?: number | null;
    scheduledEndTimestamp?: number | null;
    entityMetadata?: {
        location?: string | null;
    } | null;
    recurrenceRule?: {
        frequency?: number;
        interval?: number;
        count?: number | null;
        byNWeekday?: Array<{ day: number; n: number }> | null;
        byWeekday?: number[] | null;
        byMonth?: number[] | null;
        byMonthDay?: number[] | null;
    } | null;
}

// Provider-agnostic event format
export interface IEvent {
    id: string;
    summary?: string | null | undefined;
    description?: string | null | undefined;
    startDate: Date;
    endDate: Date;
    location?: string | null | undefined;
    recurringEventId?: string | null | undefined;
    recurrenceRule?: string | undefined;
    updatedAt?: Date | undefined;
}

// Provider-agnostic token format
export interface AuthToken {
    accessToken: string;
    refreshToken: string;
    expirationTime: number;
}

export type EventDetailsDTO = {
    id: string;
    providerEventId: string;
    discordEventId: string;
    name: string;
    description?: string | null;
    startDate: Date;
    endDate: Date;
    location?: string | null;
    // grosse Binärdaten nicht über DTO ausgeben -> separat laden, wenn nötig
    recurringEventId?: string | null;
    recurrenceRule?: string | null;
    // For recurring events: ID of the Discord master event (the one with recurrence rule)
    // Individual instances that are edited become exceptions with their own discordEventId
    discordMasterEventId?: string | null;
    updatedAt?: Date;
};

export type EventParticipantDTO = {
    id: string;
    registrationDate: ISODate;
    personId: string;
    eventId: string;
};

export type EventDetailsCreateDTO = Omit<EventDetailsDTO, "id">;

export type EventDetailsUpdateDTO = Partial<EventDetailsCreateDTO>;

export type EventParticipantCreateDTO = Omit<EventParticipantDTO, "id">;
