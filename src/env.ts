export const env = {
  BOT_TOKEN: (process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN) as string,
  ADMIN_IDS: process.env.ADMIN_IDS
    ? process.env.ADMIN_IDS.split(",").map(Number)
    : [],
  FEEDBACK_CHANNEL_ID: process.env.FEEDBACK_CHANNEL_ID as string,
};

if (!env.BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not defined");
}
