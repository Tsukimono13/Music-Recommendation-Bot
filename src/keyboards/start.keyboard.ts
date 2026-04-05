import { Markup } from "telegraf";

export function getStartInlineKeyboard() {
  return Markup.inlineKeyboard([
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

export function getStartInlineKeyboardWithShare(shareUrl: string) {
  return Markup.inlineKeyboard([
    [Markup.button.url("📤 Поделиться результатом", shareUrl)],
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
