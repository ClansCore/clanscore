import { connectDB } from "./infrastructure/database/db.init";
import { registerCronJobs } from "./infrastructure/cron/jobs";
import { createServer } from "./server";
import { config } from "./config";
import { ErrorType, ErrorDetails, getErrorMessage } from "@clanscore/shared";

async function main() {
    console.log("Connecting to database...");
    await connectDB();

    console.log("Starting server...");
    const app = createServer();
    app.listen(3000, () =>
        console.log(`API / OAuth server running at ${config.CLANSCORE_API_URL}`)
    );

    console.log("Registering Cron-Jobs...");
    registerCronJobs();
}

main().catch(err => {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorDetails: ErrorDetails = {
        type: ErrorType.UnknownError,
        details: {
            message: `Startup failed: ${errorMessage}`,
        }
    };
    getErrorMessage(errorDetails);
    process.exit(1);
});
