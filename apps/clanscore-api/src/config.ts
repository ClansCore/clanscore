import dotenv from "dotenv";
import path from "path";

// Pfad zur zentralen .env Datei im Root-Verzeichnis
function getRootDir(): string {
    if (typeof __dirname !== "undefined") {
        // CommonJS
        return path.resolve(__dirname, "../../../");
    }
    
    const cwd = process.cwd();
    if (path.basename(cwd) === "clanscore") {
        return cwd;
    }
    let current = cwd;
    while (current !== path.dirname(current)) {
        if (path.basename(current) === "clanscore") {
            return current;
        }
        current = path.dirname(current);
    }
    return cwd;
}

const rootDir = getRootDir();
const envPath = path.resolve(rootDir, ".env");
dotenv.config({ path: envPath });

const {
    MONGO_DB,
    MONGO_HOST,
    MONGO_PORT,
    MONGO_INITDB_ROOT_USERNAME,
    MONGO_INITDB_ROOT_PASSWORD,

    DISCORD_GUILD_ID,
    DISCORD_SERVER_PORT,

    WEBHOOK_SHARED_SECRET,
    DISCORD_BOT_WEBHOOK_URL,

    GOOGLE_CALENDAR_CLIENT_ID,
    GOOGLE_CALENDAR_CLIENT_SECRET,
    GOOGLE_CALENDAR_REDIRECT_URI,

    CLANSCORE_ADMIN_USERNAME,
    CLANSCORE_ADMIN_PW,
    CLANSCORE_API_KEY,
    CLANSCORE_API_URL,
    JWT_SECRET,
    CORS_ORIGIN,

    TIME_RANGE_MONTHS,
    MAX_EVENTS
} = process.env;

const requiredVars: Record<string, string | undefined> = {
    MONGO_INITDB_ROOT_USERNAME,
    MONGO_INITDB_ROOT_PASSWORD,
    DISCORD_GUILD_ID,
    WEBHOOK_SHARED_SECRET,
    GOOGLE_CALENDAR_CLIENT_ID,
    GOOGLE_CALENDAR_CLIENT_SECRET,
    CLANSCORE_ADMIN_PW,
    CLANSCORE_API_KEY,
    JWT_SECRET
};

const missingVars = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables:\n  - ${missingVars.join("\n  - ")}\n\nPlease set these variables in your .env file or environment.`;
    console.error(errorMessage);
    throw new Error(errorMessage);
}

export const config = {
    MONGO_DB: MONGO_DB ?? "clanscore",
    MONGO_HOST: MONGO_HOST ?? "localhost",
    MONGO_PORT: MONGO_PORT ?? 27017,
    MONGO_INITDB_ROOT_USERNAME: MONGO_INITDB_ROOT_USERNAME!,
    MONGO_INITDB_ROOT_PASSWORD: MONGO_INITDB_ROOT_PASSWORD!,

    DISCORD_GUILD_ID: DISCORD_GUILD_ID!,
    DISCORD_SERVER_PORT: DISCORD_SERVER_PORT ?? 3001,

    WEBHOOK_SHARED_SECRET: WEBHOOK_SHARED_SECRET!,
    DISCORD_BOT_WEBHOOK_URL: DISCORD_BOT_WEBHOOK_URL ?? `http://localhost:${DISCORD_SERVER_PORT ?? 3001}`,

    GOOGLE_CALENDAR_CLIENT_ID: GOOGLE_CALENDAR_CLIENT_ID!,
    GOOGLE_CALENDAR_CLIENT_SECRET: GOOGLE_CALENDAR_CLIENT_SECRET!,
    GOOGLE_CALENDAR_REDIRECT_URI: GOOGLE_CALENDAR_REDIRECT_URI ?? "http://localhost:3000/calendarToken",

    CLANSCORE_ADMIN_USERNAME: CLANSCORE_ADMIN_USERNAME ?? "admin",
    CLANSCORE_ADMIN_PW: CLANSCORE_ADMIN_PW!,
    CLANSCORE_API_KEY: CLANSCORE_API_KEY!,
    CLANSCORE_API_URL: CLANSCORE_API_URL ?? "http://localhost:3000/api",
    JWT_SECRET: JWT_SECRET!,
    CORS_ORIGIN: CORS_ORIGIN ?? "http://localhost:4200",

    TIME_RANGE_MONTHS: TIME_RANGE_MONTHS ?? 12,
    MAX_EVENTS: MAX_EVENTS ?? 50,
};
