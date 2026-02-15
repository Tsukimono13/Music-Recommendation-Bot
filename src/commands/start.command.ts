import { Context, Markup } from "telegraf";
import path from "path";
import { getStartInlineKeyboard } from "../keyboards/start.keyboard";
import { escapeMarkdownV2 } from "../utils/markdown";
import { saveUserIfNotExists } from "../modules/users/users.service";

export function registerStartCommand(bot: any) {
  bot.start(async (ctx: Context) => {
    if (ctx.from) {
      try {
        saveUserIfNotExists({
          id: ctx.from.id,
          username: ctx.from.username,
          firstName: ctx.from.first_name,
          startedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Failed to save user:", error);
      }
    }

    const username = escapeMarkdownV2(ctx.from?.first_name || "друг");

    const photoPath = path.resolve("assets/welcome.png");

    const text =
      `*${escapeMarkdownV2("Привет, ")}${username}${escapeMarkdownV2("!")}*` +
      `\n${escapeMarkdownV2("Я — бот, меня зовут ")}*${escapeMarkdownV2("MusiGem")}*${escapeMarkdownV2(".")}` +
      `\n\n${escapeMarkdownV2("Я помогаю находить новых артистов и группы, которые максимально совпадают с твоими музыкальными вкусами.")}` +
      `\n\n${escapeMarkdownV2("Для начала выбери одну из кнопок ниже.")}`;

    await ctx.replyWithPhoto(
      { source: photoPath },
      {
        caption: text,
        parse_mode: "MarkdownV2",
        ...getStartInlineKeyboard(),
      },
    );
  });
}
