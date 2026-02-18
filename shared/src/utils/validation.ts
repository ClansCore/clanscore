import { isAfter, isValid, parse } from "date-fns";
import {
    ErrorType,
    ErrorDetails,
    ok,
    Result,
    err,
} from "../errors/types.js";

export function validateEmail(
    email: string,
): Result<string | undefined, ErrorDetails> {
    if (email && !/\S+@\S+\.\S+/.test(email)) {
        return err(ErrorType.NotAValidEmailAddress, { email });
    }
    return ok(email);
}

export function validatePhone(phone: string): Result<string, ErrorDetails> {
    const phoneRegex = /^(\+|0)\d{7,}$/;
    if (!phoneRegex.test(phone)) {
        return err(ErrorType.NotAValidPhoneNumber, { phone });
    }
    return ok(phone);
}

export function validateDate(date: string): Result<string, ErrorDetails> {
    const parsedDate = parse(date, "dd.MM.yyyy", new Date());

    if (!isValid(parsedDate)) {
        return err(ErrorType.NotAValidDateFormat);
    }

    return ok(date);
}

export function validateEndDateAfterStartDate(
    startDate: string,
    endDate: string,
) {
    const parsedStartDate = parse(startDate, "dd.MM.yyyy", new Date());
    const parsedEndDate = parse(endDate, "dd.MM.yyyy", new Date());

    if (!isAfter(parsedEndDate, parsedStartDate)) {
        return err(ErrorType.EndDateNotAfterStartDate);
    }
    return ok(true);
}

export function validatePositiveInteger(
    str: string,
): Result<number, ErrorDetails> {
    const num = Number(str);
    if (Number.isInteger(num) && num > 0) {
        return ok(num);
    }
    return err(ErrorType.NotAValidPositiveInteger);
}

export function validatePositiveNumberWithMaxTwoDecimals(
    str: string,
): Result<number, ErrorDetails> {
    const num = Number(str);

    if (
        typeof num === "number" &&
        !isNaN(num) &&
        Number.isFinite(num) &&
        num > 0 &&
        Math.floor(num * 100) === num * 100
    ) {
        return ok(num);
    }

    return err(ErrorType.NotAValidPositiveInteger);
}
