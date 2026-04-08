import { Show, For } from 'solid-js';
import { useDownloadFile } from '@spooky-sync/client-solid';
import type { ImportSummary } from '../../lib/import-entries';

interface ChatBubbleProps {
  message: any;
  onRetry?: (messageId: string) => void;
  onConfirmUpdates?: (messageId: string) => void;
  onSkipUpdates?: (messageId: string) => void;
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
  const msg = () => props.message;
  const isUser = () => msg().role === 'user';
  const jobs = () => (msg().jobs_agents || []) as any[];
  const failed = () => {
    const j = jobs();
    return j.length > 0 && j.every((job: any) => job.status === 'failed');
  };
  const retryingJob = () =>
    jobs().find(
      (j: any) => (j.status === 'pending' || j.status === 'processing') && j.retries > 0,
    );
  const files = () => (msg().chat_files || []) as Array<{ path: string; name: string }>;
  const importSummary = () => msg().import_summary as ImportSummary | null | undefined;
  const pendingUpdates = () => msg().pending_user_updates as Record<string, string> | null | undefined;

  const summaryItems = () => {
    const s = importSummary();
    if (!s) return [];
    const entries: Array<{ label: string; count: number }> = [];
    if (s.education > 0) entries.push({ label: 'education', count: s.education });
    if (s.experience > 0) entries.push({ label: 'experience', count: s.experience });
    if (s.projects > 0) entries.push({ label: 'projects', count: s.projects });
    if (s.skills > 0) entries.push({ label: 'skills', count: s.skills });
    if (s.social_networks > 0) entries.push({ label: 'social networks', count: s.social_networks });
    return entries;
  };

  return (
    <div class={`flex ${isUser() ? 'justify-end' : 'justify-start'} animate-bubble-in`}>
      <div
        class={`max-w-[85%] text-[13px] leading-[1.6] ${
          isUser()
            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-[18px] rounded-br-[4px] px-3.5 py-2.5'
            : failed()
              ? 'bg-red-50 dark:bg-red-500/[0.06] text-zinc-500 dark:text-zinc-400 rounded-[18px] rounded-bl-[4px] px-3.5 py-2.5'
              : 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-800 dark:text-zinc-200 rounded-[18px] rounded-bl-[4px] px-3.5 py-2.5'
        }`}
      >
        <Show
          when={!msg().writing}
          fallback={
            <Show
              when={retryingJob()}
              fallback={
                <div class="flex items-center gap-1 py-0.5">
                  <span class="w-[5px] h-[5px] bg-zinc-400 dark:bg-zinc-500 rounded-full animate-dot-pulse" />
                  <span class="w-[5px] h-[5px] bg-zinc-400 dark:bg-zinc-500 rounded-full animate-dot-pulse" style="animation-delay: 0.15s" />
                  <span class="w-[5px] h-[5px] bg-zinc-400 dark:bg-zinc-500 rounded-full animate-dot-pulse" style="animation-delay: 0.3s" />
                </div>
              }
            >
              <div class="flex items-center gap-1.5 py-0.5 text-[11px] text-amber-500 dark:text-amber-400">
                <svg class="w-3 h-3 animate-spin" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13z" stroke="currentColor" stroke-width="1.5" stroke-dasharray="20 12" stroke-linecap="round" />
                </svg>
                <span>Retrying {retryingJob()!.retries}/{retryingJob()!.max_retries}</span>
              </div>
            </Show>
          }
        >
          <Show when={msg().content}>
            <p class="whitespace-pre-wrap">{msg().content}</p>
          </Show>

          {/* Retry button for failed messages */}
          <Show when={failed() && props.onRetry}>
            <div class="flex items-center gap-1.5 mt-2 pt-2 border-t border-red-100 dark:border-red-500/10">
              <button
                onClick={() => props.onRetry?.(msg().id)}
                class="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors group"
              >
                <svg
                  class="w-3 h-3 transition-transform group-hover:rotate-45"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M2.5 8a5.5 5.5 0 019.3-3.95l.7.7M13.5 8a5.5 5.5 0 01-9.3 3.95l-.7-.7"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M13 1.5v3.5h-3.5M3 14.5V11h3.5"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span>Retry</span>
              </button>
            </div>
          </Show>

          {/* File attachments */}
          <Show when={files().length > 0}>
            <div class={`flex flex-wrap gap-2 ${msg().content ? 'mt-2' : ''}`}>
              <For each={files()}>
                {(file) => <FileAttachment file={file} isUser={isUser()} />}
              </For>
            </div>
          </Show>

          <Show when={importSummary() && summaryItems().length > 0}>
            <div class={`mt-2 pt-2 ${isUser() ? 'border-t border-white/10' : 'border-t border-zinc-200 dark:border-white/[0.06]'}`}>
              <p class="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mb-1">Imported:</p>
              <For each={summaryItems()}>
                {(item) => (
                  <p class="text-[11px] text-zinc-400">{item.count} {item.label}</p>
                )}
              </For>
              <Show when={importSummary()?.user_updated}>
                <p class="text-[11px] text-zinc-400">Profile updated</p>
              </Show>
            </div>
          </Show>

          <Show when={pendingUpdates()}>
            <div class="mt-2 pt-2 border-t border-zinc-200 dark:border-white/[0.06]">
              <p class="text-[11px] font-medium text-zinc-300 mb-1">Proposed profile updates:</p>
              <For each={Object.entries(pendingUpdates()!)}>
                {([key, value]) => (
                  <p class="text-[11px] text-zinc-400">
                    <span class="text-zinc-500">{key}:</span> {String(value)}
                  </p>
                )}
              </For>
              <div class="flex gap-2 mt-2">
                <button
                  onClick={() => props.onConfirmUpdates?.(msg().id)}
                  class="text-[11px] px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => props.onSkipUpdates?.(msg().id)}
                  class="text-[11px] px-2.5 py-1 rounded-md bg-zinc-700/50 text-zinc-400 hover:bg-zinc-700 transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          </Show>
        </Show>
      </div>
    </div>
  );
}
