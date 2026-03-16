import { createSignal, Show } from 'solid-js';
import { useAuth } from '../../auth';
import { Sidebar } from './Sidebar';
import { ProfileEditor } from '../profile/ProfileEditor';
import { CvEditor } from '../cv/CvEditor';
import { ChatPanel } from '../chat/ChatPanel';

export function AppShell() {
  const auth = useAuth();
  const [activeView, setActiveView] = createSignal('profile');
  const [chatOpen, setChatOpen] = createSignal(true);

  const cvId = () => {
    const view = activeView();
    return view.startsWith('cv:') ? view.slice(3) : null;
  };

  return (
    <div class="min-h-screen bg-zinc-950 flex flex-col">
      <header class="border-b border-white/[0.06] h-14 shrink-0">
        <div class="px-6 h-full flex items-center justify-between">
          <h1 class="text-lg font-semibold text-white tracking-tight">cv.khadim.io</h1>
          <div class="flex items-center gap-4">
            <button
              onClick={() => setChatOpen(!chatOpen())}
              class={`text-sm transition-colors ${
                chatOpen() ? 'text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {chatOpen() ? 'Hide Chat' : 'AI Chat'}
            </button>
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

      <div class="flex flex-1 overflow-hidden">
        <Sidebar activeView={activeView()} onNavigate={setActiveView} />
        <main class="flex-1 overflow-y-auto p-6">
          <div class="max-w-4xl mx-auto">
            <Show when={activeView() === 'profile'}>
              <ProfileEditor />
            </Show>
            <Show when={cvId()}>
              <CvEditor cvId={cvId()!} />
            </Show>
          </div>
        </main>
        <Show when={chatOpen()}>
          <ChatPanel onClose={() => setChatOpen(false)} />
        </Show>
      </div>
    </div>
  );
}
