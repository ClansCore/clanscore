/**
 * Notification System - Zentraler Einstiegspunkt
 * 
 * Dieses Modul exportiert den NotificationService und registriert alle Adapter.
 * Um eine neue Plattform hinzuzufügen:
 * 1. Erstelle einen neuen Adapter in ./adapters/ (z.B. telegram.adapter.ts)
 * 2. Importiere und registriere ihn hier
 */

import { notificationService } from "./notification.service";
import { DiscordAdapter } from "./adapters/discord.adapter";

notificationService.register(new DiscordAdapter());

export { notificationService } from "./notification.service";
export type { PlatformAdapter } from "./platform-adapter.interface";
export { BasePlatformAdapter } from "./platform-adapter.interface";
export * from "./notification.events";
