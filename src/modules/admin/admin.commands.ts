import { Telegraf } from "telegraf";
import type { BotContext } from "../../context/context";
import { getUsers, getUsersCount } from "../users/users.service";
import { getMetricsSummary } from "../metrics/metrics.service";
import { isAdmin } from "../../core/isAdmin";

export function registerAdminCommands(bot: Telegraf<BotContext>) {
  bot.command("stats", async (ctx) => {
    if (!isAdmin(ctx)) {
      return ctx.reply("⛔ Эта команда доступна только администратору");
    }

    const count = await getUsersCount();

    await ctx.reply(
      `📊 <b>Статистика бота</b>\n\n👤 Пользователей: <b>${count}</b>\n\nСписок: /stats_list\nМетрики: /metrics`,
      { parse_mode: "HTML" },
    );
  });

  bot.command("stats_list", async (ctx) => {
    if (!isAdmin(ctx)) {
      return ctx.reply("⛔ Эта команда доступна только администратору");
    }

    const users = await getUsers();
    if (!users.length) {
      return ctx.reply("📋 Список пуст.");
    }
    const lines = users.map((u, i) => {
      const name = u.firstName ?? "—";
      const username = u.username ? `@${u.username}` : "—";
      const date = u.startedAt.slice(0, 10);
      return `${i + 1}. ${u.id} | ${username} | ${name} | ${date}`;
    });
    const maxLen = 4000;
    const listText = "📋 Список пользователей\n\n" + lines.join("\n");
    if (listText.length <= maxLen) {
      await ctx.reply(listText);
    } else {
      const chunkSize = 80;
      for (let i = 0; i < lines.length; i += chunkSize) {
        const chunk = lines.slice(i, i + chunkSize).join("\n");
        await ctx.reply(
          `📋 Список (${i + 1}–${Math.min(i + chunkSize, lines.length)} из ${lines.length})\n\n${chunk}`,
        );
      }
    }
  });

  bot.command("metrics", async (ctx) => {
    if (!isAdmin(ctx)) {
      return ctx.reply("⛔ Эта команда доступна только администратору");
    }

    const m = await getMetricsSummary();

    if (m.total === 0) {
      return ctx.reply("📈 Метрик пока нет.");
    }

    const errorRate = m.total ? Math.round((m.errors / m.total) * 100) : 0;

    let text = `📈 <b>Метрики (последние 100 запросов)</b>\n\n`;
    text += `Всего запросов: <b>${m.total}</b>\n`;
    text += `Ошибки: <b>${m.errors}</b> (${errorRate}%)\n`;
    text += `Таймауты: <b>${m.timeouts}</b>\n`;
    text += `Пустые результаты: <b>${m.empty}</b>\n`;
    text += `Среднее время ответа: <b>${m.avgResponseMs}ms</b>\n`;

    if (m.topQueries.length) {
      text += `\n<b>Топ запросов:</b>\n`;
      text += m.topQueries
        .map((q, i) => `${i + 1}. ${q.query} (${q.count}x)`)
        .join("\n");
    }

    if (m.slowQueries.length) {
      text += `\n\n<b>Самые медленные:</b>\n`;
      text += m.slowQueries
        .map((q) => `${q.query} — ${(q.responseMs / 1000).toFixed(1)}s`)
        .join("\n");
    }

    if (m.recentQueries.length) {
      text += `\n\n<b>Последние запросы:</b>\n`;
      text += m.recentQueries
        .map((q) => {
          const status = q.error ? `[${q.error}]` : `${q.resultCount} рез.`;
          const src = q.source === "inline" ? " (inline)" : "";
          return `${q.query} — ${status}, ${(q.responseMs / 1000).toFixed(1)}s${src}`;
        })
        .join("\n");
    }

    await ctx.reply(text, { parse_mode: "HTML" });
  });
}
