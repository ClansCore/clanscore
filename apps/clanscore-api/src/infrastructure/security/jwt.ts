import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { config } from "../../config";

const JWT_SECRET = config.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

export type JwtPayload = {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    nickname?: string;
};

declare module "express-serve-static-core" {
    interface Request {
        user?: JwtPayload;
    }
}

export function signToken(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
        return null;
    }
}

// Middleware: Extrahiert den User aus dem JWT-Token (falls vorhanden).
// Setzt req.user mit den User-Informationen. Blockiert NICHT wenn kein Token vorhanden ist (optional auth).
export function extractUser(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    
    if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const payload = verifyToken(token);
        if (payload) {
            req.user = payload;
        }
    }
    
    next();
}

// Middleware: Erfordert einen gültigen JWT-Token.
// Gibt 401 zurück wenn kein gültiger Token vorhanden ist.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized", message: "No token provided" });
    }
    
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (!payload) {
        return res.status(401).json({ error: "Unauthorized", message: "Invalid token" });
    }
    
    req.user = payload;
    next();
}

//Hilfsfunktion: Gibt den Namen des eingeloggten Users zurück.
export function getChangedByFromRequest(req: Request): string {
    if (!req.user) return "Dashboard";
    
    if (req.user.firstName && req.user.lastName) {
        return `${req.user.firstName} ${req.user.lastName}`;
    }
    
    return req.user.nickname || req.user.email || "Dashboard";
}

// Middleware: Erfordert PASSWORD_ADMIN role (check user.roles array from JWT or request)
// This checks if the user has the special PASSWORD_ADMIN role
export function requirePasswordAdmin(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized", message: "No token provided" });
    }
    
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (!payload) {
        return res.status(401).json({ error: "Unauthorized", message: "Invalid token" });
    }

    if (payload.userId === "admin") {
        req.user = payload;
        return next();
    }

    return res.status(403).json({ error: "Forbidden", message: "Password admin access required" });
}
