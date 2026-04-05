import { Scenes } from "telegraf";
import type { RecommendResult } from "../utils/formattedRecommendations";

export interface BotSession extends Scenes.SceneSession {
  lastRecommendResult?: RecommendResult;
  deepDiveOffset?: number;
}

export interface BotContext extends Scenes.SceneContext {
  session: BotSession;
}
