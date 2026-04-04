import { SyncedDbConfig } from "@spooky-sync/client-solid";
import { schema, SURQL_SCHEMA } from "./schema.gen";

export const dbConfig: SyncedDbConfig<typeof schema> = {
  schema: schema,
  schemaSurql: SURQL_SCHEMA,
  persistenceClient: "localstorage",
  logLevel: "debug",
  database: {
    namespace: "vitaai",
    database: "main",
    endpoint: import.meta.env.VITE_DB_ENDPOINT || "ws://localhost:8666/rpc",
    store: "memory",
  },
};
