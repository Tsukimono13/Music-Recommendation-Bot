import fs from "fs";
import path from "path";

const dataDir = path.resolve(process.cwd(), "src/data");
const filePath = path.resolve(dataDir, "users.json");

export type User = {
  id: number;
  username?: string;
  firstName?: string;
  startedAt: string;
};

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readUsers(): User[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content.trim()) {
      return [];
    }
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading users file:", error);
    return [];
  }
}

function writeUsers(users: User[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing users file:", error);
  }
}

export function saveUserIfNotExists(user: User) {
  try {
    const users = readUsers();

    const exists = users.some((u) => u.id === user.id);
    if (exists) return;

    users.push(user);
    writeUsers(users);
  } catch (error) {
    console.error("Error saving user:", error);
  }
}

export function getUsersCount(): number {
  try {
    return readUsers().length;
  } catch (error) {
    console.error("Error getting users count:", error);
    return 0;
  }
}
