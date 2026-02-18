import {
    ErrorType,
    ErrorDetails,
    Result,
    err,
} from "@clanscore/shared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleGoogleError(error: any): Result<never, ErrorDetails> {
    if (error.response?.status === 401)
        return err(ErrorType.InvalidAccessToken);
    if (error.response?.status === 403) return err(ErrorType.PermissionDenied);
    if (error.code === "ENOTFOUND") return err(ErrorType.NetworkFailure);
    return err(ErrorType.CalendarConnectionError);
}
