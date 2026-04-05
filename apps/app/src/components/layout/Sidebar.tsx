import { For, Show } from 'solid-js';
import { schema } from '../../schema.gen';
import { useDb, useQuery } from '@spooky-sync/client-solid';
import { useAuth } from '../../auth';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar(props: SidebarProps) {
  const db = useDb<typeof schema>();
  const auth = useAuth();

  const cvsQuery = useQuery(
    () => db.query('cv_document').where({ owner: auth.userId()! }).build(),
    { enabled: () => auth.userId() !== null }
  );

  const cvs = () => (cvsQuery.data() as any[]) || [];

  const createCv = async () => {
    try {
      const id = `cv_document:${crypto.randomUUID().replace(/-/g, '')}`;
      const result = await db.create(id as any, {
        owner: auth.userId()!,
        title: 'Untitled CV',
        theme: 'classic',
        section_order: ['education', 'experience', 'projects', 'skills'],
      } as any);
      if (result) {
        props.onNavigate(`cv:${(result as any).id}`);
        props.onClose?.();
      }
    } catch (err) {
      console.error('Failed to create CV:', err);
    }
  };

  const handleNavigate = (view: string) => {
    props.onNavigate(view);
    props.onClose?.();
  };

  const sidebarContent = (
    <nav class="p-4 space-y-1">
      <button
        onClick={() => handleNavigate('profile')}
        class={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
          props.activeView === 'profile'
            ? 'bg-white/[0.07] text-white font-medium'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
        }`}
      >
        Profile
      </button>

      <div class="pt-4 pb-2 px-3">
        <span class="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">CVs</span>
      </div>

      <For each={cvs()}>
        {(cv) => (
          <button
            onClick={() => handleNavigate(`cv:${cv.id}`)}
            class={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${
              props.activeView === `cv:${cv.id}`
                ? 'bg-white/[0.07] text-white font-medium'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            {cv.title}
          </button>
        )}
      </For>

      <button
        onClick={createCv}
        class="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
      >
        + New CV
      </button>
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside class="hidden md:block w-56 bg-zinc-900/30 border-r border-white/[0.04] overflow-y-auto shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      <Show when={props.open}>
        <div class="fixed inset-0 z-40 md:hidden">
          <div class="absolute inset-0 bg-black/60" onClick={props.onClose} />
          <aside class="relative w-64 h-full bg-zinc-900 border-r border-white/[0.04] overflow-y-auto">
            {sidebarContent}
          </aside>
        </div>
      </Show>
    </>
  );
}
