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
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const data = req.body;

    const participantId = data.participantId;
    if (!participantId)
      return res.status(400).json({ success: false, message: "Missing participantId" });

    // ✅ Extract email if available
    const email =
      data.demographic && data.demographic.email ? data.demographic.email : "";

    // ✅ Build demographic JSON string
    const demographicJson = JSON.stringify(data.demographic || {});

    // ✅ Responses as JSON string (exact array)
    const responsesJson = JSON.stringify(data.responses || []);

    // ✅ Construct row: Timestamp | Participant ID | Email | Responses | Demographic
    const recruitmentSource = data.recruitmentSource || "";
    const prolificPid = data.prolificPid || "";

    const rowValues = [
      new Date().toISOString(), // A Timestamp
      participantId,            // B Participant ID
      email,                    // C Email
      recruitmentSource,        // D RecruitmentSource
      prolificPid,              // E ProlificPID
      responsesJson,            // F Responses
      demographicJson,          // G Demographic
    ];


    // === Check for existing participant ===
    const getResp = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Responses!A2:G", // now 7 columns
    });

    const rows = getResp.data.values || [];
    const idColIndex = 1; // Column B = participant ID
    let existingRowIndex = -1;

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][idColIndex] === participantId) {
        existingRowIndex = i + 2; // +2 for header + 1-based
        break;
      }
    }

    if (existingRowIndex !== -1) {
      // ✅ Update existing participant
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `Responses!A${existingRowIndex}:G${existingRowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [rowValues] },
      });
      console.log(`✅ Updated participant ${participantId}`);
      return res.status(200).json({ success: true, updated: true });
    } else {
      // ✅ Append new participant
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: "Responses!A1",
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: [rowValues] },
      });
      console.log(`✅ Added new participant ${participantId}`);
      return res.status(200).json({ success: true, created: true });
    }
  } catch (err) {
    console.error("❌ Error writing to sheet:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
