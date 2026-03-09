import { Scenes } from "telegraf";
import { getStartInlineKeyboard } from "../keyboards/start.keyboard";
import {
  formatDeepDiveHTML,
  hasDeepDiveContent,
  type RecommendResult,
} from "../utils/formatedRecommendations";

export function registerArtistActions(bot: any) {
  bot.action("FIND_ARTIST", async (ctx: Scenes.SceneContext) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter("find-artist");
  });

  bot.action("FIND_DEEP", async (ctx: Scenes.SceneContext) => {
    await ctx.answerCbQuery();
    const session = ctx.session as { lastRecommendResult?: RecommendResult } | undefined;
    const result = session?.lastRecommendResult;
    if (!result || !hasDeepDiveContent(result)) {
      await ctx.reply("По этому запросу больше нечего показать.", getStartInlineKeyboard());
      return;
    }
    const text = formatDeepDiveHTML(result);
    await ctx.reply(text, {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      ...getStartInlineKeyboard(),
    });
    if (session) session.lastRecommendResult = undefined;
  });
}
