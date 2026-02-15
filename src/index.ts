// import "dotenv/config";
// import { createBot } from "./bot";
// import { startBackendPing } from "./backend";
// import { env } from "./env";
// import http from "http";

// const bot = createBot(env.BOT_TOKEN);

// // Обработка ошибок бота
// bot.catch((err, ctx) => {
//   console.error(`Error for ${ctx.updateType}:`, err);
// });

// async function start() {
//   try {
//     // Запускаем бота через long polling
//     await bot.launch();
//     console.log("🤖 Bot started with long polling");

//     // Render требует слушать process.env.PORT
//     const PORT = parseInt(process.env.PORT || "3000", 10);

//     const server = http.createServer((req, res) => {
//       if (req.url === "/health" && req.method === "GET") {
//         res.writeHead(200, { "Content-Type": "application/json" });
//         res.end(
//           JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
//         );
//       } else {
//         res.writeHead(404, { "Content-Type": "application/json" });
//         res.end(JSON.stringify({ error: "Not found" }));
//       }
//     });

//     server.listen(PORT, "0.0.0.0", () => {
//       console.log(`🏥 Server listening on port ${PORT}`);
//     });

//     // Пинг бэкенда (если нужно)
//     startBackendPing();
//   } catch (error: any) {
//     console.error("Failed to start bot:", error);

//     if (error.response?.error_code === 409) {
//       console.error(
//         "⚠️ Another bot instance is already running. " +
//           "Please stop other instances (local or on Render) before starting this one.",
//       );
//     }

//     process.exit(1);
//   }
// }

// start();

// // Корректное завершение работы
// const gracefulShutdown = (signal: string) => {
//   console.log(`Received ${signal}, shutting down gracefully...`);
//   bot.stop(signal);
//   process.exit(0);
// };

// process.once("SIGINT", () => gracefulShutdown("SIGINT"));
// process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));
import "dotenv/config";
import { createBot } from "./bot";
import { startBackendPing } from "./backend";
import { env } from "./env";
import http from "http";
import { startWebhookServer } from "./health";

const bot = createBot(env.BOT_TOKEN);

// Обработка ошибок бота
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
});

async function start() {
  try {
    // Webhook нужен на Render (иначе 409). При первом деплое RENDER_EXTERNAL_URL может быть пуст — задайте WEBHOOK_URL вручную (https://<service-name>.onrender.com)
    const baseUrl = process.env.WEBHOOK_URL || process.env.RENDER_EXTERNAL_URL;

    if (baseUrl) {
      // Сначала поднимаем сервер на PORT, чтобы Render увидел открытый порт
      startWebhookServer(bot);
      const webhookPath = "/webhook";
      const fullWebhookUrl = `${baseUrl.replace(/\/$/, "")}${webhookPath}`;
      await bot.telegram.setWebhook(fullWebhookUrl);
      console.log(`🔗 Webhook: ${fullWebhookUrl}`);
      console.log("🤖 Bot started (webhook)");
    } else {
      await bot.launch();
      console.log("🤖 Bot started (long polling)");
      const PORT = parseInt(process.env.PORT || "3000", 10);
      const server = http.createServer((req, res) => {
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
      server.listen(PORT, "0.0.0.0", () => {
        console.log(`🏥 Health server on port ${PORT}`);
      });
    }

    startBackendPing();
  } catch (error: any) {
    console.error("Failed to start bot:", error);
    if (error.response?.error_code === 409) {
      console.error(
        "⚠️ 409: use webhook on Render. Set WEBHOOK_URL to your service URL (e.g. https://your-app.onrender.com)"
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
