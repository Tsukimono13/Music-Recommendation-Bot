import { Scenes } from "telegraf";
import { getStartInlineKeyboard } from "../keyboards/start.keyboard";
import { escapeMarkdownV2 } from "../utils/markdown";
import { findByArtistTag } from "../api/music.api";
import { formatRecommendationHTML } from "../utils/formatedRecommendations";
import { notFoundMultipleArtistsMessage } from "../consts/errors";
import { getUserErrorMessage } from "../utils/errorHandler";

type SceneState = {
  artists?: string[];
  tags?: string[];
};

export const findByArtistTagScene = new Scenes.BaseScene<
  Scenes.SceneContext & { scene: { state: SceneState } }
>("find-by-artist+tags");

/* ===== ENTER ===== */
findByArtistTagScene.enter(async (ctx) => {
  ctx.scene.state = {};

  await ctx.reply(
    `*${escapeMarkdownV2("🥁 Артисты+Тэги")}*\n\n` +
      `${escapeMarkdownV2(
        "Напиши исполнителей и тэги — я найду артистов, которые максимально совпадают с твоими вкусами.",
      )}` +
      `\n\n${escapeMarkdownV2("Перед отправкой сообщения проверь, что имя артиста или тэг написаны верно — это поможет найти более точные совпадения.")}` +
      `\n\n*${escapeMarkdownV2("Шаг 1.")}*\n` +
      `${escapeMarkdownV2(
        "Введи через запятую имена исполнителей или названия групп (до 5).",
      )}\n\n` +
      `${escapeMarkdownV2("Например:")} _${escapeMarkdownV2(
        "Nightwish, Metallica",
      )}_`,
    { parse_mode: "MarkdownV2" },
  );
});

/* ===== TEXT HANDLER ===== */
findByArtistTagScene.on("text", async (ctx) => {
  const text = ctx.message.text.trim();
  if (!text) return;

  /* === STEP 1: ARTISTS === */
  if (!ctx.scene.state.artists) {
    const artists = text
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean)
      .slice(0, 5);

    ctx.scene.state.artists = artists;

    await ctx.reply(
      `*${escapeMarkdownV2("🥁 Артисты+Тэги")}*\n\n` +
        `${escapeMarkdownV2("Отлично!")}\n\n` +
        `*${escapeMarkdownV2("Шаг 2.")}*\n` +
        `${escapeMarkdownV2(
          "Теперь напиши через запятую тэги (до 5) на английском языке. Тэги могут обозначать жанры, страны, музыкальные десятилетия и т. д.",
        )}\n\n` +
        `${escapeMarkdownV2("Например:")} _${escapeMarkdownV2(
          "Rock, 80s, Japanese Rock",
        )}_`,
      { parse_mode: "MarkdownV2" },
    );

    return;
  }

  /* === STEP 2: TAGS === */
  const tags = text
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 5);

  ctx.scene.state.tags = tags;

  const artistsBold = ctx.scene.state.artists
    .map((a) => `*${escapeMarkdownV2(a)}*`)
    .join(escapeMarkdownV2(", "));

  const tagsBold = tags
    .map((t) => `*${escapeMarkdownV2(t)}*`)
    .join(escapeMarkdownV2(", "));

  await ctx.reply(
    `${escapeMarkdownV2("🔍 Ищу исполнителей, похожих на ")}${artistsBold}${escapeMarkdownV2(" в сочетании с ")}${tagsBold}${escapeMarkdownV2("...")}`,
    { parse_mode: "MarkdownV2" },
  );

  try {
    const result = await findByArtistTag(
      ctx.scene.state.artists || [],
      ctx.scene.state.tags || [],
    );

    const hasAnyData =
      (result.artists && result.artists.length > 0) ||
      (result.fallbackArtists && result.fallbackArtists.length > 0) ||
      (result.tags && result.tags.length > 0);

    if (!hasAnyData) {
      await ctx.reply(notFoundMultipleArtistsMessage, {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      });
    } else {
      // Проверяем наличие не найденных артистов или тэгов
      const notFoundArtists = result.notFoundArtists || [];
      const notFoundTags = result.notFoundTags || [];

      let warningText = "";

      if (notFoundArtists.length > 0 || notFoundTags.length > 0) {
        warningText = "✴️ <b>Обрати внимание:</b>\n\n";

        if (notFoundArtists.length > 0) {
          const artistsList = notFoundArtists.join(", ");
          const artistWord =
            notFoundArtists.length === 1 ? "артиста" : "артиста(ов)";
          warningText += `Я не нашёл ${artistWord}: <b>${artistsList}</b>\n`;
        }

        if (notFoundTags.length > 0) {
          const tagsList = notFoundTags.join(", ");
          const tagWord = notFoundTags.length === 1 ? "тэг" : "тэг(и)";
          warningText += `Я не нашёл ${tagWord}: <b>${tagsList}</b>\n`;
        }

        warningText +=
          "Возможно это опечатка или у меня нет этого в базе. Результат показан без учёта недоступных данных.\n\n";
      }

      const recommendationText = formatRecommendationHTML(result, {
        customTitle: "Твой выбор:",
        userArtists: ctx.scene.state.artists || [],
        userTags: ctx.scene.state.tags || [],
      });

      await ctx.reply(warningText + recommendationText, {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      });
    }
  } catch (e) {
    console.error("Error in findByArtistTag:", e);

    const errorMessage = getUserErrorMessage(e);
    if (errorMessage) {
      await ctx.reply(errorMessage, {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        ...getStartInlineKeyboard(),
      });
    } else {
      await ctx.reply(notFoundMultipleArtistsMessage, {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      });
    }
  }

  await ctx.scene.leave();
});

/* ===== LEAVE ===== */
findByArtistTagScene.leave(async (ctx) => {
  await ctx.reply("⬇️ Что будем делать дальше?", getStartInlineKeyboard());
});
