import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {EventActions} from '.';
import { catchError, map, mergeMap, of, tap } from 'rxjs';
import { EventApiService } from '../../../core/services/event-api.service';

@Injectable()
export class EventEffects {
  getEvents$;
  addEvent$;
  updateEvent$;
  deleteEvent$;

  constructor(private actions$: Actions, private eventServie: EventApiService) {
    this.getEvents$ = createEffect(() =>
      this.actions$.pipe(
        ofType(EventActions.getEvents),
        mergeMap(() =>
          this.eventServie.getAllEvents().pipe(
            map(events => EventActions.getEventsSuccess({ events })),
            catchError(error => of(EventActions.getEventsFailure({ error: error.message || 'Failed to load events' })))
          )
        )
      )
    );

    this.addEvent$ = createEffect(() =>
            this.actions$.pipe(
              ofType(EventActions.addEvent),
              mergeMap((event) =>
                this.eventServie.addEvent(event.event).pipe(
                  map((event) => EventActions.addEventSuccess({event})),
                  catchError(error => of(EventActions.addEventFailure({ error: error.message || 'Failed to add event' })))
                )
              )
            )
        );
    
        this.updateEvent$ = createEffect(() =>
            this.actions$.pipe(
              ofType(EventActions.updateEvent),
              mergeMap((event) =>
                this.eventServie.updateEvent(event.event).pipe(
                  map(event => EventActions.updateEventSuccess({event})),
                  catchError(error => of(EventActions.updateEventFailure({ error: error.message || 'Failed to update event' })))
                )
              )
            )
        );
    
        this.deleteEvent$ = createEffect(() =>
            this.actions$.pipe(
              ofType(EventActions.deleteEvent),
              mergeMap((event) =>
                this.eventServie.deleteEvent(event.event).pipe(
                  map(event => EventActions.deleteEventSuccess({event})),
                  catchError(error => of(EventActions.deleteEventFailure({ error: error.message || 'Failed to delete event' })))
                )
              )
            )
        );
    
  }
}

