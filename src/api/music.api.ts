import axios from "axios";

const BACKEND_URL = process.env.BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error("BACKEND_URL is not set");
}

const API_TIMEOUT = 30_000;

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: API_TIMEOUT,
});

/**
 * Запрос рекомендаций по свободному сообщению пользователя.
 * Backend (Gemini) сам извлекает artists и tags из message и возвращает результат.
 */
export async function recommend(message: string) {
  const response = await api.post("/api/music/recommend", {
    message: message.trim(),
  });
  return response.data;
}
