import { BotContext } from "../../context/context";
import { getUsersCount } from "../users/users.service";
import { isAdmin } from "../../core/isAdmin";

export function registerAdminCommands(bot: any) {
  bot.command("stats", async (ctx: BotContext) => {
    if (!isAdmin(ctx)) {
      return ctx.reply("⛔ Эта команда доступна только администратору");
    }

    const usersCount = getUsersCount();

    await ctx.reply(
      `📊 *Статистика бота*\n\n` + `👤 Пользователей: *${usersCount}*`,
      { parse_mode: "Markdown" },
    );
  });
}
