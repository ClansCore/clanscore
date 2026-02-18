import { createAction, props } from '@ngrx/store';
import { GuildEvent } from '../../../core/models/domain/event.model';

export const getEvents = createAction('[Event] GetEvents');
export const getEventsSuccess = createAction('[Event] GetEvents Success', props<{ events: GuildEvent[] }>());
export const getEventsFailure = createAction('[Event] GetEvents Failure', props<{ error: string }>());

export const addEvent = createAction('[Event] AddEvent', props<{ event: GuildEvent }>());
export const addEventSuccess = createAction('[Event] AddEvent Success', props<{ event: GuildEvent }>());
export const addEventFailure = createAction('[Event] AddEvent Failure', props<{ error: string }>());

export const updateEvent = createAction('[Event] UpdateEvent', props<{ event: GuildEvent }>());
export const updateEventSuccess = createAction('[Event] UpdateEvent Success', props<{ event: GuildEvent }>());
export const updateEventFailure = createAction('[Event] UpdateEvent Failure', props<{ error: string }>());

export const deleteEvent = createAction('[Event] DeleteEvent', props<{ event: GuildEvent }>());
export const deleteEventSuccess = createAction('[Event] DeleteEvent Success', props<{ event: GuildEvent }>());
export const deleteEventFailure = createAction('[Event] DeleteEvent Failure', props<{ error: string }>());