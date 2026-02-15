import http from "http";
import type { Telegraf } from "telegraf";

const PORT = process.env.PORT
  ? parseInt(process.env.PORT, 10)
  : process.env.HEALTH_PORT
    ? parseInt(process.env.HEALTH_PORT, 10)
    : 3001;

export function startWebhookServer(bot: Telegraf<any>) {
  const server = http.createServer(async (req, res) => {
    // Health endpoint
    if (req.url === "/health" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          timestamp: new Date().toISOString(),
        }),
      );
      return;
    }

    // Webhook endpoint
    if (req.url === "/webhook" && req.method === "POST") {
      let body = "";
      
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const update = JSON.parse(body);
          await bot.handleUpdate(update);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true }));
        } catch (error) {
          console.error("Error handling webhook update:", error);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Internal server error" }));
        }
      });
      return;
    }

    // 404 for other routes
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Webhook server started on port ${PORT}`);
  });

  return server;
}
