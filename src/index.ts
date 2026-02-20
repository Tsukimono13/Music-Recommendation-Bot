import "dotenv/config";
import { createBot } from "./bot";
import { startBackendPing } from "./backend";
import { env } from "./env";
import http from "http";
import type { Telegraf } from "telegraf";
import { runDailyFactsNow, startDailyFacts } from "./scheduler/dailyFacts";

const bot = createBot(env.BOT_TOKEN);

bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
});

const PORT = parseInt(process.env.PORT || "3000", 10);
const WEBHOOK_PATH = "/webhook";

function getPathname(url: string | undefined): string {
  if (!url) return "";
  const pathname = url.split("?")[0] ?? "";
  return pathname.endsWith("/") && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname;
}

function startWebhookServer(bot: Telegraf<any>) {
  const server = http.createServer(async (req, res) => {
    const pathname = getPathname(req.url);

    // Health endpoint
    if (pathname === "/health" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
      );
      return;
    }

    if (pathname === "/cron/daily-fact" && req.method === "GET") {
      const urlParams = new URLSearchParams((req.url ?? "").split("?")[1] ?? "");
      const secret = process.env.CRON_SECRET;
      if (secret && urlParams.get("secret") !== secret) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "Forbidden" }));
        return;
      }
      try {
        const result = await runDailyFactsNow(bot);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (e) {
        console.error("cron daily-fact error:", e);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: String(e) }));
      }
      return;
    }

    // Webhook endpoint
    if (pathname === WEBHOOK_PATH && req.method === "POST") {
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

    startDailyFacts(bot as Parameters<typeof startDailyFacts>[0]);
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
