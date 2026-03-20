import { For } from 'solid-js';

interface SegmentedControlProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedControl(props: SegmentedControlProps) {
  return (
    <div class="flex bg-zinc-800/50 rounded-lg p-1 gap-1">
      <For each={props.options}>
        {(option) => (
          <button
            onClick={() => props.onChange(option.value)}
            class={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              props.value === option.value
                ? 'bg-zinc-700 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            {option.label}
          </button>
        )}
      </For>
    </div>
  );
}
