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
    const id = `education_entry:${crypto.randomUUID().replace(/-/g, '')}`;
    await db.create(id, { owner: userId, ...entry });
    summary.education++;
  }

  for (const entry of result.experience_entries) {
    const id = `experience_entry:${crypto.randomUUID().replace(/-/g, '')}`;
    await db.create(id, { owner: userId, ...entry });
    summary.experience++;
  }

  for (const entry of result.project_entries) {
    const id = `project_entry:${crypto.randomUUID().replace(/-/g, '')}`;
    await db.create(id, { owner: userId, ...entry });
    summary.projects++;
  }

  for (const entry of result.skill_entries) {
    const id = `skill_entry:${crypto.randomUUID().replace(/-/g, '')}`;
    await db.create(id, { owner: userId, ...entry });
    summary.skills++;
  }

  for (const entry of result.social_networks) {
    const id = `social_network:${crypto.randomUUID().replace(/-/g, '')}`;
    await db.create(id, { owner: userId, ...entry });
    summary.social_networks++;
  }

  if (result.user_updates && Object.keys(result.user_updates).length > 0) {
    await db.update('user' as any, userId as any, result.user_updates as any);
    summary.user_updated = true;
  }

  return summary;
}
