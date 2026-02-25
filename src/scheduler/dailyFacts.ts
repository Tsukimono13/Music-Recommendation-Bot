import cron from "node-cron";
import fs from "fs";
import path from "path";
import { Telegraf } from "telegraf";

const DATA_DIR = path.join(process.cwd(), "src", "data");
const FACTS_FILE = path.join(DATA_DIR, "facts.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

// Каждый день в 10:00 по Москве
const CRON_SCHEDULE = "0 10 * * *";
const CRON_TIMEZONE = "Europe/Moscow";


function getFactIndexForToday(totalFacts: number): number {
  const moscowDateStr = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Moscow" });
  const [y, m, d] = moscowDateStr.split("-").map(Number);
  const dayKey = y * 10000 + m * 100 + d;
  return dayKey % totalFacts;
}

export async function runDailyFactsNow(bot: Telegraf<any>): Promise<{ ok: boolean; sent: number; error?: string }> {
  if (!fs.existsSync(FACTS_FILE) || !fs.existsSync(USERS_FILE)) {
    const msg = `facts.json or users.json not found (facts: ${FACTS_FILE}, users: ${USERS_FILE})`;
    console.log("⚠️", msg);
    return { ok: false, sent: 0, error: msg };
  }

  const facts: string[] = JSON.parse(fs.readFileSync(FACTS_FILE, "utf-8"));
  const users: { id: number }[] = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  const userIds = users.map((u) => u.id);

  if (!facts.length || !userIds.length) {
    console.log("ℹ️ No facts or no users");
    return { ok: false, sent: 0, error: "No facts or no users" };
  }

  const factIndex = getFactIndexForToday(facts.length);
  const fact = facts[factIndex];
  const message = `🧐 Факт дня\n\n${fact}`;

  let sent = 0;
  for (const userId of userIds) {
    try {
      await bot.telegram.sendMessage(userId, message);
      sent++;
    } catch {
      console.log("❌ Failed to send to", userId);
    }
  }

  return { ok: true, sent };
}

export function startDailyFacts(bot: Telegraf<any>) {
  console.log("📅 Daily facts: paths", { FACTS_FILE, USERS_FILE });

  cron.schedule(
    CRON_SCHEDULE,
    async () => {
      console.log("📅 Sending daily music fact (10:00 MSK)");
      await runDailyFactsNow(bot);
    },
    { timezone: CRON_TIMEZONE },
  );
  console.log("📅 Daily facts scheduler: 1 fact/day at 10:00 MSK");
}
