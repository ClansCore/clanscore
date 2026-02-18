import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";

export const validateBody = (schema: ZodSchema) =>
    (req: Request, res: Response, next: NextFunction) => {
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ code:"DatabaseValidationError", details: parsed.error.flatten() });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (req as any).data = parsed.data;
        next();
    };
