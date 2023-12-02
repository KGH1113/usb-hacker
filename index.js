const WebSocket = require("ws");
const http = require("http");
const express = require("express");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/cmd" });

const clients = new Set();

wss.on("connection", (ws) => {
  console.log("New client has connected");

  clients.add(ws);

  ws.on("message", (message) => {
    for (const client of clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        console.log(message.toString("utf-8"));
        client.send(message.toString("utf-8"));
      }
    }
  });

  ws.on("close", () => {
    console.log("Client has quit the connection");
    clients.delete(ws);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
