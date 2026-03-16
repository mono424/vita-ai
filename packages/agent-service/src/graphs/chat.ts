import { StateGraph, Annotation, END } from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";
import { createLinkedInImportGraph } from "./linkedin-import.js";
import { createCSVImportGraph } from "./csv-import.js";
import type { ChatGraphState, ChatResponse, ImportResult } from "../types.js";

const model = new ChatAnthropic({
  model: "claude-sonnet-4-6",
  temperature: 0,
});

const ChatStateAnnotation = Annotation.Root({
  message: Annotation<string>,
  owner_id: Annotation<string>,
  intent: Annotation<"chat" | "import_linkedin" | "import_csv" | undefined>,
  extracted_data: Annotation<string | undefined>,
  response: Annotation<ChatResponse | undefined>,
  error: Annotation<string | undefined>,
});

async function classifyAndExtract(
  state: ChatGraphState
): Promise<Partial<ChatGraphState>> {
  const response = await model.invoke([
    {
      role: "system",
      content: `You are a CV assistant that helps users manage their profile data. Classify the user's intent as one of:
- "import_linkedin": The user is pasting LinkedIn profile data or asking to import from LinkedIn. The message likely contains structured profile data (experience, education, etc.).
- "import_csv": The user is pasting CSV data or asking to import from a CSV.
- "chat": General conversation about their CV, profile, career advice, or anything else.

Respond with a JSON object:
{
  "intent": "chat" | "import_linkedin" | "import_csv",
  "extracted_data": "<the raw data to import, if intent is import_linkedin or import_csv, otherwise null>",
  "reply": "<a brief conversational reply to the user>"
}

If the intent is an import, the reply should acknowledge that you're processing the import. If it's chat, just respond helpfully about CV topics.`,
    },
    {
      role: "user",
      content: state.message,
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

    return {
      intent: parsed.intent || "chat",
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

      return {
        response: {
          message: "I've processed your LinkedIn data and imported your profile entries.",
          action: "import_linkedin",
          import_result: result.result as ImportResult,
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

      return {
        response: {
          message: "I've processed your CSV data and imported the entries.",
          action: "import_csv",
          import_result: result.result as ImportResult,
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
    .addNode("classifyAndExtract", classifyAndExtract)
    .addNode("dispatch", dispatch)
    .addEdge("__start__", "classifyAndExtract")
    .addConditionalEdges("classifyAndExtract", shouldDispatch, [
      "dispatch",
      END,
    ])
    .addEdge("dispatch", END);

  return graph.compile();
}
