import { createFeatureSelector, createSelector } from '@ngrx/store';
import { EventState } from './event.reducer';

export const selectEventState = createFeatureSelector<EventState>('event');

export const selectEvents = createSelector(selectEventState, (state) => state.events);
export const selectEventsLoading = createSelector(selectEventState, (state) => state.loading);
export const selectEventsError = createSelector(selectEventState, (state) => state.error);