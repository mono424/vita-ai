import { Surreal } from "surrealdb";

let db: Surreal | null = null;

async function getDb(): Promise<Surreal> {
  if (db) return db;

  db = new Surreal();
  const url = process.env.SURREAL_URL || "http://localhost:8666";
  const user = process.env.SURREAL_USER || "root";
  const pass = process.env.SURREAL_PASS || "root";
  const ns = process.env.SURREAL_NS || "main";
  const dbName = process.env.SURREAL_DB || "main";

  await db.connect(url);
  await db.signin({ username: user, password: pass });
  await db.use({ namespace: ns, database: dbName });

  return db;
}

export async function updateChatMessage(
  messageId: string,
  content: string,
  importResult?: any,
): Promise<void> {
  const surreal = await getDb();

  const importLine = importResult
    ? `, import_result = $import_result`
    : "";

  await surreal.query(
    `UPDATE <record> $msg_id SET
      content = $content,
      writing = false${importLine}`,
    {
      msg_id: messageId,
      content,
      ...(importResult ? { import_result: importResult } : {}),
    },
  );
}
