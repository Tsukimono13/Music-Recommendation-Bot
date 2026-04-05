import { Telegraf } from "telegraf";
import { getStartInlineKeyboard, getStartInlineKeyboardWithShare } from "../keyboards/start.keyboard";
import { getStartInlineKeyboardWithDeep } from "../keyboards/deep.keyboard";
import {
  formatDeepDiveHTMLPaginated,
  hasDeepDiveContent,
} from "../utils/formattedRecommendations";
import { buildShareUrl } from "../utils/shareText";
import type { BotContext } from "../context/context";

export function registerArtistActions(bot: Telegraf<BotContext>) {
  bot.action("FIND_ARTIST", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter("find-artist");
  });

  bot.action("FIND_DEEP", async (ctx) => {
    await ctx.answerCbQuery();
    const result = ctx.session?.lastRecommendResult;
    if (!result || !hasDeepDiveContent(result)) {
      await ctx.reply("По этому запросу больше нечего показать.", getStartInlineKeyboard());
      return;
    }
    const offset = ctx.session?.deepDiveOffset ?? 0;
    const { text, hasMore } = formatDeepDiveHTMLPaginated(result, {
      offset,
      limit: 9,
    });
    const shareUrl = buildShareUrl(result);
    let keyboard;
    if (hasMore) {
      keyboard = getStartInlineKeyboardWithDeep(shareUrl);
    } else {
      keyboard = getStartInlineKeyboardWithShare(shareUrl);
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      ...keyboard,
    });
    if (hasMore) {
      ctx.session.deepDiveOffset = offset + 9;
    } else {
      ctx.session.lastRecommendResult = undefined;
      ctx.session.deepDiveOffset = undefined;
    }
  });
}
