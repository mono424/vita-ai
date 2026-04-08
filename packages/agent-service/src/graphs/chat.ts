import { StateGraph, Annotation, END } from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";
import { createLinkedInImportGraph } from "./linkedin-import.js";
import { createCSVImportGraph } from "./csv-import.js";
import { readBucketFile, getMimeType, isImageFile } from "../db.js";
import type { ChatGraphState, ChatResponse, ChatFile, ResolvedFile, ImportResult } from "../types.js";

const model = new ChatAnthropic({
  model: "claude-sonnet-4-6",
  temperature: 0,
});

const ChatStateAnnotation = Annotation.Root({
  message: Annotation<string>,
  owner_id: Annotation<string>,
  intent: Annotation<"chat" | "import_linkedin" | "import_csv" | "update_profile" | undefined>,
  extracted_data: Annotation<string | undefined>,
  response: Annotation<ChatResponse | undefined>,
  error: Annotation<string | undefined>,
  files: Annotation<ChatFile[] | undefined>,
  resolved_files: Annotation<ResolvedFile[] | undefined>,
});

const MAX_TEXT_LENGTH = 50_000;

async function resolveFiles(
  state: ChatGraphState
): Promise<Partial<ChatGraphState>> {
  if (!state.files || state.files.length === 0) {
    return {};
  }

  const resolved: ResolvedFile[] = [];

  for (const file of state.files) {
    try {
      const data = await readBucketFile(file.path);
      if (!data) continue;

      const mime = getMimeType(file.name);

      if (isImageFile(file.name)) {
        const base64 = Buffer.from(data).toString("base64");
        resolved.push({ name: file.name, mime, content: base64 });
      } else if (mime === "application/pdf") {
        try {
          const pdfParse = (await import("pdf-parse")).default;
          const result = await pdfParse(Buffer.from(data));
          const text = result.text.slice(0, MAX_TEXT_LENGTH);
          resolved.push({ name: file.name, mime: "text/plain", content: text });
        } catch {
          resolved.push({ name: file.name, mime: "text/plain", content: "[Could not extract PDF text]" });
        }
      } else {
        const text = new TextDecoder().decode(data).slice(0, MAX_TEXT_LENGTH);
        resolved.push({ name: file.name, mime, content: text });
      }
    } catch (err) {
      console.error(`Failed to resolve file ${file.path}:`, err);
    }
  }

  return { resolved_files: resolved };
}

function buildUserContent(
  message: string,
  resolvedFiles?: ResolvedFile[]
): any {
  if (!resolvedFiles || resolvedFiles.length === 0) {
    return message;
  }

  const content: any[] = [];
  let textParts = message;

  for (const file of resolvedFiles) {
    if (isImageFile(file.name)) {
      content.push({
        type: "image_url",
        image_url: { url: `data:${file.mime};base64,${file.content}` },
      });
    } else {
      textParts += `\n\n[Attached file: ${file.name}]\n${file.content}`;
    }
  }

  content.unshift({ type: "text", text: textParts });
  return content;
}

async function classifyAndExtract(
  state: ChatGraphState
): Promise<Partial<ChatGraphState>> {
  const response = await model.invoke([
    {
      role: "system",
      content: `You are a CV assistant that helps users manage their profile data. Classify the user's intent as one of:
- "import_linkedin": The user is pasting LinkedIn profile data or asking to import from LinkedIn. The message likely contains structured profile data (experience, education, etc.).
- "import_csv": The user is pasting CSV data or asking to import from a CSV.
- "update_profile": The user wants to update their personal information (name, email, phone, location, website). Only use this when the user clearly wants to change a specific profile field.
- "chat": General conversation about their CV, profile, career advice, or anything else.

IMPORTANT: When the user's intent is ambiguous — for example, data that could be either an import or a profile update, or a message that is unclear — classify as "chat" and ask the user to clarify what they'd like to do. Only classify as "update_profile" when clearly updating personal info fields. Only classify as "import_linkedin" or "import_csv" when data clearly contains structured CV entries or the user explicitly asks to import.

Respond with a JSON object:
{
  "intent": "chat" | "import_linkedin" | "import_csv" | "update_profile",
  "extracted_data": "<the raw data to import, if intent is import_linkedin or import_csv, otherwise null>",
  "user_updates": { "name": "...", "email": "...", "phone": "...", "location": "...", "website": "..." },
  "reply": "<a brief conversational reply to the user>"
}

For "update_profile": include only the fields the user wants to change in "user_updates". The reply should confirm what you're updating.
For imports: the reply should acknowledge that you're processing the import.
For "chat": just respond helpfully about CV topics. Set "user_updates" to null and "extracted_data" to null.`,
    },
    {
      role: "user",
      content: buildUserContent(state.message, state.resolved_files),
    },
  ]);

  try {
    const content = response.content as string;
    const jsonMatch =
      content.match(/```json\n?([\s\S]*?)\n?```/) ||
      content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(
      jsonMatch ? jsonMatch[1] || jsonMatch[0] : content
    );

    const intent = parsed.intent || "chat";

    if (intent === "update_profile" && parsed.user_updates) {
      return {
        intent: "update_profile",
        response: {
          message: parsed.reply || "I'd like to update your profile. Please confirm.",
          action: "update_profile",
          pending_user_updates: parsed.user_updates,
        },
      };
    }

    return {
      intent,
      extracted_data: parsed.extracted_data || undefined,
      response: {
        message: parsed.reply || "",
        action: "none",
      },
    };
  } catch {
    return {
      intent: "chat",
      response: {
        message:
          "I can help you with your CV! You can paste LinkedIn data or CSV to import, or ask me anything about your profile.",
        action: "none",
      },
    };
  }
}

async function dispatch(
  state: ChatGraphState
): Promise<Partial<ChatGraphState>> {
  if (state.intent === "import_linkedin" && state.extracted_data) {
    try {
      const linkedinGraph = createLinkedInImportGraph();
      const result = await linkedinGraph.invoke({
        raw_input: state.extracted_data,
        owner_id: state.owner_id,
      });

      if (result.error) {
        return {
          response: {
            message: `I tried to import your LinkedIn data but ran into an issue: ${result.error}`,
            action: "import_linkedin",
          },
        };
      }

      const importResult = result.result as ImportResult;
      const userUpdates = importResult.user_updates;
      if (userUpdates && Object.keys(userUpdates).length > 0) {
        delete importResult.user_updates;
      }

      return {
        response: {
          message: "I've processed your LinkedIn data and imported your profile entries.",
          action: "import_linkedin",
          import_result: importResult,
          ...(userUpdates && Object.keys(userUpdates).length > 0
            ? { pending_user_updates: userUpdates }
            : {}),
        },
      };
    } catch (err) {
      return {
        response: {
          message: "Sorry, I had trouble processing that LinkedIn data. Could you try pasting it again?",
          action: "none",
        },
      };
    }
  }

  if (state.intent === "import_csv" && state.extracted_data) {
    try {
      const csvGraph = createCSVImportGraph();
      const result = await csvGraph.invoke({
        raw_input: state.extracted_data,
        owner_id: state.owner_id,
      });

      if (result.error) {
        return {
          response: {
            message: `I tried to import your CSV data but ran into an issue: ${result.error}`,
            action: "import_csv",
          },
        };
      }

      const csvImportResult = result.result as ImportResult;
      const csvUserUpdates = csvImportResult.user_updates;
      if (csvUserUpdates && Object.keys(csvUserUpdates).length > 0) {
        delete csvImportResult.user_updates;
      }

      return {
        response: {
          message: "I've processed your CSV data and imported the entries.",
          action: "import_csv",
          import_result: csvImportResult,
          ...(csvUserUpdates && Object.keys(csvUserUpdates).length > 0
            ? { pending_user_updates: csvUserUpdates }
            : {}),
        },
      };
    } catch (err) {
      return {
        response: {
          message: "Sorry, I had trouble processing that CSV data. Could you try again?",
          action: "none",
        },
      };
    }
  }

  // For chat intent, the response was already set by classifyAndExtract
  return {};
}

function shouldDispatch(state: ChatGraphState): string {
  if (
    state.intent === "import_linkedin" ||
    state.intent === "import_csv"
  ) {
    return "dispatch";
  }
  return END;
}

export function createChatGraph() {
  const graph = new StateGraph(ChatStateAnnotation)
    .addNode("resolveFiles", resolveFiles)
    .addNode("classifyAndExtract", classifyAndExtract)
    .addNode("dispatch", dispatch)
    .addEdge("__start__", "resolveFiles")
    .addEdge("resolveFiles", "classifyAndExtract")
    .addConditionalEdges("classifyAndExtract", shouldDispatch, [
      "dispatch",
      END,
    ])
    .addEdge("dispatch", END);

  return graph.compile();
}
