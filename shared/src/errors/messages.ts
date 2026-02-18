import { ErrorDetails, ErrorType } from "./types.js";

type ErrorMessageFunction = (
    details?: Record<string, string | number>
) => string;

const messages: Record<ErrorType, ErrorMessageFunction> = {
    // User Errors
    [ErrorType.UserNotFound]: (details) => {
        if (details?.discordId)
            return `❌ Benutzer mit Discord-ID: ${details.discordId} wurde nicht gefunden.`;
        if (details?.userId)
            return `❌ Benutzer mit Benutzer-ID: ${details.userId} wurde nicht gefunden.`;
        if (details?.nickname)
            return `❌ Benutzer mit Spitznamen: ${details.nickname} wurde nicht gefunden.`;
        return "❌ Benutzer wurde nicht gefunden.";
    },
    [ErrorType.UserAlreadyExists]: (details) => {
        if (details?.discordId)
            return `❌ Benutzer mit Discord-ID: ${details.discordId} existiert bereits.`;
        return "❌ Du bist bereits registriert und kannst nicht erneut beitreten.";
    },
    [ErrorType.UserApplicationNotPending]: () =>
        "⚠️ Diese Bewerbung ist nicht mehr ausstehend.",
    [ErrorType.UserApplicationPending]: () =>
        "⚠️ Deine Bewerbung wurde bereits eingereicht. Bitte warte auf eine Entscheidung des Vorstands.",
    [ErrorType.UserStep1DataNotFound]: () =>
        "⚠️ Deine vorherigen Daten wurden nicht gefunden. Bitte starte den Prozess erneut.",
    [ErrorType.ReapplicationError]: () =>
        "❌ Wiederbewerbung konnte nicht gesendet werden.",
    [ErrorType.NotEnoughPoints]: () => "Du hast nicht genügend Punkte.",
    [ErrorType.TOSNotAccepted]: () =>
        "⚠️ Der Bewerbungsvorgang wurde unterbrochen. Du musst den Datenschutz und die Statuten akzeptieren, um Mitglied zu werden.",
    [ErrorType.UserDeletionPending]: () =>
        "❌ Du hast den Verein bereits verlassen. Deine Daten sind zur Löschung vorgemerkt.",
    [ErrorType.UserLeaveCancelled]: () => "❌ Austritt abgebrochen.",
    [ErrorType.ApplicationMessageFetchError]: (details) => {
        if (details?.messageId && details?.channelName) {
            return `⚠️ Die Bewerbungsnachricht mit ID "${details.messageId}" im Kanal "${details.channelName}" konnte nicht geladen werden. Sie wurde vermutlich gelöscht.`;
        }
        return "⚠️ Die alte Bewerbungsnachricht konnte nicht geladen werden. Sie wurde vermutlich gelöscht.";
    },

    // Role Errors
    [ErrorType.RoleNotFound]: (details) => {
        if (details?.roleName)
            return `❌ Rolle mit dem Namen: ${details.roleName} wurde nicht gefunden.`;
        return "❌ Rolle wurde nicht gefunden.";
    },
    [ErrorType.RoleAssignmentFailed]: (details) => {
        if (details?.roleName)
            return `❌ Benutzerrolle ${details.roleName} konnte nicht gesetzt werden.`;
        return "❌ Benutzerrolle konnte nicht gesetzt werden.";
    },

    // Task Errors
    [ErrorType.TaskNotFound]: (details) => {
        if (details?.taskId)
            return `❌ Aufgabe mit ID: ${details.taskId} wurde nicht gefunden.`;
        return "❌ Aufgabe wurde nicht gefunden.";
    },
    [ErrorType.TaskAlreadyCompleted]: () =>
        "⚠️ Aufgabe wurde bereits abgeschlossen.",
    [ErrorType.TaskAlreadyClaimed]: () =>
        "⚠️ Du hast diese Aufgabe bereits beansprucht.",
    [ErrorType.TaskDeadlineReached]: () =>
        "⚠️ Die Frist für diese Aufgabe ist bereits abgelaufen.",
    [ErrorType.TaskNotResponsible]: () =>
        "⚠️ Du bist für diese Aufgabe nicht zuständig.",
    [ErrorType.DeadlineInPast]: () =>
        "❌ Die Deadline darf nicht in der Vergangenheit liegen. Bitte wähle ein Datum ab heute.",

    // Participant Errors
    [ErrorType.TaskParticipantNotFound]: () =>
        "❌ Teilnehmer wurden nicht gefunden.",
    [ErrorType.MaxParticipantsAmountReached]: () =>
        "⚠️ Diese Aufgabe hat bereits die maximale Teilnehmeranzahl erreicht.",
    [ErrorType.NoOpenTasks]: () => "⚠️ Du hast keine offenen Aufgaben.",

    // Leaderboard Errors
    [ErrorType.LeaderboardNotFound]: () => "❌ Bestenliste wurde nicht gefunden.",

    // LeaderboardEntry Errors
    [ErrorType.LeaderboardEntryNotFound]: () =>
        "❌ Eintrag in der Bestenliste wurde nicht gefunden.",

    // Event Errors
    [ErrorType.EventDetailsNotFound]: () => "❌ Ereignis wurde nicht gefunden.",
    [ErrorType.CalendarSyncError]: () =>
        "❌ Beim Synchronisieren der Ereignisse ist ein Fehler aufgetreten.",

    // Calendar Errors (Database Table)
    [ErrorType.CalendarNotFound]: (details) => {
        if (details?.message)
            return details?.message.toString();
        return "⚠️ Es ist kein Kalender verknüpft. Verwende `/linkcalendar` oder kontaktiere einen Server-Admin.";
    },
    [ErrorType.CalendarConnectionError]: () =>
        "❌ Fehler beim Verbinden mit dem verknüpften Kalender.",

    // Calendar Provider Errors
    [ErrorType.UnknownCalendarProvider]: () => "❌ Unbekannter Kalenderanbieter.",
    [ErrorType.CalenderProviderAuthenticationFailed]: () =>
        "❌ Authentifizierung mit dem Kalenderanbieter fehlgeschlagen.",
    [ErrorType.InvalidAccessToken]: () => "❌ Der Zugriffstoken ist ungültig.",
    [ErrorType.ErrorConvertingRRule]: () =>
        "❌ RRule-String konnte nicht in das Discord-Format konvertiert werden.",

    // Reward Errors
    [ErrorType.RewardNotFound]: () => "❌ Belohnung wurde nicht gefunden.",

    // Donation Errors
    [ErrorType.DonationNotFound]: () => "❌ Spende wurde nicht gefunden.",
    [ErrorType.DonationAlreadyProcessed]: () =>
        "⚠️ Diese Spende wurde bereits verarbeitet.",

    // Gamification Parameter Errors
    [ErrorType.GamificationParameterNotFound]: () =>
        "❌ Gamification Parameter wurde nicht gefunden.",

    // Annual Plan Errors
    [ErrorType.AnnualPlanNotFound]: () => "❌ Jahresplanung wurde nicht gefunden.",

    // Transaction Errors
    [ErrorType.TransactionNotFound]: () => "❌ Transaktion wurde nicht gefunden.",

    // Database Errors
    [ErrorType.DatabaseConnectionError]: () =>
        "❌ Verbindung zur Datenbank fehlgeschlagen.",
    [ErrorType.DatabaseGenericError]: () =>
        "❌ Ein Datenbankfehler ist aufgetreten.",
    [ErrorType.DatabaseEntryNotFound]: () =>
        "❌ Der angeforderte Datensatz wurde in der Datenbank nicht gefunden.",
    [ErrorType.DatabaseValidationError]: () =>
        "⚠️ Die angegebenen Daten sind ungültig oder erfüllen nicht die erforderlichen Bedingungen.",
    [ErrorType.DatabaseCastError]: () =>
        "❌ Ungültiger Datentyp oder ID-Format angegeben.",

    // Sync Errors
    [ErrorType.SyncCancelled]: () => "❌ Synchronisierung abgebrochen.",
    [ErrorType.SyncDatabaseRolesNotFound]: () =>
        "❌ Datenbankrollen nicht gefunden.",
    [ErrorType.SyncDiscordRolesNotFound]: () =>
        "❌ Discord-Rollen nicht gefunden.",
    [ErrorType.BotPermissionRolesUnsufficient]: () =>
        "⚠️ Bot-Rolle ist nicht hoch genug, um Rollen zu verwalten. Bitte ziehe die Bot-Rolle im Discord über alle zu verwaltenden Rollen.",

    // General Errors
    [ErrorType.NetworkFailure]: (details) => {
        if (details?.message)
            return `❌ Netzwerkverbindung fehlgeschlagen: ${details.message}`;
        return "❌ Netzwerkverbindung fehlgeschlagen.";
    },
    [ErrorType.NotFound]: () => "❌ Etwas ist schiefgelaufen.",
    [ErrorType.UnknownError]: (details) => {
        if (details?.message)
            return `❌ Etwas ist schiefgelaufen: ${details.message}`;
        return "❌ Etwas ist schiefgelaufen.";
    },
    [ErrorType.NotAServer]: () =>
        "⚠️ Dieser Befehl kann nur in einem Server verwendet werden.",
    [ErrorType.NotAValidEmailAddress]: (details) => {
        if (details?.email)
            return `⚠️ "${details.email}" ist keine gültige E-Mail-Adresse.`;
        return "⚠️ Keine gültige E-Mail-Adresse.";
    },
    [ErrorType.NotAValidPhoneNumber]: (details) => {
        if (details?.phone)
            return `⚠️ "${details.phone}" ist keine gültige Telefonnummer.`;
        return "⚠️ Die eingegebene Telefonnummer ist ungültig. Bitte gib eine gültige Nummer ein (z. B. '+41xxxxxxxxx' oder '0xxxxxxxxx').";
    },
    [ErrorType.NotAValidDateFormat]: () =>
        "⚠️ Das angegebene Datum hat nicht das korrekte Format (TT.MM.JJJJ).",
    [ErrorType.EndDateNotAfterStartDate]: () =>
        "⚠️ Das Enddatum muss nach dem Startdatum liegen.",
    [ErrorType.NotAValidPositiveInteger]: () =>
        "⚠️ Die angegebene Zahl ist keine gültige positive Ganzzahl.",
    [ErrorType.ChannelNotFound]: (details) => {
        if (details?.channel)
            return `❌ Kanal mit dem Namen: ${details.channel} wurde nicht gefunden.`;
        return "❌ Kanal wurde nicht gefunden.";
    },
    [ErrorType.MessageNotSend]: () =>
        "❌ Die Nachricht konnte nicht gesendet werden.",
    [ErrorType.PermissionDenied]: () =>
        "⚠️ Du hast keine Berechtigung, auf diesen Dienst zuzugreifen.",
    [ErrorType.UserNotManageable]: () =>
        "⚠️ Der Bot hat keine Berechtigung, diesen Benutzer zu verwalten.",
    [ErrorType.GuildNotFound]: () => "Server wurde nicht gefunden.",
    [ErrorType.ErrorSettingUserIcon]: () =>
        "❌ Benutzersymbol konnte nicht gesetzt werden.",
    [ErrorType.CachedDateNotFound]: () =>
        "❌ Deine vorherigen Daten wurden nicht gefunden. Bitte starte den Vorgang erneut.",
    [ErrorType.MessageAlreadyAcknowledged]: () =>
        "❌ Diese Nachricht wurde bereits bestätigt. Bitte verwende den Befehl erneut.",
    [ErrorType.DiscordGuildEventInvalidFormBody]: () =>
        "❌ Dieses Veranstaltungsformat wird nicht unterstützt.",
    [ErrorType.ModalOpeningFailure]: () =>
        "❌ Beim Öffnen des Modals ist ein Fehler aufgetreten.",
    [ErrorType.ValidationError]: (details) => {
        if (details?.info) return `❌ Ungültige Eingabe: ${details.info}`;
        return "❌ Ungültige Eingabe. Bitte Felder überprüfen";
    },
    [ErrorType.NotificationFailed]: (details) => {
        if (details?.message)
            return `❌ Die Notifikation konnte nicht übermittelt werden: ${details.message}`;
        if (details?.status)
            return `❌ Die Notifikation konnte nicht übermittelt werden (Status: ${details.status}).`;
        return "❌ Die Notifikation konnte nicht übermittelt werden.";
    },
};

export function getErrorMessage(error: ErrorDetails): string {
    const fn = messages[error.type];
    return fn ? fn(error.details) : "⚠️ Es ist ein unbekannter Fehler aufgetreten.";
}
