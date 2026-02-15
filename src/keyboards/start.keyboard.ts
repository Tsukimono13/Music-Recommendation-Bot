import { Markup } from "telegraf";

export function getStartInlineKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("🎸 Артист", "FIND_BY_ARTIST"),
      Markup.button.callback("🎷🎻 Артисты", "FIND_BY_ARTIST+ARTIST"),
    ],
    [
      Markup.button.callback("🥁 Артисты+Тэги", "FIND_BY_ARTISTS+TAGS"),
      Markup.button.callback("#️⃣ Тэги", "FIND_BY_TAGS"),
    ],
    [
      Markup.button.callback("🍩 Поддержать", "SUPPORT"),
      Markup.button.callback("🪪 О проекте", "ABOUT"),
    ],
    [Markup.button.callback("📋 Отправить фидбэк", "FEEDBACK")],
  ]);
}
