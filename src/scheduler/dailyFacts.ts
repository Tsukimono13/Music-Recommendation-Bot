import cron from "node-cron";
import fs from "fs";
import path from "path";
import { Telegraf } from "telegraf";

const FACTS_FILE = path.join(process.cwd(), "src", "data", "facts.json");
const USERS_FILE = path.join(process.cwd(), "src", "data", "users.json");
const STATE_FILE = path.join(process.cwd(), "factsState.json");

// Каждый день в 10:00 по Москве
const CRON_SCHEDULE = "0 10 * * *";
const CRON_TIMEZONE = "Europe/Moscow";

function getState(totalFacts: number) {
  if (!fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ index: 0 }));
  }

  const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));

  if (state.index >= totalFacts) {
    state.index = 0;
  }

  return state;
}

function saveState(index: number) {
  fs.writeFileSync(STATE_FILE, JSON.stringify({ index }));
}

export function startDailyFacts(bot: Telegraf<any>) {
  cron.schedule(
    CRON_SCHEDULE,
    async () => {
      console.log("📅 Sending daily music fact (10:00 MSK)");

      if (!fs.existsSync(FACTS_FILE) || !fs.existsSync(USERS_FILE)) {
        console.log("⚠️ facts.json or users.json not found");
        return;
      }

      const facts: string[] = JSON.parse(fs.readFileSync(FACTS_FILE, "utf-8"));

      const users: { id: number }[] = JSON.parse(
        fs.readFileSync(USERS_FILE, "utf-8"),
      );
      const userIds = users.map((u) => u.id);

      if (!facts.length || !userIds.length) {
        console.log("ℹ️ No facts or no users");
        return;
      }

      const state = getState(facts.length);
      const fact = facts[state.index];

      const message = `🧐 Факт дня\n\n${fact}`;

      for (const userId of userIds) {
        try {
          await bot.telegram.sendMessage(userId, message);
        } catch {
          console.log("❌ Failed to send to", userId);
        }
      }

      saveState(state.index + 1);
    },
    { timezone: CRON_TIMEZONE },
  );
  console.log("📅 Daily facts scheduler: 1 fact/day at 10:00 MSK");
}
