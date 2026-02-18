export const ChannelNames = {
    RULES: "regeln",
    EVENTS: "events",
    LEADERBOARDS: "rangliste",
    TASKS: "aufgaben",
    COMMANDS: "bot-befehle",
    APPLICATIONS: "bot-bewerbungen",
    REWARDS: "bot-belohnungen",
    COMPLETED_TASKS: "bot-aufgaben",
    BotLog: "bot-log",
} as const;

export type ChannelName = (typeof ChannelNames)[keyof typeof ChannelNames];
