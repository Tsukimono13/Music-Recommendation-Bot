import "dotenv/config";
import { createBot } from "./bot";
import { startBackendPing } from "./backend";
import { env } from "./env";
import http from "http";
import type { Telegraf } from "telegraf";

const bot = createBot(env.BOT_TOKEN);

bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
});

const PORT = parseInt(process.env.PORT || "3000", 10);
const WEBHOOK_PATH = "/webhook";

function startWebhookServer(bot: Telegraf<any>) {
  const server = http.createServer(async (req, res) => {
    // Health endpoint
    if (req.url === "/health" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
      );
      return;
    }

    // Webhook endpoint
    if (req.url === WEBHOOK_PATH && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", async () => {
        try {
          const update = JSON.parse(body);
          await bot.handleUpdate(update);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true }));
        } catch (error) {
          console.error("Webhook error:", error);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Internal server error" }));
        }
      });
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🏥 Webhook & Health server listening on port ${PORT}`);
  });

  return server;
}

async function start() {
  try {
    startWebhookServer(bot);
    startBackendPing();

    const baseUrl = process.env.WEBHOOK_URL || process.env.RENDER_EXTERNAL_URL;
    if (baseUrl) {
      const fullWebhookUrl = `${baseUrl.replace(/\/$/, "")}${WEBHOOK_PATH}`;
      await bot.telegram.setWebhook(fullWebhookUrl);
      console.log(`🔗 Webhook set: ${fullWebhookUrl}`);
    } else {
      await bot.launch();
      console.log("🤖 Bot started with long polling");
    }
  } catch (error: any) {
    console.error("Failed to start bot:", error);
    process.exit(1);
  }
}

start();

const gracefulShutdown = (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  bot.stop(signal);
  process.exit(0);
};

process.once("SIGINT", () => gracefulShutdown("SIGINT"));
process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));
