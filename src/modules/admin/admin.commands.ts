import { BotContext } from "../../context/context";
import { getUsers, getUsersCount } from "../users/users.service";
import { isAdmin } from "../../core/isAdmin";

export function registerAdminCommands(bot: any) {
  bot.command("stats", async (ctx: BotContext) => {
    if (!isAdmin(ctx)) {
      return ctx.reply("⛔ Эта команда доступна только администратору");
    }

    const text = ctx.message && "text" in ctx.message ? ctx.message.text : "";
    const args = text.split(/\s+/).slice(1);
    const showList = args[0]?.toLowerCase() === "list";

    const count = getUsersCount();

    if (showList) {
      const users = getUsers();
      if (!users.length) {
        return ctx.reply("📋 Список пуст.");
      }
      const lines = users.map((u, i) => {
        const name = u.firstName ?? "—";
        const username = u.username ? `@${u.username}` : "—";
        const date = u.startedAt.slice(0, 10);
        return `${i + 1}. ${u.id} | ${username} | ${name} | ${date}`;
      });
      const header = "📋 Список пользователей\n\n";
      const maxLen = 4000;
      const listText = header + lines.join("\n");
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
      return;
    }

    await ctx.reply(
      `📊 *Статистика бота*\n\n👤 Пользователей: *${count}*\n\n_Список: /stats list_`,
      { parse_mode: "Markdown" },
    );
  });
}
