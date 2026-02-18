import mongoose from "mongoose";
import { err, ErrorDetails, ErrorType, Result, getErrorMessage } from "@clanscore/shared";

export function handleMongooseError(error: unknown): Result<never, ErrorDetails> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails: ErrorDetails = {
        type: ErrorType.DatabaseGenericError,
        details: {
            message: `DatabaseError: ${errorMessage}`,
        }
    };
    getErrorMessage(errorDetails);

    if (error instanceof mongoose.Error.CastError)
        return err(ErrorType.DatabaseCastError);

    if (error instanceof mongoose.Error.DocumentNotFoundError)
        return err(ErrorType.DatabaseEntryNotFound);

    if (error instanceof mongoose.Error.ValidationError)
        return err(ErrorType.DatabaseValidationError);

    if (error instanceof mongoose.Error)
        return err(ErrorType.DatabaseGenericError);

    return err(ErrorType.DatabaseConnectionError);
}
