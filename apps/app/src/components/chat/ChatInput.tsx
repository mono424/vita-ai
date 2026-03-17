import { createSignal } from 'solid-js';

interface ChatInputProps {
  disabled: boolean;
  onSend: (message: string) => void;
}

export function ChatInput(props: ChatInputProps) {
  const [text, setText] = createSignal('');
  let textareaRef: HTMLTextAreaElement | undefined;

  const handleSend = () => {
    const msg = text().trim();
    if (!msg || props.disabled) return;
    props.onSend(msg);
    setText('');
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

  return (
    <div class="px-3 pb-3 pt-2">
      <div class="flex items-end gap-2 bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] rounded-xl px-3 py-2 transition-colors focus-within:border-zinc-300 dark:focus-within:border-white/[0.16] focus-within:bg-white dark:focus-within:bg-white/[0.06]">
        <textarea
          ref={textareaRef}
          value={text()}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask VitaAI..."
          disabled={props.disabled}
          rows={1}
          class="flex-1 bg-transparent text-[13px] text-zinc-900 dark:text-white placeholder-zinc-400 resize-none focus:outline-none disabled:opacity-50 leading-relaxed"
        />
        <button
          onClick={handleSend}
          disabled={props.disabled || !text().trim()}
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
