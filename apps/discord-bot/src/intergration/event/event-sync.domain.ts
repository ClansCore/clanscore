// import { err, ErrorDetails, ErrorType, IEvent, ok, Result } from "@clanscore/shared";
// import {
//     DiscordAPIError,
//     Guild,
//     GuildScheduledEvent,
//     GuildScheduledEventCreateOptions,
// } from "discord.js";
// import { api } from "../../api/apiClient";
// import { buildEventDetails, mapGuildEventToIEvent, mapIEventToDiscordEventOptions } from "./event-discord.mapper";

// async function getProviderAndToken(guildId: string) {
//     const calendarProvider = getCalendarProvider("google");
//     if (!calendarProvider.ok) return calendarProvider;
//     if (!guildId) return err(ErrorType.GuildNotFound);
//     const accessTokenResult = await getValidAccessToken(
//         guildId,
//         calendarProvider.value,
//     );
//     if (!accessTokenResult.ok) return accessTokenResult;
//     return ok({
//         calendarProvider: calendarProvider.value,
//         accessToken: accessTokenResult.value,
//     });
// }

// export async function syncDiscordAndCalendarEvents(
//     guild: Guild,
//     calendarProvider: CalendarProvider,
//     accessToken: string,
// ): Promise<Result<boolean, ErrorDetails>> {
//     const providerEventsResult = await calendarProvider.getEvents(
//         accessToken,
//         5,
//     );
//     if (!providerEventsResult.ok) return providerEventsResult;

//     const providerEvents = providerEventsResult.value;
//     const discordEvents = await guild.scheduledEvents.fetch();

//     const allSavedResult = await api.getAllEventDetails();
//     if (!allSavedResult.ok) return allSavedResult;

//     const handledRecurring = new Set<string>();

//     for (let event of providerEvents) {
//         const recurringId = event.recurringEventId ?? event.id;

//         if (event.recurringEventId && !handledRecurring.has(recurringId)) {
//             const mainEventResult =
//                 await calendarProvider.getMainRecurrenceEvent(
//                     accessToken,
//                     event.recurringEventId,
//                 );
//             if (!mainEventResult.ok) continue;
//             event.recurrenceRule = mainEventResult.value.recurrenceRule;
//             event.id = mainEventResult.value.id;
//         } else if (handledRecurring.has(recurringId)) {
//             continue;
//         }
//         handledRecurring.add(recurringId);

//         const matched = allSavedResult.value.find(
//             (e) => e.providerEventId === event.id,
//         );

//         const discordEvent = discordEvents.find(
//             (e) => e.id === matched?.discordEventId,
//         );

//         const discordOptions = mapIEventToDiscordEventOptions(
//             event,
//             event.recurrenceRule ?? null,
//         );

//         try {
//             if (matched) {
//                 if (discordEvent) {
//                     await discordEvent.edit(discordOptions);
//                     const updated = buildEventDetails(event, discordEvent.id);
//                     await api.updateEventDetails(updated);
//                 }
//             } else {
//                 const created =
//                     await guild.scheduledEvents.create(discordOptions);
//                 const newDetails = buildEventDetails(event, created.id);
//                 await api.createEventDetails(newDetails);
//             }
//         } catch (error) {
//             Create the event without recurrence rule, when recurrence format not supported by discord
//             if (error instanceof DiscordAPIError && error.code === 50035) {
//                 if (matched) {
//                     if (discordEvent) {
//                         const editIndividualEventResult =
//                             await editRecurrentEventIndividually(
//                                 discordEvent,
//                                 event,
//                                 discordOptions,
//                             );
//                         if (!editIndividualEventResult.ok)
//                             return editIndividualEventResult;
//                         return ok(true);
//                     }
//                 } else {
//                     const createIndividualEventResult =
//                         await createRecurrentEventIndividually(
//                             guild,
//                             event,
//                             discordOptions,
//                         );
//                     if (!createIndividualEventResult.ok)
//                         return createIndividualEventResult;
//                     return ok(true);
//                 }
//             }

//             return err(ErrorType.DiscordGuildEventInvalidFormBody);
//         }
//     }

//     return ok(true);
// }

// async function createRecurrentEventIndividually(
//     guild: Guild,
//     event: IEvent,
//     discordOptions: GuildScheduledEventCreateOptions,
// ) {
//     try {
//         discordOptions.recurrenceRule = undefined;
//         event.recurrenceRule = "RRULE:FREQ=DAILY";
//         const created = await guild.scheduledEvents.create(discordOptions);
//         const newDetails = buildEventDetails(event, created.id);
//         await api.createEventDetails(newDetails);
//     } catch (error) {
//         return err(ErrorType.DiscordGuildEventInvalidFormBody);
//     }

//     return ok(undefined);
// }

// async function editRecurrentEventIndividually(
//     discordEvent: GuildScheduledEvent,
//     event: IEvent,
//     discordOptions: GuildScheduledEventCreateOptions,
// ) {
//     try {
//         discordOptions.recurrenceRule = undefined;
//         event.recurrenceRule = "RRULE:FREQ=DAILY";
//         await discordEvent.edit(discordOptions);
//         const updated = buildEventDetails(event, discordEvent.id);
//         await api.updateEventDetails(updated);
//     } catch (error) {
//         return err(ErrorType.DiscordGuildEventInvalidFormBody);
//     }

//     return ok(undefined);
// }

// export async function createCalendarProviderEventFromDiscord(
//     event: GuildScheduledEvent,
// ): Promise<Result<void, ErrorDetails>> {
//     const providerResult = await getProviderAndToken(event.guildId!);
//     if (!providerResult.ok) return providerResult;
//     const { calendarProvider, accessToken } = providerResult.value;
//     const mapped = mapGuildEventToIEvent(event);
//     const created = await calendarProvider.createEvent(accessToken, mapped);
//     if (!created.ok) return created;

//     const newDetails = buildEventDetails(created.value, event.id);
//     const saveResult = await api.createEventDetails(newDetails);
//     if (!saveResult.ok) return saveResult;
//     return ok(undefined);
// }

// export async function updateCalendarProviderEventFromDiscord(
//     event: GuildScheduledEvent,
// ): Promise<Result<void, ErrorDetails>> {
//     const existing = await api.getEventDetailsByDiscordEventId(event.id);
//     if (!existing.ok) return existing;
//     const providerResult = await getProviderAndToken(event.guildId!);
//     if (!providerResult.ok) return providerResult;
//     const { calendarProvider, accessToken } = providerResult.value;
//     const mapped = mapGuildEventToIEvent(event);
//     const updated = await calendarProvider.updateEvent(
//         accessToken,
//         existing.value.providerEventId,
//         mapped,
//     );
//     if (!updated.ok) return updated;

//     const updatedDetails = buildEventDetails(updated.value, event.id);
//     const saveResult = await api.updateEventDetails(updatedDetails);
//     if (!saveResult.ok) return saveResult;
//     return ok(undefined);
// }
