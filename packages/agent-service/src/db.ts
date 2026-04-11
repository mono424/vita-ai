import { Surreal } from "surrealdb";

let db: Surreal | null = null;

async function getDb(): Promise<Surreal> {
  if (db) return db;

  db = new Surreal();
  const url = process.env.SURREAL_URL || "http://localhost:8666";
  const user = process.env.SURREAL_USER || "root";
  const pass = process.env.SURREAL_PASS || "root";
  const ns = process.env.SURREAL_NS || "vitaai";
  const dbName = process.env.SURREAL_DB || "main";

  await db.connect(url);
  await db.signin({ username: user, password: pass });
  await db.use({ namespace: ns, database: dbName });

  return db;
}

const MIME_TYPES: Record<string, string> = {
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

export function getMimeType(fileName: string): string {
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

export function isImageFile(fileName: string): boolean {
  const mime = getMimeType(fileName);
  return mime.startsWith('image/');
}

export async function readBucketFile(filePath: string): Promise<Uint8Array | null> {
  const surreal = await getDb();
  const [result] = await surreal.query<[Uint8Array | null]>(
    `RETURN f"chat_documents:/${filePath}".get();`
  );
  return result ?? null;
}

export async function getChatMessage(messageId: string): Promise<Record<string, any> | null> {
  const surreal = await getDb();
  const [result] = await surreal.query<[Record<string, any>[]]>(
    `SELECT * FROM <record> $msg_id`,
    { msg_id: messageId },
  );
  return result?.[0] ?? null;
}

export async function updateChatMessage(
  messageId: string,
  content: string,
  importResult?: any,
  pendingUserUpdates?: any,
): Promise<void> {
  const surreal = await getDb();

  const merge: Record<string, any> = { content, writing: false };
  if (importResult) merge.import_result = importResult;
  if (pendingUserUpdates) merge.pending_user_updates = pendingUserUpdates;

  await surreal.query(
    `UPDATE <record> $msg_id MERGE $merge`,
    { msg_id: messageId, merge },
  );
}
