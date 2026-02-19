// src/scenes/feedbacks.scene.ts
import { Scenes, Markup } from "telegraf";
import { getStartInlineKeyboard } from "../keyboards/start.keyboard";
import { escapeMarkdownV2 } from "../utils/markdown";
import { env } from "../env";
import { getCancelKeyboard } from "../keyboards/cancel.keyboard";

const feedbackChannelId = env.FEEDBACK_CHANNEL_ID;

if (!feedbackChannelId) {
  console.warn("⚠️ FEEDBACK_CHANNEL_ID не установлен. Фидбэки не будут отправляться в канал.");
}

export const feedbackScene = new Scenes.BaseScene<Scenes.SceneContext>(
  "feedback",
);

feedbackScene.enter(async (ctx) => {
  try {
    await ctx.reply("\u200B", Markup.removeKeyboard());
    await ctx.reply(
      `*${escapeMarkdownV2("📋 Отправить фидбэк")}*` +
        `\n\n${escapeMarkdownV2(
          "В следующем сообщении опиши:\n- идею или пожелание.\n- баг или странное поведение бота.\n- общее мнение о проекте.",
        )}` +
        `\n\n${escapeMarkdownV2("Сообщение отправится напрямую нам. Мы читаем всё и учитываем это при развитии ")} *${escapeMarkdownV2("MusiGem.")}*` +
        `\n\n${escapeMarkdownV2("Мы не увидим твоё имя и ссылку на профиль, если ты сам(а) не укажешь их в сообщении.")}` +
        `\n\n${escapeMarkdownV2("Если ты попал(а) в этот раздел случайно, просто нажми кнопку  ")} *${escapeMarkdownV2("❌ Отмена")}* ${escapeMarkdownV2("ниже ⬇️")}`,
      { parse_mode: "MarkdownV2", ...getCancelKeyboard() },
    );
  } catch (err) {
    console.error("Feedback scene enter error:", err);
    await ctx.reply(
      "📋 Отправить фидбэк\n\nВ следующем сообщении опиши идею, баг или отзыв. Сообщение отправится нам. Если попал(а) сюда случайно — нажми ❌ Отмена ниже.",
      getCancelKeyboard(),
    );
  }
});

feedbackScene.on("text", async (ctx) => {
  const text = ctx.message.text.trim();

  if (!text.length) {
    return ctx.reply("⚠️ Введи текст фидбэка или нажми ❌ Отмена");
  }

  await ctx.reply("📨 Передаю сообщение...");

  if (!feedbackChannelId) {
    await ctx.reply(
      "⚠️ Канал для фидбэков не настроен. Сообщение не отправлено.",
      getStartInlineKeyboard(),
    );
    return ctx.scene.leave();
  }

  try {
    await ctx.telegram.sendMessage(
      feedbackChannelId,
      `Новый фидбэк:\n\n${escapeMarkdownV2(text)}`,
      { parse_mode: "MarkdownV2" },
    );

    await ctx.reply(
      `*${escapeMarkdownV2("✅ Спасибо за фидбэк!")}*` +
        `\n\n${escapeMarkdownV2("Мы обязательно его прочитаем.")}`,
      { parse_mode: "MarkdownV2", ...getStartInlineKeyboard() },
    );
  } catch (error: any) {
    console.error("Ошибка при отправке фидбэка:", error);
    
    let errorMessage = "⚠️ Не удалось отправить фидбэк. Попробуй позже.";
    
    if (error.response?.description?.includes("chat not found")) {
      errorMessage = "⚠️ Канал для фидбэков не найден. Проверьте настройки бота.";
      console.error("Канал не найден. Убедитесь, что бот добавлен в канал и FEEDBACK_CHANNEL_ID правильный.");
    }
    
    await ctx.reply(errorMessage, getStartInlineKeyboard());
  }

  return ctx.scene.leave();
});

feedbackScene.on("message", async (ctx) => {
  await ctx.reply(
    "Пожалуйста, отправь текстовое сообщение или нажми ❌ Отмена",
  );
});
