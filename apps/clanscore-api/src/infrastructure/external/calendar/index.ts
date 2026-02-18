import {
    ErrorType,
    err,
    ok,
    ErrorDetails,
    Result,
} from "@clanscore/shared";
import { CalendarProvider } from "./CalendarProvider";
import { GoogleCalendarProvider } from "./GoogleCalendarProvider";

export function getCalendarProvider(
    providerName: string,
): Result<CalendarProvider, ErrorDetails> {
    switch (providerName) {
        case "google":
            return ok(new GoogleCalendarProvider());
        default:
            return err(ErrorType.UnknownCalendarProvider);
    }
}
