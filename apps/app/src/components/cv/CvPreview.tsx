import { Show } from 'solid-js';

interface CvPreviewProps {
  pdfUrl: string | null;
  loading: boolean;
  error: string | null;
}

export function CvPreview(props: CvPreviewProps) {
  return (
    <div class="h-full flex flex-col">
      <Show when={props.loading}>
        <div class="flex-1 flex items-center justify-center">
          <p class="text-sm text-zinc-400">Rendering PDF...</p>
        </div>
      </Show>
      <Show when={props.error}>
        <div class="flex-1 flex items-center justify-center">
          <p class="text-sm text-red-400">{props.error}</p>
        </div>
      </Show>
      <Show when={props.pdfUrl && !props.loading}>
        <iframe
          src={props.pdfUrl!}
          class="flex-1 w-full rounded-lg border border-white/[0.06] bg-white"
          title="CV Preview"
        />
      </Show>
      <Show when={!props.pdfUrl && !props.loading && !props.error}>
        <div class="flex-1 flex items-center justify-center">
          <p class="text-sm text-zinc-500">Click "Render" to generate a PDF preview.</p>
        </div>
      </Show>
    </div>
  );
}
