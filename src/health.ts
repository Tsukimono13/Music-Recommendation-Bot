import http from "http";

const HEALTH_PORT = process.env.HEALTH_PORT
  ? parseInt(process.env.HEALTH_PORT, 10)
  : 3001;

export function startHealthServer() {
  const server = http.createServer((req, res) => {
    if (req.url === "/health" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          timestamp: new Date().toISOString(),
        }),
      );
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    }
  });

  server.listen(HEALTH_PORT, () => {
    console.log(`🏥 Health server started on port ${HEALTH_PORT}`);
  });

  return server;
}
