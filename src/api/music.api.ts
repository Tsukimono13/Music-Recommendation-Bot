import axios from "axios";

const BACKEND_URL = process.env.BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error("BACKEND_URL is not set");
}

const API_TIMEOUT = 50_000;

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: API_TIMEOUT,
});

export async function recommend(message: string) {
  const response = await api.post("/api/music/recommend", {
    message: message.trim(),
  });
  return response.data;
}
