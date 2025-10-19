export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const data = req.body;
    console.log("📩 Received participant data:", data);

    // ✅ TEMPORARY: Save to /tmp (Vercel allows only temporary writes)
    const fs = await import("fs");
    const path = "/tmp/participant_responses.json";

    // append response to file
    let existing = [];
    if (fs.existsSync(path)) {
      const fileData = fs.readFileSync(path);
      existing = JSON.parse(fileData);
    }
    existing.push(data);
    fs.writeFileSync(path, JSON.stringify(existing, null, 2));

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Error saving response:", err);
    res.status(500).json({ success: false });
  }
}
