import { Show, For } from 'solid-js';
import type { ImportSummary } from '../../lib/import-entries';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  writing: boolean;
  import_summary?: ImportSummary | null;
}

export function ChatBubble(props: ChatBubbleProps) {
  const isUser = () => props.role === 'user';

  const summaryItems = () => {
    if (!props.import_summary) return [];
    const entries: Array<{ label: string; count: number }> = [];
    if (props.import_summary.education > 0) entries.push({ label: 'education', count: props.import_summary.education });
    if (props.import_summary.experience > 0) entries.push({ label: 'experience', count: props.import_summary.experience });
    if (props.import_summary.projects > 0) entries.push({ label: 'projects', count: props.import_summary.projects });
    if (props.import_summary.skills > 0) entries.push({ label: 'skills', count: props.import_summary.skills });
    if (props.import_summary.social_networks > 0) entries.push({ label: 'social networks', count: props.import_summary.social_networks });
    return entries;
  };

  return (
    <div class={`flex ${isUser() ? 'justify-end' : 'justify-start'}`}>
      <div
        class={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
          isUser()
            ? 'bg-zinc-800 text-white'
            : 'bg-zinc-900 border border-white/[0.06] text-zinc-200'
        }`}
      >
        <Show
          when={!props.writing}
          fallback={
            <div class="flex items-center gap-1 py-1">
              <span class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style="animation-delay: 0ms" />
              <span class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style="animation-delay: 150ms" />
              <span class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style="animation-delay: 300ms" />
            </div>
          }
        >
          <p class="whitespace-pre-wrap">{props.content}</p>

          <Show when={props.import_summary && summaryItems().length > 0}>
            <div class="mt-2 pt-2 border-t border-white/[0.06]">
              <p class="text-xs text-emerald-400 font-medium mb-1">Imported:</p>
              <For each={summaryItems()}>
                {(item) => (
                  <p class="text-xs text-zinc-400">{item.count} {item.label}</p>
                )}
              </For>
              <Show when={props.import_summary?.user_updated}>
                <p class="text-xs text-zinc-400">Profile updated</p>
              </Show>
            </div>
          </Show>
        </Show>
      </div>
    </div>
  );
}
