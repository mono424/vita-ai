interface ImportResult {
  education_entries: Array<Record<string, unknown>>;
  experience_entries: Array<Record<string, unknown>>;
  project_entries: Array<Record<string, unknown>>;
  skill_entries: Array<Record<string, unknown>>;
  social_networks: Array<Record<string, unknown>>;
  user_updates?: Record<string, unknown>;
}

export interface ImportSummary {
  education: number;
  experience: number;
  projects: number;
  skills: number;
  social_networks: number;
  user_updated: boolean;
}

async function deterministicId(table: string, parts: string[]): Promise<string> {
  const input = parts.join('|');
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${table}:${hex.slice(0, 24)}`;
}

/** Create or update — tries create first, falls back to update if the ID exists */
async function upsert(db: any, table: string, id: string, data: Record<string, unknown>): Promise<void> {
  try {
    await db.create(id as any, data as any);
  } catch {
    // Record already exists — update instead
    await db.update(table as any, id as any, data as any);
  }
}

export async function importEntries(
  db: any,
  userId: string,
  result: ImportResult
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    education: 0,
    experience: 0,
    projects: 0,
    skills: 0,
    social_networks: 0,
    user_updated: false,
  };

  for (const entry of result.education_entries) {
    const id = await deterministicId('education_entry', [
      userId,
      String(entry.institution ?? ''),
      String(entry.area ?? ''),
      String(entry.degree ?? ''),
      String(entry.start_date ?? ''),
    ]);
    await upsert(db, 'education_entry', id, { owner: userId, ...entry });
    summary.education++;
  }

  for (const entry of result.experience_entries) {
    const id = await deterministicId('experience_entry', [
      userId,
      String(entry.company ?? ''),
      String(entry.position ?? ''),
      String(entry.start_date ?? ''),
    ]);
    await upsert(db, 'experience_entry', id, { owner: userId, ...entry });
    summary.experience++;
  }

  for (const entry of result.project_entries) {
    const id = await deterministicId('project_entry', [
      userId,
      String(entry.name ?? ''),
      String(entry.start_date ?? ''),
    ]);
    await upsert(db, 'project_entry', id, { owner: userId, ...entry });
    summary.projects++;
  }

  for (const entry of result.skill_entries) {
    const id = await deterministicId('skill_entry', [
      userId,
      String(entry.label ?? ''),
    ]);
    await upsert(db, 'skill_entry', id, { owner: userId, ...entry });
    summary.skills++;
  }

  for (const entry of result.social_networks) {
    const id = await deterministicId('social_network', [
      userId,
      String(entry.network ?? ''),
      String(entry.network_username ?? ''),
    ]);
    await upsert(db, 'social_network', id, { owner: userId, ...entry });
    summary.social_networks++;
  }

  return summary;
}
