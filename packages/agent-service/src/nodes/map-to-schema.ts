import { ChatAnthropic } from "@langchain/anthropic";
import { ImportResultSchema, type GraphState } from "../types.js";

const model = new ChatAnthropic({
  model: "claude-sonnet-4-6",
  temperature: 0,
});

const structuredModel = model.withStructuredOutput(ImportResultSchema);

export async function mapToSchema(state: GraphState): Promise<Partial<GraphState>> {
  if (!state.parsed_data) {
    return { error: "No parsed data to map" };
  }

  const result = await structuredModel.invoke([
    {
      role: "system",
      content: `You are a data mapping assistant. Map the provided parsed data into CV entry types.

The target schema has these tables:
- education_entries: institution (required), area, degree, start_date, end_date, location, highlights[]
- experience_entries: company (required), position, start_date, end_date, location, highlights[]
- project_entries: name (required), start_date, end_date, location, highlights[]
- skill_entries: label (required), details
- social_networks: network (required), network_username (required)
- user_updates: name, email, phone, location, website

Map each piece of data to the most appropriate table. Dates should be strings like "2023-01" or "2023".
Highlights should be concise bullet points describing achievements or responsibilities.`,
    },
    {
      role: "user",
      content: `Map this data to CV entries:\n\n${JSON.stringify(state.parsed_data, null, 2)}`,
    },
  ]);

  return { result };
}
