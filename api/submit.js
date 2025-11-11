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
    if (!participantId)
      return res.status(400).json({ success: false, message: "Missing participantId" });

    // extract email if provided
    const email =
      data.demographic && data.demographic.email ? data.demographic.email : "";

    // Build demographic JSON string (minus email, if you prefer)
    const demographic = { ...data.demographic };
    const demographicJson = JSON.stringify(demographic);

    // Flatten chart responses if you want to store one row per participant
    const chartIdList = data.responses.map(r => r.chartId).join(", ");
    const choiceList = data.responses.map(r => r.choice).join(", ");

    // Build row in your 6-column format
    const rowValues = [
      new Date().toISOString(), // A Timestamp
      participantId,            // B Participant ID
      email,                    // C Email
      chartIdList,              // D Chart IDs
      choiceList,               // E Choices
      demographicJson           // F Demographic JSON
    ];

    // === find existing participant ===
    const getResp = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Responses!A2:F"   // skip header
    });

    const rows = getResp.data.values || [];
    const idColIndex = 1; // column B

    let existingRowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][idColIndex] === participantId) {
        existingRowIndex = i + 2; // +2 because header + 1-based index
        break;
      }
    }

    if (existingRowIndex !== -1) {
      // === update existing row ===
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `Responses!A${existingRowIndex}:F${existingRowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [rowValues] }
      });
      console.log(`✅ Updated participant ${participantId}`);
      return res.status(200).json({ success: true, updated: true });
    } else {
      // === append new row ===
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: "Responses!A1",
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: [rowValues] }
      });
      console.log(`✅ Added new participant ${participantId}`);
      return res.status(200).json({ success: true, created: true });
    }
  } catch (err) {
    console.error("❌ Error writing to sheet:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
