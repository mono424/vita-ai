import { createSignal, Show } from 'solid-js';
import { useAuth } from '../../auth';
import { Sidebar } from './Sidebar';
import { ProfileEditor } from '../profile/ProfileEditor';
import { CvEditor } from '../cv/CvEditor';
import { ChatPanel } from '../chat/ChatPanel';

export function AppShell() {
  const auth = useAuth();
  const [activeView, setActiveView] = createSignal('profile');
  const [chatOpen, setChatOpen] = createSignal(false);

  const cvId = () => {
    const view = activeView();
    return view.startsWith('cv:') ? view.slice(3) : null;
  };

  return (
    <div class="h-screen bg-zinc-950 flex flex-col">
      <header class="border-b border-white/[0.06] h-14 shrink-0">
        <div class="px-6 h-full flex items-center justify-between">
          <h1 class="text-lg font-semibold text-white tracking-tight">cv.khadim.io</h1>
          <div class="flex items-center gap-4">
            <Show when={auth.user()}>
              <span class="text-sm text-zinc-400">{auth.user()?.username}</span>
            </Show>
            <button
              onClick={auth.signOut}
              class="text-sm text-zinc-500 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div class="flex flex-1 min-h-0">
        <Sidebar activeView={activeView()} onNavigate={setActiveView} />
        <main class="flex-1 overflow-y-auto">
          <Show when={activeView() === 'profile'}>
            <div class="p-8">
              <div class="max-w-4xl mx-auto">
                <ProfileEditor />
              </div>
            </div>
          </Show>
          <Show when={cvId()}>
            <div class="p-6 h-full">
              <CvEditor cvId={cvId()!} />
            </div>
          </Show>
        </main>
      </div>

      {/* Floating chat */}
      <Show when={chatOpen()}>
        <ChatPanel onClose={() => setChatOpen(false)} />
      </Show>

      {/* Floating VitaAI button */}
      <Show when={!chatOpen()}>
        <button
          onClick={() => setChatOpen(true)}
          class="fixed bottom-6 right-6 z-50 animate-fab-in flex items-center gap-2 bg-white text-zinc-900 pl-4 pr-5 py-3 rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.12),0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_8px_30px_rgba(0,0,0,0.16),0_16px_50px_rgba(0,0,0,0.1)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path d="M2 3.5C2 2.67 2.67 2 3.5 2h9c.83 0 1.5.67 1.5 1.5v7c0 .83-.67 1.5-1.5 1.5H6l-2.5 2.5V12H3.5C2.67 12 2 11.33 2 10.5v-7z" fill="currentColor" />
          </svg>
          <span class="text-sm font-semibold tracking-tight">VitaAI</span>
        </button>
      </Show>
    </div>
  );
}
