import { StateGraph, Annotation, END } from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";
import { parse } from "csv-parse/sync";
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

async function analyzeCSV(state: GraphState): Promise<Partial<GraphState>> {
  let records: Record<string, string>[];
  try {
    records = parse(state.raw_input, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch {
    return { error: "Failed to parse CSV content" };
  }

  if (records.length === 0) {
    return { error: "CSV contains no data rows" };
  }

  const headers = Object.keys(records[0]);
  const sampleRows = records.slice(0, 5);

  const response = await model.invoke([
    {
      role: "system",
      content: `You are a CSV data analyst. Analyze the CSV headers and sample data to understand what kind of CV data this contains.

The target CV schema has these tables:
- education_entry: institution (required), area, degree, start_date, end_date, location, highlights
- experience_entry: company (required), position, start_date, end_date, location, highlights
- project_entry: name (required), start_date, end_date, location, highlights
- skill_entry: label (required), details
- social_network: network (required), network_username (required)

Return a JSON object with:
- table: the most likely target table name
- column_mapping: { csv_column: schema_field } for each CSV column
- data: the full parsed data array with columns renamed to schema fields

${state.target_table ? `Hint: the user suggested this maps to "${state.target_table}".` : ""}`,
    },
    {
      role: "user",
      content: `CSV Headers: ${JSON.stringify(headers)}\n\nSample rows:\n${JSON.stringify(sampleRows, null, 2)}\n\nTotal rows: ${records.length}`,
    },
  ]);

  let analysis: { table: string; column_mapping: Record<string, string>; data: Record<string, unknown>[] };
  try {
    const content = response.content as string;
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
    analysis = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : content);
  } catch {
    return { error: "Failed to analyze CSV structure" };
  }

  // Re-map all records using the column mapping
  const mappedRecords = records.map((row) => {
    const mapped: Record<string, unknown> = {};
    for (const [csvCol, schemaField] of Object.entries(analysis.column_mapping)) {
      if (row[csvCol] !== undefined && row[csvCol] !== "") {
        mapped[schemaField] = row[csvCol];
      }
    }
    return mapped;
  });

  return {
    parsed_data: {
      table: analysis.table,
      entries: mappedRecords,
    },
    column_mapping: analysis.column_mapping,
    target_table: analysis.table,
  };
}

export function createCSVImportGraph() {
  const graph = new StateGraph(GraphStateAnnotation)
    .addNode("analyzeCSV", analyzeCSV)
    .addNode("mapToSchema", mapToSchema)
    .addNode("validate", validate)
    .addEdge("__start__", "analyzeCSV")
    .addEdge("analyzeCSV", "mapToSchema")
    .addEdge("mapToSchema", "validate")
    .addEdge("validate", END);

  return graph.compile();
}
