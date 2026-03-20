interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle(props: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={props.checked}
      onClick={() => props.onChange(!props.checked)}
      class={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
        props.checked ? 'bg-white' : 'bg-zinc-700'
      }`}
    >
      <span
        class={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform duration-200 ${
          props.checked
            ? 'translate-x-4 bg-zinc-900'
            : 'translate-x-0 bg-zinc-400'
        }`}
        style="transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1)"
      />
    </button>
  );
}
