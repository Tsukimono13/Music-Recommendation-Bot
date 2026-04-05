import { Scenes, session, Telegraf } from "telegraf";
import { registerStartCommand } from "./commands/start.command";
import { registerArtistActions } from "./actions/artist.action";
import { registerAboutActions } from "./actions/about.action";
import { registerFaqActions } from "./actions/faq.action";
import { findArtistScene } from "./scenes/findArtist.scene";
import { supportScene } from "./scenes/support.scene";
import { registerSupportActions } from "./actions/support.action";
import { feedbackScene } from "./scenes/feedback.scene";
import { registerAdminCommands } from "./modules/admin/admin.commands";
import { registerFeedbackActions } from "./actions/feedback.action";
import { cancelMiddleware } from "./middlewares/cancel";
import { feedbackMiddleware } from "./middlewares/feedbackMiddleware";
import { unknownMessageMiddleware } from "./middlewares/unknownMessage";
import { antiFloodMiddleware } from "./middlewares/antiFlood";
import { handleLegacyKeyboard } from "./middlewares/legacyKeyboard";
import { registerInlineQuery } from "./inline/inlineQuery";
import { redisSessionStore } from "./storage/sessionStore";
import type { BotContext } from "./context/context";

export function createBot(token: string) {
  const bot = new Telegraf<BotContext>(token);

  bot.use(session({ store: redisSessionStore }));
  bot.use(antiFloodMiddleware);

  const stage = new Scenes.Stage<BotContext>([
    findArtistScene,
    supportScene,
    feedbackScene,
  ]);


  const stageMiddleware = stage.middleware();
  bot.use((ctx, next) => {
    const msg = ctx.message && "text" in ctx.message ? ctx.message.text : "";
    if (typeof msg === "string" && msg.trim().startsWith("/")) {
      return next();
    }
    return stageMiddleware(ctx, next);
  });
  bot.use(cancelMiddleware);
  bot.use(feedbackMiddleware);

  registerAdminCommands(bot);
  registerStartCommand(bot);

  registerArtistActions(bot);
  registerAboutActions(bot);
  registerFaqActions(bot);
  registerSupportActions(bot);
  registerFeedbackActions(bot);

  registerInlineQuery(bot);

  // Старая клавиатура: при нажатии на устаревшую кнопку отдаём новое меню
  bot.on("callback_query", handleLegacyKeyboard);

  bot.use(unknownMessageMiddleware);

  return bot;
}
