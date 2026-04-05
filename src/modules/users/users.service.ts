import fs from "fs";
import path from "path";
import { redis } from "../../storage/redis";

const REDIS_KEY = "bot:users";

const dataDir = path.resolve(process.cwd(), "src/data");
const filePath = path.resolve(dataDir, "users.json");

export type User = {
  id: number;
  username?: string;
  firstName?: string;
  startedAt: string;
};

// ── File fallback (local dev without Redis) ──

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readUsersFromFile(): User[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content.trim()) return [];
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading users file:", error);
    return [];
  }
}

function writeUsersToFile(users: User[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing users file:", error);
  }
}

// ── Public API (Redis-first, file fallback) ──

export async function saveUserIfNotExists(user: User) {
  try {
    if (redis) {
      const exists = await redis.hexists(REDIS_KEY, String(user.id));
      if (exists) return;
      await redis.hset(REDIS_KEY, { [user.id]: JSON.stringify(user) });
      return;
    }
    // File fallback
    const users = readUsersFromFile();
    if (users.some((u) => u.id === user.id)) return;
    users.push(user);
    writeUsersToFile(users);
  } catch (error) {
    console.error("Error saving user:", error);
  }
}

export async function getUsersCount(): Promise<number> {
  try {
    if (redis) {
      return await redis.hlen(REDIS_KEY);
    }
    return readUsersFromFile().length;
  } catch (error) {
    console.error("Error getting users count:", error);
    return 0;
  }
}

export async function getUsers(): Promise<User[]> {
  try {
    if (redis) {
      const all = await redis.hgetall(REDIS_KEY);
      if (!all) return [];
      return Object.values(all).map((v) =>
        typeof v === "string" ? JSON.parse(v) : (v as User),
      );
    }
    return readUsersFromFile();
  } catch (error) {
    console.error("Error getting users:", error);
    return [];
  }
}

export async function getUserIds(): Promise<number[]> {
  try {
    if (redis) {
      const keys = await redis.hkeys(REDIS_KEY);
      return keys.map(Number);
    }
    return readUsersFromFile().map((u) => u.id);
  } catch (error) {
    console.error("Error getting user ids:", error);
    return [];
  }
}
