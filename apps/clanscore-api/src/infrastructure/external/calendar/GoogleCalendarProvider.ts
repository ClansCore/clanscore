import { config } from "../../../config";
import { calendar_v3, google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { CalendarProvider } from "./CalendarProvider";
import { handleGoogleError } from "./googleUtils";
import {
    AuthToken,
    err,
    ErrorDetails,
    ErrorType,
    IEvent,
    ok,
    Result,
} from "@clanscore/shared";

export class GoogleCalendarProvider implements CalendarProvider {
    private getOAuth2Client(): Result<OAuth2Client, ErrorDetails> {
        try {
            const oauth2Client = new google.auth.OAuth2(
                config.GOOGLE_CALENDAR_CLIENT_ID,
                config.GOOGLE_CALENDAR_CLIENT_SECRET,
                config.GOOGLE_CALENDAR_REDIRECT_URI,
            );
            return ok(oauth2Client);
        } catch (error) {
            return handleGoogleError(error);
        }
    }

    private getCalendarClient(
        accessToken: string,
    ): Result<calendar_v3.Calendar, ErrorDetails> {
        const oauth2ClientResult = this.getOAuth2Client();
        if (!oauth2ClientResult.ok) return oauth2ClientResult;
        const oauth2Client = oauth2ClientResult.value;

        oauth2Client.setCredentials({ access_token: accessToken });

        const calendar = google.calendar({
            version: "v3",
            auth: oauth2Client,
        });

        return ok(calendar);
    }

    private mapGoogleEventToIEvent(
        googleEvent: calendar_v3.Schema$Event,
    ): IEvent {
        return {
            id: googleEvent.id!,
            summary: googleEvent.summary || null,
            description: googleEvent.description || null,
            startDate: new Date(
                googleEvent.start?.dateTime ?? googleEvent.start?.date ?? "",
            ),
            endDate: new Date(
                googleEvent.end?.dateTime ?? googleEvent.end?.date ?? "",
            ),
            location: googleEvent.location || null,
            recurringEventId: googleEvent.recurringEventId || null,
            recurrenceRule: googleEvent.recurrence?.[0] || "RRULE:FREQ=ONCE",
            updatedAt: googleEvent.updated ? new Date(googleEvent.updated) : undefined,
        };
    }

    private mapIEventToGoogleEvent(event: IEvent): calendar_v3.Schema$Event {
        return {
            summary: event.summary ?? undefined,
            description: event.description ?? undefined,
            location: event.location ?? undefined,
            start: {
                dateTime: event.startDate.toISOString(),
                timeZone: "UTC",
            },
            end: {
                dateTime: event.endDate.toISOString(),
                timeZone: "UTC",
            },
            recurrence: event.recurrenceRule
                ? [event.recurrenceRule]
                : undefined,
        };
    }

    async getRefreshedAccessToken(
        refreshToken: string,
    ): Promise<Result<AuthToken, ErrorDetails>> {
        try {
            const oauth2ClientResult = this.getOAuth2Client();
            if (!oauth2ClientResult.ok) return oauth2ClientResult;

            const oauth2Client = oauth2ClientResult.value;

            oauth2Client.setCredentials({
                refresh_token: refreshToken,
            });

            const tokens = await oauth2Client.refreshAccessToken();

            const newAccessToken = tokens.credentials.access_token;
            if (!newAccessToken) {
                return err(ErrorType.NotFound);
            }

            const expiresIn = tokens.credentials.expiry_date;
            const expirationTime = expiresIn
                ? new Date(expiresIn).getTime()
                : Date.now() + 3600 * 1000;

            return ok({
                accessToken: newAccessToken,
                refreshToken: refreshToken,
                expirationTime: expirationTime,
            });
        } catch (error) {
            return handleGoogleError(error);
        }
    }

    async getEvents(
        accessToken: string,
        maxResults: number,
        timeMaxMonths: number = 12, // Default: 1 year
    ): Promise<Result<IEvent[], ErrorDetails>> {
        try {
            const calendarResult = this.getCalendarClient(accessToken);
            if (!calendarResult.ok) return calendarResult;

            const calendar = calendarResult.value;

            const now = new Date();
            const timeMax = new Date(now);
            timeMax.setMonth(timeMax.getMonth() + timeMaxMonths);

            const response = await calendar.events.list({
                calendarId: "primary",
                timeMin: now.toISOString(),
                timeMax: timeMax.toISOString(),
                maxResults: maxResults,
                singleEvents: true,
                orderBy: "startTime",
            });

            const events: IEvent[] = (response.data.items || []).map(
                this.mapGoogleEventToIEvent,
            );

            return ok(events);
        } catch (error) {
            return handleGoogleError(error);
        }
    }

    async getMainRecurrenceEvent(
        accessToken: string,
        recurringEventId: string,
    ): Promise<Result<IEvent, ErrorDetails>> {
        try {
            const calendarResult = this.getCalendarClient(accessToken);
            if (!calendarResult.ok) return calendarResult;

            const calendar = calendarResult.value;

            const response = await calendar.events.get({
                calendarId: "primary",
                eventId: recurringEventId,
            });

            const event: IEvent = this.mapGoogleEventToIEvent(response.data);
            return ok(event);
        } catch (error) {
            return handleGoogleError(error);
        }
    }

    generateCalendarLinkUrl(guildId: string) {
        try {
            const oauth2ClientResult = this.getOAuth2Client();
            if (!oauth2ClientResult.ok) return oauth2ClientResult;

            const oauth2Client = oauth2ClientResult.value;

            return ok(
                oauth2Client.generateAuthUrl({
                    access_type: "offline",
                    scope: ["https://www.googleapis.com/auth/calendar"],
                    state: guildId,
                    prompt: "consent",
                }),
            );
        } catch (error) {
            return handleGoogleError(error);
        }
    }

    async getTokens(
        authCode: string,
    ): Promise<Result<AuthToken, ErrorDetails>> {
        try {
            const oauth2ClientResult = this.getOAuth2Client();
            if (!oauth2ClientResult.ok) return oauth2ClientResult;

            const oauth2Client = oauth2ClientResult.value;

            const { tokens } = await oauth2Client.getToken(authCode);

            if (!tokens.access_token || !tokens.refresh_token) {
                return err(ErrorType.CalenderProviderAuthenticationFailed);
            }

            const authTokens: AuthToken = {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expirationTime: tokens.expiry_date || Date.now() + 3600 * 1000, // Default 1 hour
            };

            return ok(authTokens);
        } catch (error) {
            return handleGoogleError(error);
        }
    }

    async createEvent(
        accessToken: string,
        event: IEvent,
    ): Promise<Result<IEvent, ErrorDetails>> {
        try {
            const calendarResult = this.getCalendarClient(accessToken);
            if (!calendarResult.ok) return calendarResult;

            const calendar = calendarResult.value;

            const response = await calendar.events.insert({
                calendarId: "primary",
                requestBody: this.mapIEventToGoogleEvent(event),
            });

            return ok(this.mapGoogleEventToIEvent(response.data));
        } catch (error) {
            return handleGoogleError(error);
        }
    }

    async updateEvent(
        accessToken: string,
        providerEventId: string,
        event: IEvent,
    ): Promise<Result<IEvent, ErrorDetails>> {
        try {
            const calendarResult = this.getCalendarClient(accessToken);
            if (!calendarResult.ok) return calendarResult;

            const calendar = calendarResult.value;

            const response = await calendar.events.update({
                calendarId: "primary",
                eventId: providerEventId,
                requestBody: this.mapIEventToGoogleEvent(event),
            });

            return ok(this.mapGoogleEventToIEvent(response.data));
        } catch (error) {
            return handleGoogleError(error);
        }
    }

    async deleteEvent(
        accessToken: string,
        providerEventId: string,
    ): Promise<Result<boolean, ErrorDetails>> {
        try {
            const calendarResult = this.getCalendarClient(accessToken);
            if (!calendarResult.ok) return calendarResult;

            const calendar = calendarResult.value;

            await calendar.events.delete({
                calendarId: "primary",
                eventId: providerEventId,
            });

            return ok(true);
        } catch (error) {
            return handleGoogleError(error);
        }
    }
}
