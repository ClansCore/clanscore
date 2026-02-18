import { EventApiModel } from '../api/event-api.model';
import { GuildEvent } from '../domain/event.model';

export class EventMapper {
  static fromApi(api: EventApiModel): GuildEvent {
    return {
      id: api.id,
      discordEventId: api.discordEventId,
      providerEventId: api.providerEventId,
      name: api.name,
      description: api.description,
      startDate: new Date(api.startDate),
      endDate: new Date(api.endDate),
      location: api.location,
    };
  }

  static toApi(event: GuildEvent): EventApiModel {
    return {
      id: event.id,
      discordEventId: event.discordEventId,
      providerEventId: event.providerEventId,
      name: event.name,
      description: event.description,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      location: event.location,
    };
  }
}