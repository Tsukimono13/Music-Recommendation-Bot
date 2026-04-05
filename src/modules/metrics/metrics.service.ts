import { redis } from "../../storage/redis";

const QUERIES_KEY = "bot:metrics:queries";
const COUNTERS_KEY = "bot:metrics:counters";
const MAX_STORED_QUERIES = 500;

export type QueryMetric = {
  query: string;
  resultCount: number;
  responseMs: number;
  error?: string;
  timestamp: string;
  source: "chat" | "inline";
};

export async function logQuery(metric: QueryMetric) {
  if (!redis) return;

  try {
    const pipe = redis.pipeline();
    pipe.lpush(QUERIES_KEY, JSON.stringify(metric));
    pipe.ltrim(QUERIES_KEY, 0, MAX_STORED_QUERIES - 1);
    pipe.hincrby(COUNTERS_KEY, "total", 1);
    if (metric.error) {
      pipe.hincrby(COUNTERS_KEY, "errors", 1);
      if (metric.error === "timeout") {
        pipe.hincrby(COUNTERS_KEY, "timeouts", 1);
      }
    }
    if (metric.resultCount === 0 && !metric.error) {
      pipe.hincrby(COUNTERS_KEY, "empty", 1);
    }
    await pipe.exec();
  } catch (e) {
    console.error("Failed to log metric:", e);
  }
}

export async function getMetricsSummary(): Promise<{
  total: number;
  errors: number;
  timeouts: number;
  empty: number;
  avgResponseMs: number;
  recentQueries: QueryMetric[];
  topQueries: { query: string; count: number }[];
  slowQueries: QueryMetric[];
}> {
  if (!redis) {
    return {
      total: 0,
      errors: 0,
      timeouts: 0,
      empty: 0,
      avgResponseMs: 0,
      recentQueries: [],
      topQueries: [],
      slowQueries: [],
    };
  }

  const counters = (await redis.hgetall(COUNTERS_KEY)) as Record<string, string> | null;
  const total = Number(counters?.total ?? 0);
  const errors = Number(counters?.errors ?? 0);
  const timeouts = Number(counters?.timeouts ?? 0);
  const empty = Number(counters?.empty ?? 0);

  // Last 100 queries for analysis
  const raw = await redis.lrange(QUERIES_KEY, 0, 99);
  const queries: QueryMetric[] = raw.map((r) =>
    typeof r === "string" ? JSON.parse(r) : (r as QueryMetric),
  );

  // Avg response time
  const successQueries = queries.filter((q) => !q.error);
  const avgResponseMs = successQueries.length
    ? Math.round(
        successQueries.reduce((s, q) => s + q.responseMs, 0) /
          successQueries.length,
      )
    : 0;

  // Top queries (normalized lowercase)
  const freq = new Map<string, number>();
  for (const q of queries) {
    const key = q.query.toLowerCase().trim();
    freq.set(key, (freq.get(key) ?? 0) + 1);
  }
  const topQueries = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([query, count]) => ({ query, count }));

  // Slowest queries
  const slowQueries = [...successQueries]
    .sort((a, b) => b.responseMs - a.responseMs)
    .slice(0, 5);

  return {
    total,
    errors,
    timeouts,
    empty,
    avgResponseMs,
    recentQueries: queries.slice(0, 10),
    topQueries,
    slowQueries,
  };
}
