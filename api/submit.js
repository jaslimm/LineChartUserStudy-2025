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

    // flatten demographic + responses into a single row string for simplicity
    const row = [
      new Date().toISOString(),
      data.sessionId || "",
      JSON.stringify(data.selectedCharts || []),
      JSON.stringify(data.responses || []),
      data.demographic ? JSON.stringify(data.demographic) : ""
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Responses!A1",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] }
    });

    console.log("✅ Row added to Google Sheet");
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Error adding to sheet:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
