const WebSocket = require("ws");
const http = require("http");
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws-cmd" });

const clients = new Set();

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // The folder where uploaded files will be stored
  },
  filename: (req, file, cb) => {
    console.log(file.originalname.split("."));
    cb(null, "file." + file.originalname.split(".").pop()); // Rename the file with original extension
  },
});

// Create multer instance with the storage configuration
const upload = multer({ storage: storage });

function resetUploadedFile() {
  // Read the directory
  fs.readdir(__dirname + "/uploads", (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      return;
    }

    // Iterate over each file and delete it
    files.forEach((file) => {
      const filePath = path.join(__dirname + "/uploads", file);

      // Delete the file
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Error deleting file:", filePath, err);
        } else {
          console.log("Deleted file:", filePath);
        }
      });
    });
  });
}
resetUploadedFile();

// Handle file upload
app.post("/upload", upload.single("file"), (req, res) => {
  if (req.file) {
    res.send("File uploaded successfully!");
  } else {
    res.status(400).send("No file uploaded.");
  }
});

app.get("/u", (req, res) => {
  res.sendFile(__dirname + "/upload.html");
});

app.get("/reset-uploaded-file", (req, res) => {
  resetUploadedFile();
  res.send("success");
});

app.get("/download-uploaded-file", (req, res) => {
  fs.readdir(__dirname + "/uploads", (err, files) => {
    console.log(__dirname + "/uploads/" + files[0]);
    res.sendFile(__dirname + "/uploads/" + files[0]);
  });
});

wss.on("connection", (ws) => {
  console.log("New client has connected");

  clients.add(ws);

  ws.on("message", (message) => {
    console.log("command: " + message.toString("utf-8"));
    for (const client of clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        console.log("executing: " + message.toString("utf-8"));
        client.send(message.toString("utf-8"));
      }
    }
  });

  ws.on("close", () => {
    console.log("Client has quit the connection");
    clients.delete(ws);
  });
});

app.get("/cmd", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
