import { AuthToken, ErrorDetails, IEvent, Result } from "@clanscore/shared";

export interface CalendarProvider {
    /**
     * Refreshes the access token using a provided refresh token.
     *
     * @param refreshToken - The token used to obtain a new access token.
     * @returns A promise that resolves to a Result containing either the new AuthToken or ErrorDetails.
     */
    getRefreshedAccessToken(
        refreshToken: string,
    ): Promise<Result<AuthToken, ErrorDetails>>;

    /**
     * Retrieves calendar events using a valid access token.
     *
     * @param accessToken - The access token used to authenticate the request.
     * @param maxResults - The maximum number of events to retrieve.
     * @param timeMaxMonths - Optional: Maximum time range in months from now (default: 12 = 1 year)
     * @returns A promise that resolves to a Result containing an array of IEvent objects or ErrorDetails.
     */
    getEvents(
        accessToken: string,
        maxResults: number,
        timeMaxMonths?: number,
    ): Promise<Result<IEvent[], ErrorDetails>>;

    /**
     * Retrieves the main recurring event instance associated with a specific recurrence ID.
     *
     * @param accessToken - The access token used to authenticate the request.
     * @param recurringEventId - The ID of the recurring event series.
     * @returns A promise that resolves to a Result containing the main IEvent instance or ErrorDetails.
     */
    getMainRecurrenceEvent(
        accessToken: string,
        recurringEventId: string,
    ): Promise<Result<IEvent, ErrorDetails>>;

    /**
     * Generates a URL link for connecting a calendar to a specific guild.
     *
     * @param guildId - The unique identifier of the guild.
     * @returns A Result containing the generated calendar link URL or ErrorDetails.
     */
    generateCalendarLinkUrl(guildId: string): Result<string, ErrorDetails>;

    /**
     * Exchanges an authorization code for access and refresh tokens.
     *
     * @param authCode - The authorization code received from the OAuth flow.
     * @returns A promise that resolves to a Result containing the AuthToken or ErrorDetails.
     */
    getTokens(authCode: string): Promise<Result<AuthToken, ErrorDetails>>;

    /**
     * Create a new event in the calendar provider.
     *
     * @param authCode - The access token used to authenticate the request.
     * @param event - The event to create.
     * @returns A promise that resolves to a Result containing the event.
     */
    createEvent(
        accessToken: string,
        event: IEvent,
    ): Promise<Result<IEvent, ErrorDetails>>;

    /**
     * Update a already existing event in the calendar provider.
     *
     * @param accessToken - The access token used to authenticate the request.
     * @param providerEventId - The id of the event to update.
     * @param event - The new details of the event.
     * @returns A promise that resolves to a Result containing the event.
     */
    updateEvent(
        accessToken: string,
        providerEventId: string,
        event: IEvent,
    ): Promise<Result<IEvent, ErrorDetails>>;

    /**
     * Delete an event from the calendar provider.
     *
     * @param accessToken - The access token used to authenticate the request.
     * @param providerEventId - The id of the event to delete.
     * @returns A promise that resolves to a Result containing true on success.
     */
    deleteEvent(
        accessToken: string,
        providerEventId: string,
    ): Promise<Result<boolean, ErrorDetails>>;
}
