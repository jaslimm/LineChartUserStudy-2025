import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    const sheetId = process.env.SHEET_ID;

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });

    const sheets = google.sheets({ version: "v4", auth });
    const data = req.body;
    const participantId = data.participantId;

    // 1️⃣ Fetch current sheet data (participantId column assumed at B column)
    const getResp = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Responses!A2:E" // adjust range as needed for your columns
    });

    const rows = getResp.data.values || [];
    const idColIndex = 1; // Column B (A=0, B=1, etc.)
    let existingRowIndex = -1;

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][idColIndex] === participantId) {
        existingRowIndex = i + 2; // +2 because header row + 1-based index
        break;
      }
    }

    // 2️⃣ Build the new row data
    const row = [
      new Date().toISOString(),
      participantId || "",
      JSON.stringify(data.chartOrder || []),
      JSON.stringify(data.responses || []),
      data.demographic ? JSON.stringify(data.demographic) : ""
    ];

    if (existingRowIndex !== -1) {
      // 3️⃣ Update existing row
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `Responses!A${existingRowIndex}:E${existingRowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [row] }
      });
      console.log(`✅ Updated existing participant ${participantId}`);
      return res.status(200).json({ success: true, updated: true });
    } else {
      // 4️⃣ Append new row if not found
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: "Responses!A1",
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: [row] }
      });
      console.log(`✅ Added new participant ${participantId}`);
      return res.status(200).json({ success: true, created: true });
    }
  } catch (err) {
    console.error("❌ Error adding to sheet:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
