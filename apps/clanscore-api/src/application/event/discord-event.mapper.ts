import { DiscordScheduledEventData, IEvent } from "@clanscore/shared";
import * as RRuleLib from "rrule";

const { RRule } = RRuleLib;

/**
 * Maps Discord scheduled event data to the provider-agnostic IEvent format.
 * Note: The ID field will be empty as this is a new event to be created in Google.
 */
export function mapDiscordEventToIEvent(
    discordEvent: DiscordScheduledEventData
): IEvent {
    let startDate: Date;
    if (discordEvent.scheduledStartAt) {
        startDate = new Date(discordEvent.scheduledStartAt);
    } else if (discordEvent.scheduledStartTimestamp) {
        startDate = new Date(discordEvent.scheduledStartTimestamp);
    } else {
        startDate = new Date();
    }
    
    let endDate: Date;
    if (discordEvent.scheduledEndAt) {
        endDate = new Date(discordEvent.scheduledEndAt);
    } else if (discordEvent.scheduledEndTimestamp) {
        endDate = new Date(discordEvent.scheduledEndTimestamp);
    } else {
        endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour duration
    }

    return {
        id: "", // Will be set by Google after creation
        summary: discordEvent.name,
        description: discordEvent.description ?? null,
        startDate,
        endDate,
        location: discordEvent.entityMetadata?.location ?? null,
        recurrenceRule: discordRecurrenceToRRuleString(
            discordEvent.recurrenceRule,
            startDate
        ),
    };
}

const DiscordFrequency = {
    Daily: 3,
    Weekly: 2,
    Monthly: 1,
    Yearly: 0,
} as const;

type DiscordRecurrenceRule = {
    frequency?: number;
    interval?: number;
    count?: number | null;
    byNWeekday?: Array<{ day: number; n: number }> | null;
    byWeekday?: number[] | null;
    byMonth?: number[] | null;
    byMonthDay?: number[] | null;
};

function discordRecurrenceToRRuleString(
    recurrence: DiscordScheduledEventData["recurrenceRule"],
    startDate: Date
): string | undefined {
    if (!recurrence || recurrence.frequency === undefined) return undefined;
    
    const recurrenceRule = recurrence as DiscordRecurrenceRule;

    const freqMap: Record<number, number> = {
        [DiscordFrequency.Daily]: RRule.DAILY,
        [DiscordFrequency.Weekly]: RRule.WEEKLY,
        [DiscordFrequency.Monthly]: RRule.MONTHLY,
        [DiscordFrequency.Yearly]: RRule.YEARLY,
    };

    const frequency = recurrenceRule.frequency !== undefined ? freqMap[recurrenceRule.frequency] : undefined;
    if (frequency === undefined) return undefined;

    // Map weekday numbers to RRule weekday strings
    const weekdayMap: Record<number, string> = {
        0: "MO", // Monday
        1: "TU", // Tuesday
        2: "WE", // Wednesday
        3: "TH", // Thursday
        4: "FR", // Friday
        5: "SA", // Saturday
        6: "SU", // Sunday
    };

    const ruleOptions: Partial<RRuleLib.Options> = {
        freq: frequency,
        ...(recurrenceRule.interval && recurrenceRule.interval !== 1 ? { interval: recurrenceRule.interval } : {}),
        count: recurrenceRule.count ?? undefined,
        dtstart: startDate,
    };

    // Handle byNWeekday (e.g., "second Friday" = { day: 4, n: 2 })
    // Convert to BYDAY format: "2FR" for second Friday
    if (recurrenceRule.byNWeekday && recurrenceRule.byNWeekday.length > 0) {
        const bydayParts = recurrenceRule.byNWeekday.map(({ day, n }: { day: number; n: number }) => {
            const weekdayStr = weekdayMap[day];
            if (!weekdayStr) return null;
            // n can be positive (1=first, 2=second, etc.) or negative (-1=last)
            return `${n}${weekdayStr}`;
        }).filter((part: string | null): part is string => part !== null);
        
        if (bydayParts.length > 0) {
            ruleOptions.byweekday = bydayParts.map((part: string) => {
                // Parse "2FR" format into RRule Weekday with offset
                const match = part.match(/^(-?\d+)([A-Z]{2})$/);
                if (match) {
                    const offset = parseInt(match[1], 10);
                    const weekday = match[2];
                    const weekdayNum = Object.entries(weekdayMap).find(([, val]) => val === weekday)?.[0];
                    if (weekdayNum !== undefined) {
                        return new RRuleLib.Weekday(parseInt(weekdayNum, 10), offset);
                    }
                }
                return null;
            }).filter((w: RRuleLib.Weekday | null): w is RRuleLib.Weekday => w !== null);
        }
    }

    // Handle byWeekday (simple weekday array, e.g., [5] for Friday)
    if (recurrenceRule.byWeekday && recurrenceRule.byWeekday.length > 0) {
        ruleOptions.byweekday = recurrenceRule.byWeekday.map((day: number) => {
            return new RRuleLib.Weekday(day);
        });
    }

    // Handle byMonth (e.g., [1, 2, 3] for January, February, March)
    if (recurrenceRule.byMonth && recurrenceRule.byMonth.length > 0) {
        ruleOptions.bymonth = recurrenceRule.byMonth;
    }

    // Handle byMonthDay (e.g., [1, 15] for 1st and 15th of month)
    if (recurrenceRule.byMonthDay && recurrenceRule.byMonthDay.length > 0) {
        ruleOptions.bymonthday = recurrenceRule.byMonthDay;
    }

    const rule = new RRule(ruleOptions);

    // RRule.toString() returns "DTSTART:...\nRRULE:..." but Google Calendar only wants the RRULE part
    const fullString = rule.toString();
    let rruleLine = fullString.split('\n').find(line => line.startsWith('RRULE:'));
    
    if (!rruleLine) {
        return fullString;
    }

    // Format the RRULE string to match Google Calendar format:
    // - Remove INTERVAL=1 (it's the default)
    // - Remove + prefix from positive BYDAY offsets (e.g., +2FR -> 2FR)
    // - Keep negative offsets as-is (e.g., -1FR)
    rruleLine = rruleLine
        .replace(/;INTERVAL=1(?=;|$)/i, '') // Remove INTERVAL=1 if present
        .replace(/BYDAY=([^;]+)/i, (match, bydayValue) => {
            // Remove + prefix from positive numbers in BYDAY
            const cleaned = bydayValue.replace(/\+(?=\d)/g, '');
            return `BYDAY=${cleaned}`;
        });

    return rruleLine;
}
