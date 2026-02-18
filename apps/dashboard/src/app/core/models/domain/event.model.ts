export interface GuildEvent {
  id: string;
  providerEventId: string;
  discordEventId: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
}