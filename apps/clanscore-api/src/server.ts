import express, { Request } from "express";
import helmet from "helmet";
import cors from "cors";
import { getErrorMessage } from "@clanscore/shared";
import { saveTokensFromOAuthCallback } from "./application/event/event-token.service";
import { errorHandler } from "./presentation/middleware/error.middleware";
import { extractUser } from "./infrastructure/security/jwt";
import { api } from "./presentation";
import { config } from "./config";

export function createServer() {
    const app = express();
    
    // CORS-Konfiguration: Unterstützt mehrere Origins (komma-separiert)
    const allowedOrigins = config.CORS_ORIGIN 
        ? config.CORS_ORIGIN.split(',').map(o => o.trim())
        : ['http://localhost:4200', 'http://localhost', 'http://localhost:80'];
    
    // CORS vor Helmet, damit CORS-Header nicht blockiert werden
    app.use(cors({
        origin: (origin, callback) => {
            // Erlaube Requests ohne Origin (z.B. Postman, curl)
            if (!origin) return callback(null, true);
            
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            }
        },
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
        exposedHeaders: ['Content-Type', 'Authorization']
    }));
    
    app.use(helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        crossOriginEmbedderPolicy: false
    }));
    app.use(express.json());

    // Health check endpoint
    app.get("/health", (_req, res) => {
        res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    app.get("/calendarToken", async (req: Request, res) => {
        const authCode = req.query.code as string;
        const guildId = req.query.state as string;
        if (!authCode || !guildId) return res.status(400).send("Invalid request.");
        const saveTokensResult = await saveTokensFromOAuthCallback(authCode);
        if (!saveTokensResult.ok) {
            return res.status(500).send(getErrorMessage(saveTokensResult.error));
        }
        return res.send("Kalender wurde erfolgreich verbunden. Sie können diese Seite nun schliessen.");
    });

    // User aus JWT extrahieren (falls vorhanden)
    app.use(extractUser);
    
    app.use("/api", api);
    
    // 404 handler for undefined routes
    app.use((req, res, next) => {
        if (req.path.startsWith("/api")) {
            return res.status(404).json({
                code: "NotFound",
                message: `Cannot ${req.method} ${req.path}`,
            });
        }
        next();
    });
    
    app.use(errorHandler);

    return app;
}
