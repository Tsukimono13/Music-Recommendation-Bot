const BACKEND_URL = process.env.BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error("BACKEND_URL is not set");
}

const HEALTH_CHECK_TIMEOUT = 5_000; 

function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  return Promise.race([
    fetch(url),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeout),
    ),
  ]);
}

export function startBackendPing() {
  const INTERVAL = 5 * 60 * 1000;

  setInterval(async () => {
    try {
      await fetchWithTimeout(
        `${BACKEND_URL}/health`,
        HEALTH_CHECK_TIMEOUT,
      );
      console.log("Backend ping OK");
    } catch (e) {
      console.error("Backend ping failed:", e);
    }
  }, INTERVAL);
}
