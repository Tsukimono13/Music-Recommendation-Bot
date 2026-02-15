import axios from "axios";

const BACKEND_URL = process.env.BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error("BACKEND_URL is not set");
}

// Таймаут для внешних API (Last.fm, Spotify через backend)
// 30 секунд должно быть достаточно для получения данных
const API_TIMEOUT = 30_000;

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: API_TIMEOUT,
});

export async function findByArtist(artist: string) {
  const response = await api.post("/api/music/recommend", {
    artists: [artist],
  });

  return response.data;
}

export async function findBetweenArtists(artists: string[]) {
  const response = await api.post("/api/music/recommend", {
    artists,
  });

  return response.data;
}

export async function findByArtistTag(artists: string[], tags: string[]) {
  const response = await api.post("/api/music/recommend", {
    artists,
    tags,
  });

  return response.data;
}

export async function findByTags(tags: string[]) {
  if (!tags || tags.length === 0) {
    throw new Error("Tags array cannot be empty");
  }

  const response = await api.post("/api/music/recommend", {
    tags,
  });

  return response.data;
}
