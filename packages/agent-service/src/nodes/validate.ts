import {
  EducationEntrySchema,
  ExperienceEntrySchema,
  ProjectEntrySchema,
  SkillEntrySchema,
  SocialNetworkSchema,
  UserUpdatesSchema,
  type GraphState,
} from "../types.js";

export async function validate(state: GraphState): Promise<Partial<GraphState>> {
  if (!state.result) {
    return { error: "No result to validate" };
  }

  const result = state.result;

  const education_entries = result.education_entries.filter((e) => {
    const parsed = EducationEntrySchema.safeParse(e);
    return parsed.success;
  });

  const experience_entries = result.experience_entries.filter((e) => {
    const parsed = ExperienceEntrySchema.safeParse(e);
    return parsed.success;
  });

  const project_entries = result.project_entries.filter((e) => {
    const parsed = ProjectEntrySchema.safeParse(e);
    return parsed.success;
  });

  const skill_entries = result.skill_entries.filter((e) => {
    const parsed = SkillEntrySchema.safeParse(e);
    return parsed.success;
  });

  const social_networks = result.social_networks.filter((e) => {
    const parsed = SocialNetworkSchema.safeParse(e);
    return parsed.success;
  });

  const user_updates = result.user_updates
    ? UserUpdatesSchema.safeParse(result.user_updates).success
      ? result.user_updates
      : undefined
    : undefined;

  return {
    result: {
      education_entries,
      experience_entries,
      project_entries,
      skill_entries,
      social_networks,
      user_updates,
    },
  };
}
