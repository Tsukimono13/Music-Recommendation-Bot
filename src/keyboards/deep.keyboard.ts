import { Markup } from "telegraf";

/** Клавиатура после выдачи рекомендаций: сначала «Копнуть глубже», затем основное меню */
export function getStartInlineKeyboardWithDeep() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("⛏️ Копнуть глубже", "FIND_DEEP")],
    [Markup.button.callback("🎸 Подобрать артистов", "FIND_ARTIST")],
    [
      Markup.button.callback("🍩 Поддержать", "SUPPORT"),
      Markup.button.callback("🪪 О проекте", "ABOUT"),
    ],
    [
      Markup.button.url("📻 Новости", "https://t.me/MusiGemBotNews"),
      Markup.button.callback("❓FAQ", "FAQ"),
    ],
    [Markup.button.callback("📋 Отправить фидбэк", "FEEDBACK")],
  ]);
}
