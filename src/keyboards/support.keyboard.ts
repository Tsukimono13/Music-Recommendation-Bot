import { Markup } from "telegraf";

export function getSupportInlineKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("DonationAlerts", "DONATION_ALERTS"),
      Markup.button.callback("QR код", "QRCODE"),
    ],
  ]);
}
