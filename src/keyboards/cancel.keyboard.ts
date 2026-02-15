import { Markup } from "telegraf";

export function getCancelKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("❌ Отмена", "CANCEL")],
  ]);
}
