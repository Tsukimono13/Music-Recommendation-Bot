import { Composer } from "telegraf";
import { BotContext } from "../context/context";
import { isAdmin } from "../core/isAdmin";

interface UserRequest {
  count: number;
  resetAt: number;
}

const userRequests = new Map<number, UserRequest>();

// Настройки анти-флуда
const MAX_REQUESTS = 10; // Максимальное количество запросов
const TIME_WINDOW = 60 * 1000; // Временное окно в миллисекундах (1 минута)
const BLOCK_DURATION = 5 * 60 * 1000; // Время блокировки в миллисекундах (5 минут)

interface BlockedUser {
  blockedUntil: number;
}

const blockedUsers = new Map<number, BlockedUser>();

function isUserBlocked(userId: number): boolean {
  const blocked = blockedUsers.get(userId);
  if (!blocked) return false;

  if (Date.now() > blocked.blockedUntil) {
    blockedUsers.delete(userId);
    return false;
  }

  return true;
}

function blockUser(userId: number, duration: number) {
  blockedUsers.set(userId, {
    blockedUntil: Date.now() + duration,
  });
}

function checkRateLimit(userId: number): boolean {
  const now = Date.now();
  const userRequest = userRequests.get(userId);

  // Если пользователь заблокирован
  if (isUserBlocked(userId)) {
    return false;
  }

  // Если это первый запрос или окно времени истекло
  if (!userRequest || now > userRequest.resetAt) {
    userRequests.set(userId, {
      count: 1,
      resetAt: now + TIME_WINDOW,
    });
    return true;
  }

  // Увеличиваем счетчик
  userRequest.count++;

  // Если превышен лимит
  if (userRequest.count > MAX_REQUESTS) {
    blockUser(userId, BLOCK_DURATION);
    userRequests.delete(userId);
    return false;
  }

  return true;
}

export const antiFloodMiddleware = new Composer<BotContext>();

antiFloodMiddleware.use(async (ctx, next) => {
  // Пропускаем ботов
  if (ctx.from && "is_bot" in ctx.from && ctx.from.is_bot) {
    return next();
  }

  // Пропускаем администраторов
  if (isAdmin(ctx)) {
    return next();
  }

  const userId = ctx.from?.id;
  if (!userId) {
    return next();
  }

  // Проверяем rate limit
  if (!checkRateLimit(userId)) {
    const blocked = blockedUsers.get(userId);
    if (blocked) {
      const remainingSeconds = Math.ceil(
        (blocked.blockedUntil - Date.now()) / 1000,
      );
      const remainingMinutes = Math.ceil(remainingSeconds / 60);

      await ctx.reply(
        `⚠️ Вы отправляете слишком много запросов.\n\nПожалуйста, подождите ${remainingMinutes} минут(ы) перед следующим запросом.`,
      );
    }
    return;
  }

  return next();
});
