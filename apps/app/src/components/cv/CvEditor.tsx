import { createSignal, createEffect, Show } from 'solid-js';
import { schema } from '../../schema.gen';
import { useDb, useQuery } from '@spooky-sync/client-solid';
import { useAuth } from '../../auth';
import { CvItemSelector } from './CvItemSelector';
import { CvSettingsPanel } from './CvSettingsPanel';
import { CvPreview } from './CvPreview';
import { buildYaml } from '../../lib/yaml-builder';

interface CvEditorProps {
  cvId: string;
}

export function CvEditor(props: CvEditorProps) {
  const db = useDb<typeof schema>();
  const auth = useAuth();

  const [renderError, setRenderError] = createSignal<string | null>(null);

  // Query the CV document
  const cvQuery = useQuery(
    () => db.query('cv_document').where({ id: props.cvId }).one().build() as any,
    { enabled: () => !!props.cvId }
  );

  // Query all profile entries
  const educationQuery = useQuery(
    () => db.query('education_entry').where({ owner: auth.userId()! }).build(),
    { enabled: () => auth.userId() !== null }
  );
  const experienceQuery = useQuery(
    () => db.query('experience_entry').where({ owner: auth.userId()! }).build(),
    { enabled: () => auth.userId() !== null }
  );
  const projectsQuery = useQuery(
    () => db.query('project_entry').where({ owner: auth.userId()! }).build(),
    { enabled: () => auth.userId() !== null }
  );
  const skillsQuery = useQuery(
    () => db.query('skill_entry').where({ owner: auth.userId()! }).build(),
    { enabled: () => auth.userId() !== null }
  );
  const bulletsQuery = useQuery(
    () => db.query('bullet_entry').where({ owner: auth.userId()! }).build(),
    { enabled: () => auth.userId() !== null }
  );

  // Query render jobs for this CV
  const renderJobQuery = useQuery(
    () => db.query('jobs_render' as any).where({ assigned_to: props.cvId }).build() as any,
    { enabled: () => !!props.cvId }
  );

  const cv = () => cvQuery.data() as any;
  const education = () => (educationQuery.data() as any[]) || [];
  const experience = () => (experienceQuery.data() as any[]) || [];
  const projects = () => (projectsQuery.data() as any[]) || [];
  const skills = () => (skillsQuery.data() as any[]) || [];
  const bullets = () => (bulletsQuery.data() as any[]) || [];

  const renderJobs = () => (renderJobQuery.data() as any[]) || [];
  const latestJob = () => {
    const jobs = renderJobs();
    return jobs.length > 0 ? jobs[jobs.length - 1] : null;
  };
  const rendering = () => {
    const job = latestJob();
    return job?.status === 'pending' || job?.status === 'processing';
  };

  // React to render job status changes
  createEffect(() => {
    const job = latestJob();
    if (!job) return;
    if (job.status === 'success') {
      setRenderError(null);
    } else if (job.status === 'failed') {
      const errors = job.errors as any[] | undefined;
      const lastError = errors?.length ? errors[errors.length - 1] : null;
      setRenderError(lastError?.message || 'Render failed');
    }
  });

  const selectedIds = (field: string) => {
    const c = cv();
    if (!c || !c[field]) return [];
    return (c[field] as any[]).map((ref: any) => typeof ref === 'string' ? ref : ref.id || ref);
  };

  const toggleItem = async (field: string, id: string) => {
    const current = selectedIds(field);
    const updated = current.includes(id)
      ? current.filter((x: string) => x !== id)
      : [...current, id];
    await db.update('cv_document' as any, props.cvId as any, { [field]: updated } as any);
  };

  const updateCv = async (data: any) => {
    await db.update('cv_document' as any, props.cvId as any, data);
  };

  const deleteCv = async () => {
    await db.delete('cv_document' as any, props.cvId as any);
  };

  const handleRender = async () => {
    const c = cv();
    const user = auth.user();
    if (!c || !user) return;

    setRenderError(null);

    const selectedEdu = education().filter((e: any) => selectedIds('selected_education').includes(e.id));
    const selectedExp = experience().filter((e: any) => selectedIds('selected_experience').includes(e.id));
    const selectedProj = projects().filter((e: any) => selectedIds('selected_projects').includes(e.id));
    const selectedSkill = skills().filter((e: any) => selectedIds('selected_skills').includes(e.id));
    const selectedBullet = bullets().filter((e: any) => selectedIds('selected_bullets').includes(e.id));

    const yaml = buildYaml({
      user: user as any,
      cv: c,
      education: selectedEdu,
      experience: selectedExp,
      projects: selectedProj,
      skills: selectedSkill,
      bullets: selectedBullet,
    });

    await db.run('render' as any, '/render' as any, { yaml_content: yaml } as any, {
      assignedTo: props.cvId,
    });
  };

  return (
    <Show when={cv()} fallback={<p class="text-zinc-400 text-sm">Loading CV...</p>}>
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-white">{cv()?.title || 'Untitled CV'}</h2>
          <div class="flex gap-3">
            <button
              onClick={handleRender}
              disabled={rendering()}
              class="bg-white text-zinc-900 font-medium px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 text-sm"
            >
              {rendering() ? 'Rendering...' : 'Render PDF'}
            </button>
            <button
              onClick={deleteCv}
              class="text-red-400 hover:text-red-300 text-sm transition-colors px-3 py-2"
            >
              Delete CV
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-6">
          {/* Left: Settings + Selection */}
          <div class="space-y-6">
            <div class="bg-zinc-900 border border-white/[0.06] rounded-xl p-5">
              <CvSettingsPanel
                title={cv()?.title || ''}
                theme={cv()?.theme || 'classic'}
                sectionOrder={cv()?.section_order || ['education', 'experience', 'projects', 'skills']}
                includePhone={cv()?.include_phone || false}
                onTitleChange={(val) => updateCv({ title: val })}
                onThemeChange={(val) => updateCv({ theme: val })}
                onSectionOrderChange={(val) => updateCv({ section_order: val })}
                onIncludePhoneChange={(val) => updateCv({ include_phone: val })}
              />
            </div>

            <div class="bg-zinc-900 border border-white/[0.06] rounded-xl p-5 space-y-5">
              <h3 class="text-base font-medium text-white">Select Items</h3>
              <CvItemSelector
                title="Education"
                items={education()}
                selectedIds={selectedIds('selected_education')}
                onToggle={(id) => toggleItem('selected_education', id)}
                getLabel={(e) => e.institution}
                getSubLabel={(e) => [e.degree, e.area].filter(Boolean).join(' in ')}
              />
              <CvItemSelector
                title="Experience"
                items={experience()}
                selectedIds={selectedIds('selected_experience')}
                onToggle={(id) => toggleItem('selected_experience', id)}
                getLabel={(e) => e.company}
                getSubLabel={(e) => e.position}
              />
              <CvItemSelector
                title="Projects"
                items={projects()}
                selectedIds={selectedIds('selected_projects')}
                onToggle={(id) => toggleItem('selected_projects', id)}
                getLabel={(e) => e.name}
              />
              <CvItemSelector
                title="Skills"
                items={skills()}
                selectedIds={selectedIds('selected_skills')}
                onToggle={(id) => toggleItem('selected_skills', id)}
                getLabel={(e) => e.label}
                getSubLabel={(e) => e.details}
              />
              <CvItemSelector
                title="Custom Sections"
                items={bullets()}
                selectedIds={selectedIds('selected_bullets')}
                onToggle={(id) => toggleItem('selected_bullets', id)}
                getLabel={(e) => e.bullet}
                getSubLabel={(e) => e.section_name}
              />
            </div>
          </div>

          {/* Right: Preview */}
          <div class="min-h-[600px]">
            <CvPreview pdfUrl={cv()?.pdf_url || null} loading={rendering()} error={renderError()} />
          </div>
        </div>
      </div>
    </Show>
  );
}
