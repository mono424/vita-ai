import { JSX, Show } from 'solid-js';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: JSX.Element;
  maxWidth?: string;
}

export function Modal(props: ModalProps) {
  return (
    <Show when={props.open}>
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60" onClick={props.onClose} />
        <div class={`relative bg-zinc-900 border border-white/[0.06] rounded-xl p-6 w-full ${props.maxWidth || 'max-w-lg'} max-h-[90vh] overflow-y-auto mx-4`}>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-white">{props.title}</h3>
            <button
              onClick={props.onClose}
              class="text-zinc-500 hover:text-white transition-colors text-xl leading-none"
            >
              &times;
            </button>
          </div>
          {props.children}
        </div>
      </div>
    </Show>
  );
}
