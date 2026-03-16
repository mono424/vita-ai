import { For, createSignal } from 'solid-js';
import { schema } from '../../schema.gen';
import { useDb, useQuery } from '@spooky-sync/client-solid';
import { useAuth } from '../../auth';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
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
    const id = `cv_document:${crypto.randomUUID().replace(/-/g, '')}`;
    const result = await db.create(id as any, {
      owner: auth.userId()!,
      title: 'Untitled CV',
      theme: 'classic',
      section_order: ['education', 'experience', 'projects', 'skills'],
    } as any);
    if (result) {
      props.onNavigate(`cv:${(result as any).id}`);
    }
  };

  return (
    <aside class="w-56 border-r border-white/[0.06] h-full overflow-y-auto">
      <nav class="p-3 space-y-1">
        <button
          onClick={() => props.onNavigate('profile')}
          class={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            props.activeView === 'profile'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          Profile
        </button>

        <div class="pt-4 pb-2 px-3">
          <span class="text-xs font-medium text-zinc-500 uppercase tracking-wider">CVs</span>
        </div>

        <For each={cvs()}>
          {(cv) => (
            <button
              onClick={() => props.onNavigate(`cv:${cv.id}`)}
              class={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${
                props.activeView === `cv:${cv.id}`
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              {cv.title}
            </button>
          )}
        </For>

        <button
          onClick={createCv}
          class="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-colors"
        >
          + New CV
        </button>
      </nav>
    </aside>
  );
}
