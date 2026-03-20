import { Show } from 'solid-js';
import { FileText, AlertCircle } from 'lucide-solid';

interface CvPreviewProps {
  pdfUrl: string | null;
  loading: boolean;
  error: string | null;
  onRender?: () => void;
}

export function CvPreview(props: CvPreviewProps) {
  return (
    <div class="h-full flex flex-col rounded-xl border border-white/[0.06] bg-zinc-900/50 overflow-hidden">
      <Show when={props.loading}>
        <div class="flex-1 flex flex-col items-center justify-center gap-4 animate-fade-in">
          <FileText class="w-10 h-10 text-zinc-500 animate-pulse" />
          <div class="flex items-center gap-1">
            <span class="text-sm text-zinc-400">Generating your PDF</span>
            <span class="flex gap-0.5 ml-1">
              <span class="w-1 h-1 rounded-full bg-zinc-500 animate-dot-pulse" style="animation-delay: 0s" />
              <span class="w-1 h-1 rounded-full bg-zinc-500 animate-dot-pulse" style="animation-delay: 0.2s" />
              <span class="w-1 h-1 rounded-full bg-zinc-500 animate-dot-pulse" style="animation-delay: 0.4s" />
            </span>
          </div>
        </div>
      </Show>

      <Show when={props.error && !props.loading}>
        <div class="flex-1 flex flex-col items-center justify-center gap-3 animate-fade-in">
          <AlertCircle class="w-8 h-8 text-red-400/80" />
          <p class="text-sm text-red-400">{props.error}</p>
          <Show when={props.onRender}>
            <button
              onClick={props.onRender}
              class="text-sm text-zinc-400 hover:text-white transition-colors underline underline-offset-2"
            >
              Try again
            </button>
          </Show>
        </div>
      </Show>

      <Show when={props.pdfUrl && !props.loading && !props.error}>
        <iframe
          src={props.pdfUrl!}
          class="flex-1 w-full bg-white animate-fade-in"
          title="CV Preview"
        />
      </Show>

      <Show when={!props.pdfUrl && !props.loading && !props.error}>
        <div class="flex-1 flex flex-col items-center justify-center gap-4">
          <FileText class="w-12 h-12 text-zinc-700" />
          <p class="text-sm text-zinc-500">No preview yet</p>
          <Show when={props.onRender}>
            <button
              onClick={props.onRender}
              class="text-sm text-zinc-400 hover:text-white border border-white/[0.06] px-4 py-2 rounded-lg transition-colors"
            >
              Render
            </button>
          </Show>
        </div>
      </Show>
    </div>
  );
}
