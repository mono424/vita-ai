import express from "express";
import { createLinkedInImportGraph } from "./graphs/linkedin-import.js";
import { createCSVImportGraph } from "./graphs/csv-import.js";
import { createChatGraph } from "./graphs/chat.js";
import { updateChatMessage, getChatMessage } from "./db.js";

const app = express();
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const linkedinGraph = createLinkedInImportGraph();
const csvGraph = createCSVImportGraph();
const chatGraph = createChatGraph();

app.post("/import/linkedin", async (req, res) => {
  const { linkedin_data, owner_id } = req.body;

  if (!linkedin_data || !owner_id) {
    res.status(422).json({ detail: "linkedin_data and owner_id are required" });
    return;
  }

  try {
    const result = await linkedinGraph.invoke({
      raw_input: linkedin_data,
      owner_id,
    });

    if (result.error) {
      res.status(500).json({ detail: result.error });
      return;
    }

    res.json(result.result);
  } catch (err) {
    console.error("LinkedIn import failed:", err);
    res.status(500).json({ detail: "LinkedIn import failed" });
  }
});

app.post("/import/csv", async (req, res) => {
  const { csv_content, owner_id, target_table } = req.body;

  if (!csv_content || !owner_id) {
    res.status(422).json({ detail: "csv_content and owner_id are required" });
    return;
  }

  try {
    const result = await csvGraph.invoke({
      raw_input: csv_content,
      owner_id,
      target_table,
    });

    if (result.error) {
      res.status(500).json({ detail: result.error });
      return;
    }

    res.json(result.result);
  } catch (err) {
    console.error("CSV import failed:", err);
    res.status(500).json({ detail: "CSV import failed" });
  }
});

app.post("/chat", async (req, res) => {
  const { message, owner_id, session, message_id, files } = req.body;

  if (!message || !owner_id || !session || !message_id) {
    res.status(422).json({ detail: "message, owner_id, session, and message_id are required" });
    return;
  }

  try {
    // Guard: skip if this message was already processed (retry scenario)
    const existing = await getChatMessage(message_id);
    if (existing && (existing.writing === false || existing.import_result || existing.import_summary)) {
      console.log(`Message ${message_id} already processed, skipping retry`);
      res.json({ success: true });
      return;
    }

    let parsedFiles;
    if (files) {
      try {
        parsedFiles = typeof files === 'string' ? JSON.parse(files) : files;
      } catch { parsedFiles = undefined; }
    }

    const result = await chatGraph.invoke({
      message,
      owner_id,
      files: parsedFiles,
    });

    if (result.error) {
      res.status(500).json({ detail: result.error });
      return;
    }

    const response = result.response as { message?: string; import_result?: any };

    // Update the placeholder message directly in SurrealDB
    await updateChatMessage(
      message_id,
      response?.message || "Done!",
      response?.import_result,
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Chat failed:", err);
    res.status(500).json({ detail: "Chat processing failed" });
  }
});

const port = process.env.PORT || 8767;
app.listen(Number(port), '0.0.0.0', () => {
  console.log(`Agent service running on http://0.0.0.0:${port}`);
});
