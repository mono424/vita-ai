import express from "express";
import { createLinkedInImportGraph } from "./graphs/linkedin-import.js";
import { createCSVImportGraph } from "./graphs/csv-import.js";
import { createChatGraph } from "./graphs/chat.js";

const app = express();
app.use(express.json({ limit: "10mb" }));

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
  const { message, owner_id } = req.body;

  if (!message || !owner_id) {
    res.status(422).json({ detail: "message and owner_id are required" });
    return;
  }

  try {
    const result = await chatGraph.invoke({
      message,
      owner_id,
    });

    if (result.error) {
      res.status(500).json({ detail: result.error });
      return;
    }

    res.json(result.response);
  } catch (err) {
    console.error("Chat failed:", err);
    res.status(500).json({ detail: "Chat processing failed" });
  }
});

const port = process.env.PORT || 8767;
app.listen(port, () => {
  console.log(`Agent service running on http://localhost:${port}`);
});
