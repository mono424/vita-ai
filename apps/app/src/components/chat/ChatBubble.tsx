import { Show, For } from 'solid-js';
import { useDownloadFile } from '@spooky-sync/client-solid';
import type { ImportSummary } from '../../lib/import-entries';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  writing: boolean;
  import_summary?: ImportSummary | null;
  files?: Array<{ path: string; name: string }>;
}

function FileAttachment(props: { file: { path: string; name: string }; isUser: boolean }) {
  const isImage = () => {
    const name = props.file.name.toLowerCase();
    return name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg');
  };

  // @ts-expect-error — bucket name is valid but generic inference doesn't resolve
  const result = useDownloadFile('chat_documents', () => props.file.path);

  return (
    <Show when={result.url()}>
      <Show
        when={isImage()}
        fallback={
          <a
            href={result.url()!}
            download={props.file.name}
            class={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] transition-colors ${
              props.isUser
                ? 'border-zinc-700 dark:border-zinc-300 text-zinc-200 dark:text-zinc-600 hover:bg-white/10 dark:hover:bg-zinc-100'
                : 'border-zinc-200 dark:border-white/[0.08] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/[0.04]'
            }`}
          >
            <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none">
              <path d="M4 2h5l3 3v9H4V2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
            </svg>
            <span class="truncate max-w-[140px]">{props.file.name}</span>
          </a>
        }
      >
        <img
          src={result.url()!}
          alt={props.file.name}
          class="max-w-[240px] rounded-lg border border-zinc-200 dark:border-white/[0.08]"
        />
      </Show>
    </Show>
  );
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
    <div class={`flex ${isUser() ? 'justify-end' : 'justify-start'} animate-bubble-in`}>
      <div
        class={`max-w-[85%] text-[13px] leading-[1.6] ${
          isUser()
            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-[18px] rounded-br-[4px] px-3.5 py-2.5'
            : 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-800 dark:text-zinc-200 rounded-[18px] rounded-bl-[4px] px-3.5 py-2.5'
        }`}
      >
        <Show
          when={!props.writing}
          fallback={
            <div class="flex items-center gap-1 py-0.5">
              <span class="w-[5px] h-[5px] bg-zinc-400 dark:bg-zinc-500 rounded-full animate-dot-pulse" />
              <span class="w-[5px] h-[5px] bg-zinc-400 dark:bg-zinc-500 rounded-full animate-dot-pulse" style="animation-delay: 0.15s" />
              <span class="w-[5px] h-[5px] bg-zinc-400 dark:bg-zinc-500 rounded-full animate-dot-pulse" style="animation-delay: 0.3s" />
            </div>
          }
        >
          <Show when={props.content}>
            <p class="whitespace-pre-wrap">{props.content}</p>
          </Show>

          {/* File attachments */}
          <Show when={props.files && props.files.length > 0}>
            <div class={`flex flex-wrap gap-2 ${props.content ? 'mt-2' : ''}`}>
              <For each={props.files}>
                {(file) => <FileAttachment file={file} isUser={isUser()} />}
              </For>
            </div>
          </Show>

          <Show when={props.import_summary && summaryItems().length > 0}>
            <div class={`mt-2 pt-2 ${isUser() ? 'border-t border-white/10' : 'border-t border-zinc-200 dark:border-white/[0.06]'}`}>
              <p class="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mb-1">Imported:</p>
              <For each={summaryItems()}>
                {(item) => (
                  <p class="text-[11px] text-zinc-400">{item.count} {item.label}</p>
                )}
              </For>
              <Show when={props.import_summary?.user_updated}>
                <p class="text-[11px] text-zinc-400">Profile updated</p>
              </Show>
            </div>
          </Show>
        </Show>
      </div>
    </div>
  );
}
