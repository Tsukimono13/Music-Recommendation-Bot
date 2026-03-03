import { Scenes, session, Telegraf } from "telegraf";
import { registerStartCommand } from "./commands/start.command";
import { registerArtistActions } from "./actions/artist.action";
import { registerBetweenArtistActions } from "./actions/between-artist.action";
import { registerTagsActions } from "./actions/tags.action";
import { registerAboutActions } from "./actions/about.action";
import { findByArtistScene } from "./scenes/findByArtist.scene";
import { findBetweenArtistsScene } from "./scenes/findBetweenArtists.scene";
import { findByArtistTagScene } from "./scenes/findByArtistTag.scene";
import { registerArtistTagActions } from "./actions/artist-tag.action";
import { findByTagsScene } from "./scenes/findByTags.scene";
import { supportScene } from "./scenes/support.scene";
import { registerSupportActions } from "./actions/support.action";
import { feedbackScene } from "./scenes/feedback.scene";
import { registerAdminCommands } from "./modules/admin/admin.commands";
import { registerFeedbackActions } from "./actions/feedback.action";
import { cancelMiddleware } from "./middlewares/cancel";
import { feedbackMiddleware } from "./middlewares/feedbackMiddleware";
import { unknownMessageMiddleware } from "./middlewares/unknownMessage";
import { antiFloodMiddleware } from "./middlewares/antiFlood";

export function createBot(token: string) {
  const bot = new Telegraf<Scenes.SceneContext>(token);

  bot.use(session());
  bot.use(antiFloodMiddleware);

  const stage = new Scenes.Stage([
    findByArtistScene,
    findBetweenArtistsScene,
    findByArtistTagScene,
    findByTagsScene,
    supportScene,
    feedbackScene,
  ]);

  // Команды (например /stats list) должны обрабатываться даже в сцене — иначе stage перехватывает текст
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
  registerBetweenArtistActions(bot);
  registerTagsActions(bot);
  registerAboutActions(bot);
  registerArtistTagActions(bot);
  registerSupportActions(bot);
  registerAboutActions(bot);
  registerFeedbackActions(bot);

  bot.use(unknownMessageMiddleware);

  return bot;
}
