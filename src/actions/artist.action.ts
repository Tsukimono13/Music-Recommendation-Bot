import { Scenes } from "telegraf";
import { getStartInlineKeyboard } from "../keyboards/start.keyboard";
import { getStartInlineKeyboardWithDeep } from "../keyboards/deep.keyboard";
import {
  formatDeepDiveHTMLPaginated,
  hasDeepDiveContent,
  type RecommendResult,
} from "../utils/formatedRecommendations";

type SessionWithDeep = {
  lastRecommendResult?: RecommendResult;
  deepDiveOffset?: number;
};

export function registerArtistActions(bot: any) {
  bot.action("FIND_ARTIST", async (ctx: Scenes.SceneContext) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter("find-artist");
  });

  bot.action("FIND_DEEP", async (ctx: Scenes.SceneContext) => {
    await ctx.answerCbQuery();
    const session = ctx.session as SessionWithDeep | undefined;
    const result = session?.lastRecommendResult;
    if (!result || !hasDeepDiveContent(result)) {
      await ctx.reply("По этому запросу больше нечего показать.", getStartInlineKeyboard());
      return;
    }
    const offset = session?.deepDiveOffset ?? 0;
    const { text, hasMore } = formatDeepDiveHTMLPaginated(result, {
      offset,
      limit: 9,
    });
    await ctx.reply(text, {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      ...(hasMore ? getStartInlineKeyboardWithDeep() : getStartInlineKeyboard()),
    });
    if (session) {
      if (hasMore) {
        session.deepDiveOffset = offset + 9;
      } else {
        session.lastRecommendResult = undefined;
        session.deepDiveOffset = undefined;
      }
    }
  });
}
