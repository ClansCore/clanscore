import express from "express";
import { config } from "../config";
import { webhookRouter } from "./routes/webhook.routes";

export function startHttpServer() {
    const app = express();
    app.use(express.json()); // use built-in parser

    app.get("/health", (_req, res) => res.json({ ok: true }));

    app.use("/api/notifications", webhookRouter);

    const port = config.DISCORD_SERVER_PORT;
    app.listen(port, () => {
        console.log(`🔔 Bot webhook server listening on http://localhost:${port}`);
    });
}
