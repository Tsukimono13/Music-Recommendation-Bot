import { Markup } from "telegraf";
import type { InlineKeyboardButton } from "telegraf/types";

type Button = InlineKeyboardButton & { hide?: boolean };

export function getStartInlineKeyboardWithDeep(shareUrl?: string) {
  const rows: Button[][] = [
    [Markup.button.callback("⛏️ Копнуть глубже", "FIND_DEEP")],
  ];
  if (shareUrl) {
    rows.push([Markup.button.url("📤 Поделиться результатом", shareUrl)]);
  }
  rows.push(
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
  );
  return Markup.inlineKeyboard(rows);
}
