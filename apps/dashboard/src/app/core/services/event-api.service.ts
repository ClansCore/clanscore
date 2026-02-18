import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { environment } from "../../../environments/environment";
import { GuildEvent } from "../models/domain/event.model";
import { EventApiModel } from "../models/api/event-api.model";
import { EventMapper } from "../models/mapper/event.mapper";

@Injectable({ providedIn: 'root' })
export class EventApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/events`;

  getAllEvents(): Observable<GuildEvent[]> {
    return this.http.get<EventApiModel[]>(this.baseUrl).pipe(
      map(events => events.map(EventMapper.fromApi))
    );
  }

  addEvent(event: GuildEvent): Observable<GuildEvent> {
    return this.http.post<EventApiModel>(this.baseUrl, {event}).pipe(
      map(event => EventMapper.fromApi(event))
    );
  }

  updateEvent(updateEvent: GuildEvent): Observable<GuildEvent> {
    const event = EventMapper.toApi(updateEvent);
    return this.http.put<EventApiModel>(this.baseUrl, {event}).pipe(
      map(event => EventMapper.fromApi(event))
    );
  }

  deleteEvent(deleteEvent: GuildEvent): Observable<GuildEvent> {
    const event = EventMapper.toApi(deleteEvent);
    return this.http.delete<EventApiModel>(`${this.baseUrl}/${event.id}`).pipe(
      map((event) => deleteEvent)
    );
  }
}