import cron from "node-cron";
import fs from "fs";
import path from "path";
import { Telegraf } from "telegraf";
import { getUserIds } from "../modules/users/users.service";
import { redis } from "../storage/redis";

const REDIS_FACTS_KEY = "bot:facts";
const LOCAL_FACTS_FILE = path.join(process.cwd(), "src", "data", "facts.json");

const CRON_SCHEDULE = "0 10 * * *";
const CRON_TIMEZONE = "Europe/Moscow";

function getFactIndexForToday(totalFacts: number): number {
  const moscowDateStr = new Date().toLocaleDateString("en-CA", {
    timeZone: "Europe/Moscow",
  });
  const [y, m, d] = moscowDateStr.split("-").map(Number);
  const dayKey = y * 10000 + m * 100 + d;
  return dayKey % totalFacts;
}

async function loadFacts(): Promise<string[]> {
  // Try Redis first
  if (redis) {
    const stored = await redis.lrange(REDIS_FACTS_KEY, 0, -1);
    if (stored.length > 0) {
      return stored as string[];
    }
  }

  // Fallback to local file
  if (fs.existsSync(LOCAL_FACTS_FILE)) {
    const facts: string[] = JSON.parse(
      fs.readFileSync(LOCAL_FACTS_FILE, "utf-8"),
    );
    // Seed Redis if available
    if (redis && facts.length > 0) {
      await redis.del(REDIS_FACTS_KEY);
      await redis.rpush(REDIS_FACTS_KEY, ...facts);
      console.log(`📅 Seeded ${facts.length} facts into Redis`);
    }
    return facts;
  }

  return [];
}

export async function runDailyFactsNow(
  bot: Telegraf<any>,
): Promise<{ ok: boolean; sent: number; error?: string }> {
  const facts = await loadFacts();
  const userIds = await getUserIds();

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
