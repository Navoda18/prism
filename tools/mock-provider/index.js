const http = require("http");

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (req.url === "/v1/chat/completions" && req.method === "POST") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        id: "chatcmpl-mock",
        object: "chat.completion",
        choices: [
          {
            message: { role: "assistant", content: "Hello from Prism mock provider!" },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 8, total_tokens: 18 },
      }),
    );
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(4000, () => {
  console.log("Mock provider running on port 4000");
});
