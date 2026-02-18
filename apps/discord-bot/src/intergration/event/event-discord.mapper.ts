/* eslint-disable prefer-const */
import {
    err,
    ErrorDetails,
    ErrorType,
    EventDetailsCreateDTO,
    IEvent,
    ok,
    Result,
    getErrorMessage,
} from "@clanscore/shared";
import {
    GuildScheduledEvent,
    // GuildScheduledEventCreateOptions,
    GuildScheduledEventEntityType,
    GuildScheduledEventPrivacyLevel,
    GuildScheduledEventRecurrenceRule,
    GuildScheduledEventRecurrenceRuleFrequency,
    // GuildScheduledEventRecurrenceRuleMonth,
    // GuildScheduledEventRecurrenceRuleNWeekday,
    GuildScheduledEventRecurrenceRuleOptions,
    // GuildScheduledEventRecurrenceRuleWeekday,
    GuildScheduledEventStatus,
} from "discord.js";
import * as RRuleLib from "rrule";
import { config } from "../../config";
import { convertHtmlToDiscordMarkdown } from "../../utils-discord/html-to-markdown";

type RRuleType = RRuleLib.RRule;
const { RRule, Weekday } = RRuleLib;

/**
 * Formats a Date to RFC5545 DTSTART format (YYYYMMDDTHHmmssZ)
 */
function formatDateForRRule(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

export function mapIEventToDiscordEventOptions(
    providerEvent: IEvent,
    recurrenceRule: string | null,
) {
    const guildEvent = {
        name: providerEvent.summary || "Untitled Event",
        scheduledStartTime: providerEvent.startDate,
        scheduledEndTime: providerEvent.endDate,
        privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
        entityType: GuildScheduledEventEntityType.External,
        description: convertHtmlToDiscordMarkdown(providerEvent.description) || "",
        entityMetadata: { location: providerEvent.location || "Unbekannter Ort" },
        recurrenceRule: undefined as
            | GuildScheduledEventRecurrenceRuleOptions
            | undefined,
    };

    if (recurrenceRule && !recurrenceRule.includes("FREQ=ONCE")) {
        const recurrenceRuleResult = rruleStringToDiscordRecurrence(
            recurrenceRule,
            new Date(guildEvent.scheduledStartTime),
        );

        if (recurrenceRuleResult.ok) {
            guildEvent.recurrenceRule = recurrenceRuleResult.value;
        }
    }

    return guildEvent;
}

export function buildEventDetails(
    providerEvent: IEvent,
    discordEventId: string,
): EventDetailsCreateDTO {
    return {
        providerEventId: providerEvent.id!,
        discordEventId: discordEventId,
        name: providerEvent.summary || "Untitled Event",
        description: providerEvent.description || "",
        startDate: providerEvent.startDate,
        endDate: providerEvent.endDate,
        location: providerEvent.location || "Unbekannter Ort",
        recurringEventId: providerEvent.recurringEventId || null,
        recurrenceRule: providerEvent.recurrenceRule,
    };
}

export function mapGuildEventToIEvent(
    guildEvent: GuildScheduledEvent<GuildScheduledEventStatus>,
) {
    const event: IEvent = {
        id: guildEvent.id,
        summary: guildEvent.name,
        description: guildEvent.description ?? undefined,
        startDate: guildEvent.scheduledStartAt ?? new Date(),
        endDate: guildEvent.scheduledEndAt ?? new Date(),
        location: guildEvent.entityMetadata?.location ?? undefined,
        recurrenceRule: discordRecurrenceToRRuleString(
            guildEvent.recurrenceRule,
            guildEvent.scheduledStartAt,
        ),
    };

    return event;
}

export function discordRecurrenceToRRuleString(
    recurrence: GuildScheduledEventRecurrenceRule | null,
    startDate: Date | null,
): string | undefined {
    if (!recurrence || recurrence.frequency === undefined) return undefined;
    if (!startDate) return undefined;

    const freqMap: Record<GuildScheduledEventRecurrenceRuleFrequency, number> =
        {
            [GuildScheduledEventRecurrenceRuleFrequency.Daily]: RRule.DAILY,
            [GuildScheduledEventRecurrenceRuleFrequency.Weekly]: RRule.WEEKLY,
            [GuildScheduledEventRecurrenceRuleFrequency.Monthly]: RRule.MONTHLY,
            [GuildScheduledEventRecurrenceRuleFrequency.Yearly]: RRule.YEARLY,
        };

    const frequency = freqMap[recurrence.frequency];
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

    const ruleOptions: any = {
        freq: frequency,
        // Only set interval if it's not 1 (1 is the default)
        ...(recurrence.interval && recurrence.interval !== 1 ? { interval: recurrence.interval } : {}),
        count: recurrence.count,
        dtstart: startDate,
    };

    // Get Weekday constructor - try multiple sources
    const WeekdayConstructor = Weekday || (RRuleLib as any)['Weekday'] || (RRuleLib as any).Weekday;
    
    // Handle byNWeekday (e.g., "second Friday" = { day: 4, n: 2 })
    // Convert to BYDAY format: "2FR" for second Friday
    if (recurrence.byNWeekday && recurrence.byNWeekday.length > 0) {
        ruleOptions.byweekday = recurrence.byNWeekday.map(({ day, n }) => {
            return (WeekdayConstructor && typeof WeekdayConstructor === 'function') 
                ? new WeekdayConstructor(day, n) 
                : new RRuleLib.Weekday(day, n);
        });
    }

    // Handle byWeekday (simple weekday array, e.g., [5] for Friday)
    if (recurrence.byWeekday && recurrence.byWeekday.length > 0) {
        ruleOptions.byweekday = recurrence.byWeekday.map(day => {
            return (WeekdayConstructor && typeof WeekdayConstructor === 'function') 
                ? new WeekdayConstructor(day) 
                : new RRuleLib.Weekday(day);
        });
    }

    // Handle byMonth (e.g., [1, 2, 3] for January, February, March)
    if (recurrence.byMonth && recurrence.byMonth.length > 0) {
        ruleOptions.bymonth = recurrence.byMonth;
    }

    // Handle byMonthDay (e.g., [1, 15] for 1st and 15th of month)
    if (recurrence.byMonthDay && recurrence.byMonthDay.length > 0) {
        ruleOptions.bymonthday = recurrence.byMonthDay;
    }

    const rule = new RRule(ruleOptions);

    const fullString = rule.toString();
    
    // Extract RRULE line (RRule.toString() returns "DTSTART:...\nRRULE:...")
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

export function rruleStringToDiscordRecurrence(
    rruleString: string,
    startAt: Date,
): Result<GuildScheduledEventRecurrenceRuleOptions, ErrorDetails> {
    // Get Weekday constructor - try multiple sources
    // Weekday may not be available in function scope, so try RRuleLib.Weekday directly
    // Access it via bracket notation to avoid TypeScript errors
    const WeekdayConstructor = Weekday || (RRuleLib as any)['Weekday'] || (RRuleLib as any).Weekday;

    try {
        // Remove "RRULE:" prefix if present
        const cleanRuleString = rruleString.replace(/^RRULE:/i, '');
        
        // Check for unsupported RRule patterns that Discord doesn't support
        // Discord has limited support compared to Google Calendar
        const unsupportedPatterns = [
            /BYSETPOS=/i,      // Position in set - not supported
            /BYWEEKNO=/i,      // Week number - not supported
            /BYYEARDAY=/i,     // Year day - not supported
            /WKST=/i,          // Week start - not supported (Discord uses default)
        ];
        
        for (const pattern of unsupportedPatterns) {
            if (pattern.test(cleanRuleString)) {
                return err(ErrorType.ErrorConvertingRRule);
            }
        }
        
        // Parse the RRULE string manually and create RRule from options
        const options: any = {
            dtstart: startAt,
        };
        
        // Parse FREQ
        // RRule is destructured at module level, but may be undefined in this function scope
        // Use numeric values directly (verified: DAILY=3, WEEKLY=2, MONTHLY=1, YEARLY=0)
        const freqMatch = cleanRuleString.match(/FREQ=(\w+)/i);
        if (freqMatch) {
            const freqStr = freqMatch[1].toUpperCase();
            
            // RRule frequency constants: DAILY=3, WEEKLY=2, MONTHLY=1, YEARLY=0
            let freqValue: number;
            switch (freqStr) {
                case 'DAILY':
                    freqValue = (RRule && RRule.DAILY !== undefined) ? RRule.DAILY : 3;
                    break;
                case 'WEEKLY':
                    freqValue = (RRule && RRule.WEEKLY !== undefined) ? RRule.WEEKLY : 2;
                    break;
                case 'MONTHLY':
                    freqValue = (RRule && RRule.MONTHLY !== undefined) ? RRule.MONTHLY : 1;
                    break;
                case 'YEARLY':
                    freqValue = (RRule && RRule.YEARLY !== undefined) ? RRule.YEARLY : 0;
                    break;
                default:
                    return err(ErrorType.ErrorConvertingRRule);
            }
            
            options.freq = freqValue;
        } else {
            return err(ErrorType.ErrorConvertingRRule);
        }
        
        // Parse INTERVAL
        const intervalMatch = cleanRuleString.match(/INTERVAL=(\d+)/i);
        if (intervalMatch) {
            options.interval = parseInt(intervalMatch[1], 10);
        }
        
        // Parse BYDAY - Discord has restrictions:
        // - WEEKLY: Only supports ONE weekday (not multiple)
        // - MONTHLY: Supports byNWeekday (e.g., "2MO" = second Monday) via byNWeekday
        // - YEARLY: Supports simple BYDAY patterns
        const bydayMatch = cleanRuleString.match(/BYDAY=([^;]+)/i);
        if (bydayMatch) {
            const days = bydayMatch[1].split(',');
            const parsedDays: Array<{ day: string; offset?: number }> = [];
            
            // Parse day strings - can be "MO", "2MO" (second Monday), "-1FR" (last Friday), etc.
            for (const dayStr of days) {
                const trimmed = dayStr.trim();
                // Check for offset (e.g., "2MO", "-1FR")
                const offsetMatch = trimmed.match(/^(-?\d+)([A-Z]{2})$/);
                if (offsetMatch) {
                    parsedDays.push({ day: offsetMatch[2], offset: parseInt(offsetMatch[1], 10) });
                } else {
                    // Simple day without offset
                    parsedDays.push({ day: trimmed });
                }
            }
            
            // Map day abbreviations to RRule weekday objects
            if (!WeekdayConstructor || typeof WeekdayConstructor !== 'function') {
                return err(ErrorType.ErrorConvertingRRule);
            }
            
            // RRule weekday numbers: SU=6, MO=0, TU=1, WE=2, TH=3, FR=4, SA=5
            // Discord weekday numbers: SU=6, MO=0, TU=1, WE=2, TH=3, FR=4, SA=5 (same as RRule)
            const dayMap: Record<string, any> = {
                'SU': (RRule && RRule.SU !== undefined) ? RRule.SU : new WeekdayConstructor(6),
                'MO': (RRule && RRule.MO !== undefined) ? RRule.MO : new WeekdayConstructor(0),
                'TU': (RRule && RRule.TU !== undefined) ? RRule.TU : new WeekdayConstructor(1),
                'WE': (RRule && RRule.WE !== undefined) ? RRule.WE : new WeekdayConstructor(2),
                'TH': (RRule && RRule.TH !== undefined) ? RRule.TH : new WeekdayConstructor(3),
                'FR': (RRule && RRule.FR !== undefined) ? RRule.FR : new WeekdayConstructor(4),
                'SA': (RRule && RRule.SA !== undefined) ? RRule.SA : new WeekdayConstructor(5),
            };
            
            // Store parsed days with offsets for later processing
            options.byweekday = parsedDays.map(({ day }) => dayMap[day] ?? dayMap['MO']);
            options.byweekdayOffsets = parsedDays.map(({ offset }) => offset);
        }
        
        // Parse BYMONTH
        const bymonthMatch = cleanRuleString.match(/BYMONTH=([^;]+)/i);
        if (bymonthMatch) {
            options.bymonth = bymonthMatch[1].split(',').map((m: string) => parseInt(m.trim(), 10));
        }
        
        // Parse BYMONTHDAY
        const bymonthdayMatch = cleanRuleString.match(/BYMONTHDAY=([^;]+)/i);
        if (bymonthdayMatch) {
            options.bymonthday = bymonthdayMatch[1].split(',').map((d: string) => parseInt(d.trim(), 10));
        }

        // We don't need to create a RRule instance - we can use the parsed options directly
        // Extract values from options
        const freq = options.freq;
        const interval = options.interval ?? 1;
        const rawByWeekday = options.byweekday;
        const byweekdayOffsets = options.byweekdayOffsets || [];
        const bynweekday = options.bynweekday;
        const bymonth = options.bymonth;
        const bymonthday = options.bymonthday;
        
        // Ensure interval is set (default to 1 if not specified)
        const intervalValue = interval ?? 1;

        // Always set count to MAX_DISCORD_RECURRENCE_COUNT so Discord shows exactly N repetitions
        // If the original rule has a count, we still limit it to MAX_DISCORD_RECURRENCE_COUNT
        const limitedCount = Number(config.MAX_DISCORD_RECURRENCE_COUNT);

        // Process byweekday - convert numbers to Weekday objects if needed
        // Use WeekdayConstructor from require() at function start
        const byweekday = (rawByWeekday ?? []).map((w: any) => {
            if (typeof w === "number") {
                return (WeekdayConstructor && typeof WeekdayConstructor === 'function') ? new WeekdayConstructor(w) : w;
            }
            return w;
        });

        // Get frequency constants for comparison
        const WEEKLY_FREQ = (RRule && RRule.WEEKLY !== undefined) ? RRule.WEEKLY : 2;
        const MONTHLY_FREQ = (RRule && RRule.MONTHLY !== undefined) ? RRule.MONTHLY : 1;
        
        // Discord-specific validation: Check if the pattern is supported
        // WEEKLY: Discord only supports ONE weekday (not multiple days per week)
        if (freq === WEEKLY_FREQ && byweekday.length > 1) {
            return err(ErrorType.ErrorConvertingRRule);
        }
        
        // MONTHLY: Discord only supports byNWeekday (e.g., "second Monday"), not byMonthDay
        if (freq === MONTHLY_FREQ && bymonthday && bymonthday.length > 0) {
            return err(ErrorType.ErrorConvertingRRule);
        }
        
        // Process BYDAY offsets for MONTHLY (e.g., "2MO" = second Monday)
        // Convert to byNWeekday format for Discord
        let processedByNWeekday: Array<{ day: number; n: number }> | undefined = undefined;
        if (freq === MONTHLY_FREQ && byweekday.length > 0 && byweekdayOffsets.length > 0) {
            processedByNWeekday = byweekday.map((w: any, index: number) => {
                const weekdayNum = typeof w === 'object' && 'weekday' in w ? w.weekday : (typeof w === 'number' ? w : 1);
                const offset = byweekdayOffsets[index];
                return { day: weekdayNum, n: offset ?? 1 };
            });
        } else if (freq === MONTHLY_FREQ && bynweekday && bynweekday.length > 0) {
            processedByNWeekday = bynweekday
                .map((w: number[]) => {
                    if (w.length === 2) {
                        return { day: w[0], n: w[1] };
                    }
                    return undefined;
                })
                .filter(
                    (value: any): value is { day: number; n: number } =>
                        value !== undefined,
                );
        }
        
        let finalFreq = freq;

        const DAILY_FREQ_VAL = (RRule && RRule.DAILY !== undefined) ? RRule.DAILY : 3;
        const WEEKLY_FREQ_VAL = (RRule && RRule.WEEKLY !== undefined) ? RRule.WEEKLY : 2;
        const MONTHLY_FREQ_VAL = (RRule && RRule.MONTHLY !== undefined) ? RRule.MONTHLY : 1;
        const YEARLY_FREQ_VAL = (RRule && RRule.YEARLY !== undefined) ? RRule.YEARLY : 0;
        
        switch (finalFreq) {
            case DAILY_FREQ_VAL:
                return ok({
                    frequency: GuildScheduledEventRecurrenceRuleFrequency.Daily,
                    interval: intervalValue,
                    count: limitedCount,
                    byWeekday: byweekday.map((w: any) => typeof w === 'object' && 'weekday' in w ? w.weekday : (typeof w === 'number' ? w : 1)),
                    startAt,
                });

            case WEEKLY_FREQ_VAL:
                // Extract weekday number from Weekday object or use number directly
                const weeklyByWeekday = byweekday.length > 0 
                    ? [byweekday[0]].map((w: any) => {
                        if (typeof w === 'number') {
                            return w; // Already a number (0-6)
                        } else if (typeof w === 'object' && w !== null) {
                            // Weekday object - extract weekday property
                            if ('weekday' in w) {
                                return w.weekday;
                            }
                            // If it's a Weekday instance, try to get the weekday number
                            // RRule Weekday objects have a weekday property
                            return (w as any).weekday ?? 0;
                        }
                        return 0; // Fallback to Monday
                    })
                    : [];
                
                return ok({
                    frequency: GuildScheduledEventRecurrenceRuleFrequency.Weekly,
                    interval: intervalValue,
                    count: limitedCount,
                    byWeekday: weeklyByWeekday,
                    startAt,
                });

            case MONTHLY_FREQ_VAL:
                // Discord MONTHLY: Only supports byNWeekday (e.g., "second Monday")
                // If we don't have byNWeekday, this pattern is not supported
                if (!processedByNWeekday || processedByNWeekday.length === 0) {
                    return err(ErrorType.ErrorConvertingRRule);
                }

                return ok({
                    frequency: GuildScheduledEventRecurrenceRuleFrequency.Monthly,
                    interval: intervalValue,
                    count: limitedCount,
                    byNWeekday: processedByNWeekday,
                    startAt,
                });

            case YEARLY_FREQ_VAL:
                // For YEARLY events, Discord needs byMonth and byMonthDay to specify the date
                // If not provided in RRule, extract from startAt date
                let finalByMonth = bymonth ?? [];
                let finalByMonthDay = bymonthday ?? [];
                
                if (finalByMonth.length === 0 || finalByMonthDay.length === 0) {
                    // Extract month and day from startAt
                    const startDate = new Date(startAt);
                    const month = startDate.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
                    const day = startDate.getDate();
                    
                    if (finalByMonth.length === 0) {
                        finalByMonth = [month];
                    }
                    if (finalByMonthDay.length === 0) {
                        finalByMonthDay = [day];
                    }
                }
                
                return ok({
                    frequency: GuildScheduledEventRecurrenceRuleFrequency.Yearly,
                    interval: intervalValue,
                    count: limitedCount,
                    byMonth: finalByMonth,
                    byMonthDay: finalByMonthDay,
                    startAt,
                });

            default:
                return err(ErrorType.ErrorConvertingRRule);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDetails: ErrorDetails = {
            type: ErrorType.ErrorConvertingRRule,
            details: {
                message: `Failed to parse RRule string "${rruleString}": ${errorMessage}`,
            }
        };
        getErrorMessage(errorDetails);
        return err(ErrorType.UnknownError);
    }
}
