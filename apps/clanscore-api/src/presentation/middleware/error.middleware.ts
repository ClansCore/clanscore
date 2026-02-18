// interfaces/http/error.middleware.ts
import { ErrorDetails, ErrorType, getErrorMessage } from "@clanscore/shared";
import { Request, Response, NextFunction } from "express";

const codeMap: Partial<Record<ErrorType, number>> = {
    UserNotFound: 404,
    RoleNotFound: 404,
    TaskNotFound: 404,
    EventNotFound: 404,
    DonationNotFound: 404,
    LeaderboardNotFound: 404,
    LeaderboardEntryNotFound: 404,
    PermissionDenied: 403,
    DatabaseValidationError: 400,
    NotAValidEmailAddress: 400,
    NotAValidPhoneNumber: 400,
    NotAValidDateFormat: 400,
    EndDateNotAfterStartDate: 400,
    // …
    UnknownError: 500,
    DatabaseGenericError: 500,
    DatabaseConnectionError: 503,
    NetworkFailure: 503,
    NotFound: 404,
} as const;

export function sendError(res: Response, err: ErrorDetails) {
    const status = codeMap[err.type] ?? 500;
    return res.status(status).json({
        code: err.type,
        message: getErrorMessage(err),
        details: err.details ?? undefined,
    });
}

export function errorHandler(
    err: unknown,
    _req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction
) {
    const details = (err as { error?: ErrorDetails })?.error as ErrorDetails | undefined;
    if (details) return sendError(res, details);
    return res.status(500).json({ code: "UnknownError", message: "UnknownError" });
}
