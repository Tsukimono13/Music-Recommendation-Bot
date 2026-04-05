const BACKEND_URL = process.env.BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error("BACKEND_URL is not set");
}

const HEALTH_CHECK_TIMEOUT = 5_000;
const PING_INTERVAL = 4 * 60 * 1000; // 4 minutes

function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  return Promise.race([
    fetch(url),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeout),
    ),
  ]);
}

export function startBackendPing() {
  setInterval(async () => {
    try {
      await fetchWithTimeout(`${BACKEND_URL}/health`, HEALTH_CHECK_TIMEOUT);
      console.log("Backend ping OK");
    } catch (e) {
      console.error("Backend ping failed:", e);
    }
  }, PING_INTERVAL);
}

export function startSelfPing() {
  const selfUrl =
    process.env.WEBHOOK_URL || process.env.RENDER_EXTERNAL_URL;
  if (!selfUrl) return;

  const healthUrl = `${selfUrl.replace(/\/$/, "")}/health`;
  console.log(`🏓 Self-ping enabled: ${healthUrl}`);

  setInterval(async () => {
    try {
      await fetchWithTimeout(healthUrl, HEALTH_CHECK_TIMEOUT);
      console.log("Self-ping OK");
    } catch (e) {
      console.error("Self-ping failed:", e);
    }
  }, PING_INTERVAL);
}
