import { StateGraph, Annotation, END } from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";
import { mapToSchema } from "../nodes/map-to-schema.js";
import { validate } from "../nodes/validate.js";
import type { GraphState, ImportResult } from "../types.js";

const model = new ChatAnthropic({
  model: "claude-sonnet-4-6",
  temperature: 0,
});

const GraphStateAnnotation = Annotation.Root({
  raw_input: Annotation<string>,
  owner_id: Annotation<string>,
  parsed_data: Annotation<Record<string, unknown> | undefined>,
  target_table: Annotation<string | undefined>,
  column_mapping: Annotation<Record<string, string> | undefined>,
  result: Annotation<ImportResult | undefined>,
  error: Annotation<string | undefined>,
});

async function parseLinkedIn(state: GraphState): Promise<Partial<GraphState>> {
  const response = await model.invoke([
    {
      role: "system",
      content: `You are a LinkedIn profile parser. Extract structured data from a LinkedIn profile export.

Return a JSON object with these sections (include only what's present):
- profile: { name, email, phone, location, website, headline }
- experience: [{ company, position, start_date, end_date, location, description }]
- education: [{ institution, degree, area, start_date, end_date }]
- skills: [{ label, details }]
- projects: [{ name, description, start_date, end_date }]
- social_networks: [{ network, username }]

Dates should be in "YYYY-MM" or "YYYY" format.`,
    },
    {
      role: "user",
      content: `Parse this LinkedIn profile data:\n\n${state.raw_input}`,
    },
  ]);

  let parsed_data: Record<string, unknown>;
  try {
    const content = response.content as string;
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
    parsed_data = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : content);
  } catch {
    return { error: "Failed to parse LinkedIn data" };
  }

  return { parsed_data };
}

export function createLinkedInImportGraph() {
  const graph = new StateGraph(GraphStateAnnotation)
    .addNode("parseLinkedIn", parseLinkedIn)
    .addNode("mapToSchema", mapToSchema)
    .addNode("validate", validate)
    .addEdge("__start__", "parseLinkedIn")
    .addEdge("parseLinkedIn", "mapToSchema")
    .addEdge("mapToSchema", "validate")
    .addEdge("validate", END);

  return graph.compile();
}
