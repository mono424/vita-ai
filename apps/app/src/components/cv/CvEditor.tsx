import { createSignal, createEffect, Show, onCleanup } from 'solid-js';
import { schema } from '../../schema.gen';
import { useDb, useQuery } from '@spooky-sync/client-solid';
import { useAuth } from '../../auth';
import { CvSettingsPanel } from './CvSettingsPanel';
import { CvPreview } from './CvPreview';
import { buildYaml } from '../../lib/yaml-builder';
import { SlidersHorizontal, MoreHorizontal, Pencil, X, Trash2 } from 'lucide-solid';

interface CvEditorProps {
  cvId: string;
}

export function CvEditor(props: CvEditorProps) {
  const db = useDb<typeof schema>();
  const auth = useAuth();

  const [renderError, setRenderError] = createSignal<string | null>(null);
  const [panelOpen, setPanelOpen] = createSignal(false);
  const [menuOpen, setMenuOpen] = createSignal(false);
  const [editingTitle, setEditingTitle] = createSignal(false);
  let titleInputRef: HTMLInputElement | undefined;

  // Close overflow menu on outside click
  createEffect(() => {
    if (!menuOpen()) return;
    const handler = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-overflow-menu]')) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handler);
    onCleanup(() => document.removeEventListener('pointerdown', handler));
  });

  // Auto-focus title input
  createEffect(() => {
    if (editingTitle() && titleInputRef) {
      titleInputRef.focus();
      titleInputRef.select();
    }
  });

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

  const handleTitleSave = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== cv()?.title) {
      updateCv({ title: trimmed });
    }
    setEditingTitle(false);
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
      <div class="flex flex-col h-full">
        {/* Header */}
        <div class="flex items-center justify-between pb-4">
          <div class="flex items-center gap-2 min-w-0">
            <Show
              when={!editingTitle()}
              fallback={
                <input
                  ref={titleInputRef}
                  value={cv()?.title || ''}
                  onBlur={(e) => handleTitleSave(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSave(e.currentTarget.value);
                    if (e.key === 'Escape') setEditingTitle(false);
                  }}
                  class="text-xl font-semibold text-white bg-transparent border-b border-zinc-600 outline-none py-0.5 min-w-0"
                />
              }
            >
              <button
                onClick={() => setEditingTitle(true)}
                class="group flex items-center gap-2 min-w-0"
              >
                <h2 class="text-xl font-semibold text-white truncate">
                  {cv()?.title || 'Untitled CV'}
                </h2>
                <Pencil class="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            </Show>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setPanelOpen(!panelOpen())}
              class={`p-2 rounded-lg transition-colors ${
                panelOpen()
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
              title="Settings"
            >
              <SlidersHorizontal class="w-5 h-5" />
            </button>

            <button
              onClick={handleRender}
              disabled={rendering()}
              class="bg-white text-zinc-900 font-medium px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 text-sm"
            >
              {rendering() ? 'Rendering...' : 'Render PDF'}
            </button>

            {/* Overflow menu */}
            <div class="relative" data-overflow-menu>
              <button
                onClick={() => setMenuOpen(!menuOpen())}
                class="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <MoreHorizontal class="w-5 h-5" />
              </button>
              <Show when={menuOpen()}>
                <div class="absolute right-0 top-full mt-1 bg-zinc-800 border border-white/[0.06] rounded-lg shadow-xl py-1 min-w-[160px] z-50 animate-dropdown-in">
                  <button
                    onClick={() => { setMenuOpen(false); deleteCv(); }}
                    class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-700/50 transition-colors"
                  >
                    <Trash2 class="w-4 h-4" />
                    Delete CV
                  </button>
                </div>
              </Show>
            </div>
          </div>
        </div>

        {/* Body */}
        <div class="flex-1 flex min-h-0 relative overflow-hidden">
          {/* Preview — full width */}
          <div class="flex-1 min-w-0">
            <CvPreview
              pdfUrl={cv()?.pdf_url || null}
              loading={rendering()}
              error={renderError()}
              onRender={handleRender}
            />
          </div>

          {/* Settings Panel — slide-in from right */}
          <div
            class={`absolute top-0 right-0 h-full w-[380px] bg-zinc-900 border-l border-white/[0.06] transition-transform duration-300 z-10 ${
              panelOpen() ? 'translate-x-0' : 'translate-x-full'
            }`}
            style="transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1)"
          >
            <div class="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
              <span class="text-sm font-medium text-white">Settings</span>
              <button
                onClick={() => setPanelOpen(false)}
                class="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
            <div class="h-[calc(100%-49px)] overflow-y-auto">
              <CvSettingsPanel
                theme={cv()?.theme || 'classic'}
                sectionOrder={cv()?.section_order || ['education', 'experience', 'projects', 'skills']}
                includePhone={cv()?.include_phone || false}
                onThemeChange={(val) => updateCv({ theme: val })}
                onSectionOrderChange={(val) => updateCv({ section_order: val })}
                onIncludePhoneChange={(val) => updateCv({ include_phone: val })}
                education={education()}
                experience={experience()}
                projects={projects()}
                skills={skills()}
                bullets={bullets()}
                selectedEducation={selectedIds('selected_education')}
                selectedExperience={selectedIds('selected_experience')}
                selectedProjects={selectedIds('selected_projects')}
                selectedSkills={selectedIds('selected_skills')}
                selectedBullets={selectedIds('selected_bullets')}
                onToggleItem={toggleItem}
              />
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
}
