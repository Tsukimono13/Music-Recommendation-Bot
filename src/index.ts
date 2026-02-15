import "dotenv/config";
import { createBot } from "./bot";
import { startBackendPing } from "./backend";
import { env } from "./env";
import { startHealthServer } from "./health";

const bot = createBot(env.BOT_TOKEN);

async function start() {
  await bot.launch();
  console.log("🤖 Bot started");

  startBackendPing();
  startHealthServer();
}

start();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
