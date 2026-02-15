import http from "http";

const PORT = process.env.PORT
  ? parseInt(process.env.PORT, 10)
  : process.env.HEALTH_PORT
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

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🏥 Health server started on port ${PORT}`);
  });

  return server;
}
