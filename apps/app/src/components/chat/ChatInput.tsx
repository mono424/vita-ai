import { createSignal, For, Show } from 'solid-js';

interface ChatInputProps {
  disabled: boolean;
  onSend: (message: string, files: File[]) => void;
}

const ACCEPTED_TYPES = '.txt,.csv,.pdf,.png,.jpg,.jpeg';
const ACCEPTED_EXTENSIONS = ['.txt', '.csv', '.pdf', '.png', '.jpg', '.jpeg'];

const isAcceptedFile = (file: File) => {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  return ACCEPTED_EXTENSIONS.includes(ext);
};

export function ChatInput(props: ChatInputProps) {
  const [text, setText] = createSignal('');
  const [selectedFiles, setSelectedFiles] = createSignal<File[]>([]);
  const [dragging, setDragging] = createSignal(false);
  let textareaRef: HTMLTextAreaElement | undefined;
  let fileInputRef: HTMLInputElement | undefined;

  const addFiles = (files: FileList | File[]) => {
    const accepted = Array.from(files).filter(isAcceptedFile);
    if (accepted.length > 0) {
      setSelectedFiles((prev) => [...prev, ...accepted]);
    }
  };

  const handleSend = () => {
    const msg = text().trim();
    if ((!msg && selectedFiles().length === 0) || props.disabled) return;
    props.onSend(msg, selectedFiles());
    setText('');
    setSelectedFiles([]);
    if (textareaRef) {
      textareaRef.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: InputEvent) => {
    const target = e.currentTarget as HTMLTextAreaElement;
    setText(target.value);
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
  };

  const handleFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.files) return;
    addFiles(input.files);
    input.value = '';
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    const current = e.currentTarget as HTMLElement;
    if (current.contains(e.relatedTarget as Node)) return;
    setDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer?.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handlePaste = (e: ClipboardEvent) => {
    if (e.clipboardData && e.clipboardData.files.length > 0) {
      e.preventDefault();
      addFiles(e.clipboardData.files);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const isImage = (file: File) => file.type.startsWith('image/');

  return (
    <div
      class={`px-3 pb-3 pt-2 rounded-xl transition-colors ${dragging() ? 'ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-zinc-900 bg-blue-50/50 dark:bg-blue-500/5' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* File preview bar */}
      <Show when={selectedFiles().length > 0}>
        <div class="flex gap-2 px-1 pb-2 overflow-x-auto">
          <For each={selectedFiles()}>
            {(file, index) => (
              <div class="relative shrink-0 group">
                <Show
                  when={isImage(file)}
                  fallback={
                    <div class="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08] rounded-lg">
                      <svg class="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 16 16" fill="none">
                        <path d="M4 2h5l3 3v9H4V2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
                      </svg>
                      <span class="text-[11px] text-zinc-600 dark:text-zinc-300 max-w-[80px] truncate">{file.name}</span>
                    </div>
                  }
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    class="w-12 h-12 rounded-lg object-cover border border-zinc-200 dark:border-white/[0.08]"
                  />
                </Show>
                <button
                  onClick={() => removeFile(index())}
                  class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-zinc-600 dark:bg-zinc-400 text-white dark:text-zinc-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                    <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  </svg>
                </button>
              </div>
            )}
          </For>
        </div>
      </Show>

      <div class="flex items-end gap-2 bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] rounded-xl px-3 py-2 transition-colors focus-within:border-zinc-300 dark:focus-within:border-white/[0.16] focus-within:bg-white dark:focus-within:bg-white/[0.06]">
        {/* Paperclip / attach button */}
        <button
          onClick={() => fileInputRef?.click()}
          disabled={props.disabled}
          class="p-1 rounded-lg text-zinc-400 transition-all hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.08] disabled:opacity-30 shrink-0"
          title="Attach files"
        >
          <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path d="M14 8l-5.5 5.5a3.5 3.5 0 01-5-5L9 3a2.5 2.5 0 013.5 3.5L7 12a1.5 1.5 0 01-2-2l5.5-5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES}
          onChange={handleFileSelect}
          class="hidden"
        />

        <textarea
          ref={textareaRef}
          value={text()}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Ask VitaAI..."
          disabled={props.disabled}
          rows={1}
          class="flex-1 bg-transparent text-[13px] text-zinc-900 dark:text-white placeholder-zinc-400 resize-none focus:outline-none disabled:opacity-50 leading-relaxed"
        />
        <button
          onClick={handleSend}
          disabled={props.disabled || (!text().trim() && selectedFiles().length === 0)}
          class="p-1 rounded-lg text-zinc-300 dark:text-zinc-600 transition-all disabled:opacity-30 enabled:text-zinc-900 dark:enabled:text-white enabled:hover:bg-zinc-100 dark:enabled:hover:bg-white/[0.08] shrink-0"
        >
          <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
