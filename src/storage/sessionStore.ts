import { redis } from "./redis";

const SESSION_PREFIX = "bot:session:";
const SESSION_TTL = 86400; // 24 hours

function createRedisStore(client: NonNullable<typeof redis>) {
  return {
    async get(key: string) {
      const data = await client.get(SESSION_PREFIX + key);
      return data ?? undefined;
    },
    async set(key: string, session: object) {
      await client.set(SESSION_PREFIX + key, JSON.stringify(session), {
        ex: SESSION_TTL,
      });
    },
    async delete(key: string) {
      await client.del(SESSION_PREFIX + key);
    },
  };
}

export const redisSessionStore = redis ? createRedisStore(redis) : undefined;
