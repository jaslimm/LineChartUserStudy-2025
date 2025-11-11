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
  const participantId = data.participantId || `participant_${Date.now()}`;
  const filename = `${participantId}.json`;
  const filepath = path.join(__dirname, "data", filename);

  // If a file already exists for this participant, merge the old and new data
  if (fs.existsSync(filepath)) {
    try {
      const oldData = JSON.parse(fs.readFileSync(filepath, "utf8"));
      const merged = { ...oldData, ...data };

      // Deep-merge demographic if needed
      merged.demographic = { ...oldData.demographic, ...data.demographic };

      fs.writeFileSync(filepath, JSON.stringify(merged, null, 2));
      console.log(`✅ Updated existing data for ${participantId}`);
      return res.json({ success: true, updated: true });
    } catch (err) {
      console.error("❌ Merge error:", err);
      return res.status(500).json({ success: false });
    }
  }

  // Otherwise create new file
  fs.writeFile(filepath, JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error("❌ Error writing file:", err);
      return res.status(500).json({ success: false });
    }
    console.log(`✅ Created new participant file: ${filename}`);
    res.json({ success: true, created: true });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
