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
    <div class="border-t border-white/[0.06] p-3">
      <div class="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={text()}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={props.disabled}
          rows={1}
          class="flex-1 bg-zinc-800 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-zinc-600 transition-colors disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={props.disabled || !text().trim()}
          class="bg-white text-zinc-900 font-medium px-3 py-2 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 text-sm shrink-0"
        >
          Send
        </button>
      </div>
    </div>
  );
}
