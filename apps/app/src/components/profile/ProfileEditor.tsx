import { PersonalInfoForm } from './PersonalInfoForm';
import { SocialNetworksEditor } from './SocialNetworksEditor';
import { SectionEditor } from './SectionEditor';
import { EducationForm } from './EducationForm';
import { ExperienceForm } from './ExperienceForm';
import { ProjectForm } from './ProjectForm';
import { SkillForm } from './SkillForm';
import { BulletForm } from './BulletForm';

export function ProfileEditor() {
  return (
    <div class="space-y-8">
      <div>
        <h2 class="text-xl font-semibold text-white mb-2">Base Profile</h2>
        <p class="text-sm text-zinc-400">
          Your base profile is the source of truth for all your CVs. Add all your information here, then select subsets when creating CVs.
        </p>
      </div>

      <div class="bg-zinc-900 border border-white/[0.06] rounded-xl p-6">
        <PersonalInfoForm />
      </div>

      <div class="bg-zinc-900 border border-white/[0.06] rounded-xl p-6">
        <SocialNetworksEditor />
      </div>

      <div class="bg-zinc-900 border border-white/[0.06] rounded-xl p-6">
        <SectionEditor
          title="Education"
          table="education_entry"
          renderItem={(item: any) => (
            <div>
              <div class="text-white text-sm font-medium">{item.institution}</div>
              <div class="text-zinc-400 text-sm">{[item.degree, item.area].filter(Boolean).join(' in ')}</div>
              <div class="text-zinc-500 text-xs mt-1">{[item.start_date, item.end_date].filter(Boolean).join(' - ')}</div>
            </div>
          )}
          renderForm={(item, onSave) => <EducationForm item={item} onSave={onSave} />}
          getLabel={(item: any) => item.institution}
        />
      </div>

      <div class="bg-zinc-900 border border-white/[0.06] rounded-xl p-6">
        <SectionEditor
          title="Experience"
          table="experience_entry"
          renderItem={(item: any) => (
            <div>
              <div class="text-white text-sm font-medium">{item.company}</div>
              <div class="text-zinc-400 text-sm">{item.position}</div>
              <div class="text-zinc-500 text-xs mt-1">{[item.start_date, item.end_date].filter(Boolean).join(' - ')}</div>
            </div>
          )}
          renderForm={(item, onSave) => <ExperienceForm item={item} onSave={onSave} />}
          getLabel={(item: any) => item.company}
        />
      </div>

      <div class="bg-zinc-900 border border-white/[0.06] rounded-xl p-6">
        <SectionEditor
          title="Projects"
          table="project_entry"
          renderItem={(item: any) => (
            <div>
              <div class="text-white text-sm font-medium">{item.name}</div>
              <div class="text-zinc-500 text-xs mt-1">{[item.start_date, item.end_date].filter(Boolean).join(' - ')}</div>
            </div>
          )}
          renderForm={(item, onSave) => <ProjectForm item={item} onSave={onSave} />}
          getLabel={(item: any) => item.name}
        />
      </div>

      <div class="bg-zinc-900 border border-white/[0.06] rounded-xl p-6">
        <SectionEditor
          title="Skills"
          table="skill_entry"
          renderItem={(item: any) => (
            <div>
              <span class="text-white text-sm font-medium">{item.label}</span>
              {item.details && <span class="text-zinc-400 text-sm ml-2">{item.details}</span>}
            </div>
          )}
          renderForm={(item, onSave) => <SkillForm item={item} onSave={onSave} />}
          getLabel={(item: any) => item.label}
        />
      </div>

      <div class="bg-zinc-900 border border-white/[0.06] rounded-xl p-6">
        <SectionEditor
          title="Custom Sections"
          table="bullet_entry"
          renderItem={(item: any) => (
            <div>
              <span class="text-zinc-400 text-xs">{item.section_name}</span>
              <div class="text-white text-sm">{item.bullet}</div>
            </div>
          )}
          renderForm={(item, onSave) => <BulletForm item={item} onSave={onSave} />}
          getLabel={(item: any) => item.bullet}
        />
      </div>
    </div>
  );
}
