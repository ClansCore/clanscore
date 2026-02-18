import { ErrorDetails, ErrorType, getErrorMessage, ErrorDetails as ErrorDetailsType } from "@clanscore/shared";

export function mapErrorToHttp(error: ErrorDetails) {
    const code = error.type;
    const status =
        code === ErrorType.DatabaseValidationError      ? 422 :
        code === ErrorType.PermissionDenied             ? 403 :
        code === ErrorType.UserNotFound                 ? 404 :
        code === ErrorType.RoleNotFound                 ? 404 :
        code === ErrorType.DonationAlreadyProcessed     ? 409 :
        code === ErrorType.NetworkFailure               ? 503 :
        400;

    return {
        status,
        body: {
            code,
            message: getErrorMessage(error),
            details: error.details,
        },
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function errorMiddleware(err: unknown, _req: any, res: any) {
    if (isErrorDetails(err)) {
        const { status, body } = mapErrorToHttp(err);
        return res.status(status).json(body);
    }
    // Fallback 500
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorDetails: ErrorDetailsType = {
        type: ErrorType.UnknownError,
        details: {
            message: `Unhandled error: ${errorMessage}`,
        }
    };
    getErrorMessage(errorDetails);
    return res.status(500).json({ code: ErrorType.UnknownError, message: "Interner Serverfehler" });
}

function isErrorDetails(x: unknown): x is ErrorDetails {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return !!x && typeof x === "object" && "type" in (x as any);
}
