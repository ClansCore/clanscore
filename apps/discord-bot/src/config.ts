import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Pfad zur zentralen .env Datei im Root-Verzeichnis
function getRootDir(): string {
    if (typeof __dirname !== "undefined") {
        // CommonJS
        return path.resolve(__dirname, "../../../");
    }
    
    try {
        // @ts-ignore - TypeScript beschwert sich, aber tsx unterstützt es zur Laufzeit
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        return path.resolve(__dirname, "../../../");
    } catch {
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
}

const rootDir = getRootDir();
const envPath = path.resolve(rootDir, ".env");
dotenv.config({ path: envPath });

const {
    DISCORD_CLIENT_ID,
    DISCORD_GUILD_ID,
    DISCORD_TOKEN,

    WEBHOOK_SHARED_SECRET,
    DISCORD_BOT_WEBHOOK_URL,
    DISCORD_SERVER_PORT,

    CLANSCORE_API_KEY,
    CLANSCORE_API_URL,

    MANUAL_URL,
    STATUTEN_URL,
    TERMS_OF_SERVICE_URL,
    
    TIME_RANGE_MONTHS,
    MAX_DISCORD_RECURRENCE_COUNT,
} = process.env;

const requiredVars: Record<string, string | undefined> = {
    DISCORD_CLIENT_ID,
    DISCORD_GUILD_ID,
    DISCORD_TOKEN,
    WEBHOOK_SHARED_SECRET,
    CLANSCORE_API_KEY
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
    DISCORD_TOKEN: DISCORD_TOKEN!,
    DISCORD_CLIENT_ID: DISCORD_CLIENT_ID!,
    DISCORD_GUILD_ID: DISCORD_GUILD_ID!,
    DISCORD_SERVER_PORT: DISCORD_SERVER_PORT ?? 3001,
    
    WEBHOOK_SHARED_SECRET: WEBHOOK_SHARED_SECRET!,
    DISCORD_BOT_WEBHOOK_URL: DISCORD_BOT_WEBHOOK_URL ?? `http://localhost:${DISCORD_SERVER_PORT ? parseInt(DISCORD_SERVER_PORT, 10) : 3001}`,

    CLANSCORE_API_KEY: CLANSCORE_API_KEY!,
    CLANSCORE_API_URL: CLANSCORE_API_URL ?? "http://localhost:3000/api",

    MANUAL_URL: MANUAL_URL ?? "https://clanscore.github.io/clanscore-doc-pub/bot/manual/",
    STATUTEN_URL: STATUTEN_URL ?? "<link_zu_den_statuten>",
    TERMS_OF_SERVICE_URL: TERMS_OF_SERVICE_URL ?? "<link_zum_Datenschutz>",
    
    TIME_RANGE_MONTHS: TIME_RANGE_MONTHS ?? 12,
    MAX_DISCORD_RECURRENCE_COUNT: MAX_DISCORD_RECURRENCE_COUNT ?? 5,
};
