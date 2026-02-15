import "dotenv/config";
import { createBot } from "./bot";
import { startBackendPing } from "./backend";
import { env } from "./env";
import http from "http";

const bot = createBot(env.BOT_TOKEN);

// Обработка ошибок бота
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
});

async function start() {
  try {
    // Запускаем бота через long polling
    await bot.launch();
    console.log("🤖 Bot started with long polling");

    // Запускаем health сервер (для Render health checks)
    // Используем PORT от Render, если доступен
    const PORT = process.env.PORT
      ? parseInt(process.env.PORT, 10)
      : process.env.HEALTH_PORT
        ? parseInt(process.env.HEALTH_PORT, 10)
        : 3001;

    // Создаем простой health сервер (без webhook обработки)
    const healthServer = http.createServer((req, res) => {
      if (req.url === "/health" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "ok",
            timestamp: new Date().toISOString(),
          }),
        );
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not found" }));
      }
    });

    healthServer.listen(PORT, "0.0.0.0", () => {
      console.log(`🏥 Health server started on port ${PORT}`);
    });

    startBackendPing();
  } catch (error: any) {
    console.error("Failed to start bot:", error);
    
    // Если ошибка 409 - другой инстанс уже запущен
    if (error.response?.error_code === 409) {
      console.error(
        "⚠️ Another bot instance is already running. " +
        "Please stop other instances (local or on Render) before starting this one."
      );
    }
    
    process.exit(1);
  }
}

start();

// Корректное завершение работы
const gracefulShutdown = (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  bot.stop(signal);
  process.exit(0);
};

process.once("SIGINT", () => gracefulShutdown("SIGINT"));
process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));
