export enum ErrorType {
    // User Errors
    UserNotFound = "UserNotFound",
    UserAlreadyExists = "UserAlreadyExists",
    UserApplicationNotPending = "UserApplicationNotPending",
    UserApplicationPending = "UserApplicationPending",
    UserStep1DataNotFound = "UserStep1DataNotFound",
    ReapplicationError = "ReapplicationError",
    NotEnoughPoints = "NotEnoughPoints",
    TOSNotAccepted = "TOSNotAccepted",
    UserDeletionPending = "UserDeletionPending",
    UserLeaveCancelled = "UserLeaveCancelled",
    ApplicationMessageFetchError = "ApplicationMessageFetchError",

    // Role Errors
    RoleNotFound = "RoleNotFound",
    RoleAssignmentFailed = "RoleAssignmentFailed",

    // Task Errors
    TaskNotFound = "TaskNotFound",
    TaskAlreadyCompleted = "TaskAlreadyCompleted",
    TaskAlreadyClaimed = "TaskAlreadyClaimed",
    TaskDeadlineReached = "TaskDeadlineReached",
    TaskNotResponsible = "TaskNotResponsible",
    DeadlineInPast = "DeadlineInPast",

    // Participant Errors
    TaskParticipantNotFound = "TaskParticipantNotFound",
    MaxParticipantsAmountReached = "MaxParticipantsAmountReached",
    NoOpenTasks = "NoOpenTasks",

    // Leaderboard Errors
    LeaderboardNotFound = "LeaderboardNotFound",

    // LeaderboardEntry Errors
    LeaderboardEntryNotFound = "LeaderboardEntryNotFound",

    // Event Errors
    EventDetailsNotFound = "EventNotFound",
    CalendarSyncError = "CalendarSyncError",

    // Calendar Errors (Database Table)
    CalendarNotFound = "CalendarNotFound",

    // Calendar Provider Errors
    UnknownCalendarProvider = "UnknownCalendarProvider",
    CalenderProviderAuthenticationFailed = "CalenderProviderAuthenticationFailed",
    CalendarConnectionError = "CalendarConnectionError",
    InvalidAccessToken = "InvalidAccessToken",
    ErrorConvertingRRule = "ErrorConvertingRRule",

    // Reward Errors
    RewardNotFound = "RewardNotFound",

    // Donation Errors
    DonationNotFound = "DonationNotFound",
    DonationAlreadyProcessed = "DonationAlreadyProcessed",

    // Gamification Parameter Errors
    GamificationParameterNotFound = "GamificationParameterNotFound",

    // Annual Plan Errors
    AnnualPlanNotFound = "AnnualPlanNotFound",

    // Transaction Errors
    TransactionNotFound = "TransactionNotFound",

    // Database Errors
    DatabaseConnectionError = "DatabaseConnectionError",
    DatabaseGenericError = "DatabaseGenericError",
    DatabaseEntryNotFound = "DatabaseEntryNotFound",
    DatabaseValidationError = "DatabaseValidationError",
    DatabaseCastError = "DatabaseCastError",

    // Sync Errors
    SyncCancelled = "SyncCancelled",
    SyncDatabaseRolesNotFound = "SyncDatabaseRolesNotFound",
    SyncDiscordRolesNotFound = "SyncDiscordRolesNotFound",
    BotPermissionRolesUnsufficient = "BotPermissionRolesUnsufficient",

    // General Errors
    NetworkFailure = "NetworkFailure",
    NotFound = "NotFound",
    UnknownError = "UnknownError",
    NotAServer = "NotAServer",
    NotAValidEmailAddress = "NotAValidEmailAddress",
    NotAValidPhoneNumber = "NotAValidPhoneNumber",
    NotAValidDateFormat = "NotAValidDateFormat",
    EndDateNotAfterStartDate = "EndDateNotAfterStartDate",
    NotAValidPositiveInteger = "NotAValidPositiveInteger",
    ChannelNotFound = "ChannelNotFound",
    MessageNotSend = "MessageNotSend",
    PermissionDenied = "PermissionDenied",
    UserNotManageable = "UserNotManageable",
    GuildNotFound = "GuildNotFound",
    ErrorSettingUserIcon = "ErrorSettingUserIcon",
    CachedDateNotFound = "CachedDateNotFound",
    MessageAlreadyAcknowledged = "MessageAlreadyAcknowledged",
    DiscordGuildEventInvalidFormBody = "DiscordGuildEventInvalidFormBody",
    ModalOpeningFailure = "ModalOpeningFailure",
    ValidationError = "ValidationError",
    NotificationFailed = "NotificationFailed",
}

export type ErrorDetails<E = ErrorType> = {
    type: E;
    details?: Record<string, string | number>;
};

export type Result<T, E extends ErrorDetails = ErrorDetails> =
    | { ok: true; value: T }
    | { ok: false; error: E };

export function ok<T>(value: T): Result<T> {
    return { ok: true, value };
}

export function err<E extends ErrorType>(
    type: E,
    details?: Record<string, string | number>,
): Result<never, ErrorDetails<E>> {
    return { ok: false, error: { type, details } };
}
