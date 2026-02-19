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
  bot.use(cancelMiddleware);

  const stage = new Scenes.Stage([
    findByArtistScene,
    findBetweenArtistsScene,
    findByArtistTagScene,
    findByTagsScene,
    supportScene,
    feedbackScene,
  ]);

  bot.use(stage.middleware());
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
