import { z } from "zod";

export const EducationEntrySchema = z.object({
  institution: z.string().min(1),
  area: z.string().optional(),
  degree: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  location: z.string().optional(),
  highlights: z.array(z.string()).optional(),
});

export const ExperienceEntrySchema = z.object({
  company: z.string().min(1),
  position: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  location: z.string().optional(),
  highlights: z.array(z.string()).optional(),
});

export const ProjectEntrySchema = z.object({
  name: z.string().min(1),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  location: z.string().optional(),
  highlights: z.array(z.string()).optional(),
});

export const SkillEntrySchema = z.object({
  label: z.string().min(1),
  details: z.string().optional(),
});

export const SocialNetworkSchema = z.object({
  network: z.string().min(1),
  network_username: z.string().min(1),
});

export const UserUpdatesSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
});

export const ImportResultSchema = z.object({
  education_entries: z.array(EducationEntrySchema),
  experience_entries: z.array(ExperienceEntrySchema),
  project_entries: z.array(ProjectEntrySchema),
  skill_entries: z.array(SkillEntrySchema),
  social_networks: z.array(SocialNetworkSchema),
  user_updates: UserUpdatesSchema.optional(),
});

export type EducationEntry = z.infer<typeof EducationEntrySchema>;
export type ExperienceEntry = z.infer<typeof ExperienceEntrySchema>;
export type ProjectEntry = z.infer<typeof ProjectEntrySchema>;
export type SkillEntry = z.infer<typeof SkillEntrySchema>;
export type SocialNetwork = z.infer<typeof SocialNetworkSchema>;
export type UserUpdates = z.infer<typeof UserUpdatesSchema>;
export type ImportResult = z.infer<typeof ImportResultSchema>;

export interface ChatRequest {
  message: string;
  owner_id: string;
}

export interface ChatResponse {
  message: string;
  action: 'import_linkedin' | 'import_csv' | 'none';
  import_result?: ImportResult;
}

export interface ChatGraphState {
  message: string;
  owner_id: string;
  intent?: 'chat' | 'import_linkedin' | 'import_csv';
  extracted_data?: string;
  response?: ChatResponse;
  error?: string;
}

export interface GraphState {
  raw_input: string;
  owner_id: string;
  parsed_data?: Record<string, unknown>;
  column_mapping?: Record<string, string>;
  target_table?: string;
  result?: ImportResult;
  error?: string;
}
