export type CalendarDTO = {
    id: string;
    guildId: string;
    accessToken: string;
    refreshToken: string;
    expirationTime: number;
    eventOverviewMessageId?: string | null;
};

export type CalendarCreateDTO = Omit<CalendarDTO, "id">;

export type CalendarUpdateDTO = Partial<CalendarCreateDTO>;

export type CalendarLinkUrlDTO = { url: string };
