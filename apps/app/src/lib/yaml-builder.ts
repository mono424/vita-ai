import jsYaml from 'js-yaml';

interface BuildYamlInput {
  user: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    website?: string;
  };
  cv: {
    theme?: string;
    section_order?: string[];
    include_phone?: boolean;
  };
  education: any[];
  experience: any[];
  projects: any[];
  skills: any[];
  bullets: any[];
}

export function buildYaml(input: BuildYamlInput): string {
  const { user, cv, education, experience, projects, skills, bullets } = input;

  const cvData: any = {
    cv: {
      name: user.name || 'Your Name',
      location: user.location || undefined,
      email: user.email || undefined,
      phone: cv.include_phone && user.phone ? user.phone : undefined,
      website: user.website || undefined,
      sections: {},
    },
    design: {
      theme: cv.theme || 'classic',
    },
  };

  const sectionOrder = cv.section_order || ['education', 'experience', 'projects', 'skills'];

  for (const section of sectionOrder) {
    switch (section) {
      case 'education':
        if (education.length > 0) {
          cvData.cv.sections.education = education.map((e) => ({
            institution: e.institution,
            area: e.area || undefined,
            degree: e.degree || undefined,
            start_date: e.start_date || undefined,
            end_date: e.end_date || undefined,
            location: e.location || undefined,
            highlights: e.highlights?.length > 0 ? e.highlights : undefined,
          }));
        }
        break;
      case 'experience':
        if (experience.length > 0) {
          cvData.cv.sections.experience = experience.map((e) => ({
            company: e.company,
            position: e.position || undefined,
            start_date: e.start_date || undefined,
            end_date: e.end_date || undefined,
            location: e.location || undefined,
            highlights: e.highlights?.length > 0 ? e.highlights : undefined,
          }));
        }
        break;
      case 'projects':
        if (projects.length > 0) {
          cvData.cv.sections.projects = projects.map((p) => ({
            name: p.name,
            start_date: p.start_date || undefined,
            end_date: p.end_date || undefined,
            location: p.location || undefined,
            highlights: p.highlights?.length > 0 ? p.highlights : undefined,
          }));
        }
        break;
      case 'skills':
        if (skills.length > 0) {
          cvData.cv.sections.technologies = skills.map((s) => ({
            label: s.label,
            details: s.details || undefined,
          }));
        }
        break;
      case 'custom': {
        // Group bullets by section_name
        const grouped: Record<string, string[]> = {};
        for (const b of bullets) {
          if (!grouped[b.section_name]) grouped[b.section_name] = [];
          grouped[b.section_name].push(b.bullet);
        }
        for (const [name, items] of Object.entries(grouped)) {
          cvData.cv.sections[name] = items.map((bullet) => ({ bullet }));
        }
        break;
      }
    }
  }

  return jsYaml.dump(cvData, { lineWidth: -1 });
}
