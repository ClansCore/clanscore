import { createReducer, on } from '@ngrx/store';
import {EventActions} from '.';
import { GuildEvent } from '../../../core/models/domain/event.model';

export interface EventState {
  events: GuildEvent[];
  loading: boolean;
  error: string | null;
}

export const initialState: EventState = {
  events: [],
  loading: false,
  error: null,
};

export const eventReducer = createReducer(
  initialState,
  on(EventActions.getEvents, (state) => ({ ...state, loading: true })),
  on(EventActions.getEventsSuccess, (state, { events }) => ({
    ...state,
    loading: false,
    events,
  })),
  on(EventActions.getEventsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(EventActions.addEventSuccess, (state, { event }) => ({
      ...state,
      loading: false,
      events: [...state.events, event],
    })),
    on(EventActions.updateEventSuccess, (state, { event }) => ({
      ...state,
      loading: false,
      events: state.events.map(r =>
        r.id === event.id ? event : r
      )
    })),
    on(EventActions.deleteEventSuccess, (state, { event }) => ({
      ...state,
      loading: false,
      events: state.events.filter(r => r.id !== event.id)
    }))
);