import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.warn(
    "⚠️ UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN не заданы. Хранилище недоступно.",
  );
}

export const redis = url && token ? new Redis({ url, token }) : null;
