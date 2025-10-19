import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

app.post("/submit", (req, res) => {
  const data = req.body;
  const timestamp = Date.now();
  const dir = path.join(__dirname, "data");

  // Ensure /data directory exists
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  const filename = `participant_${timestamp}.json`;
  const filepath = path.join(dir, filename);

  fs.writeFile(filepath, JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error("❌ Error writing file:", err);
      return res.status(500).json({ success: false });
    }
    console.log("✅ Saved:", filepath);
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
