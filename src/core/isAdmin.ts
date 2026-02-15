
import { BotContext } from "../context/context";
import { env } from "../env";

export function isAdmin(ctx: BotContext): boolean {
  if (!ctx.from?.id) return false;
  return env.ADMIN_IDS.includes(ctx.from.id);
}