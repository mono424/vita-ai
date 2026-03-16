import { Show } from "solid-js";
import { createHotkey } from "@tanstack/solid-hotkeys";
import { CornerDownLeft, Command } from "lucide-solid";

interface SaveButtonProps {
  onClick: () => void;
  saving?: boolean;
  disabled?: boolean;
  label?: string;
}

export function SaveButton(props: SaveButtonProps) {
  createHotkey("Mod+Enter", (e) => {
    e.preventDefault();
    if (!props.disabled && !props.saving) {
      props.onClick();
    }
  });

  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled || props.saving}
      class="inline-flex items-center gap-2 bg-white text-zinc-900 font-medium px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 text-sm"
    >
      <span>{props.saving ? "Saving..." : (props.label || "Save")}</span>
      <Show when={!props.saving}>
        <kbd class="inline-flex items-center gap-0.5 text-xs text-zinc-500 bg-zinc-100 border border-zinc-200 rounded px-1.5 py-0.5">
          {isMac ? <Command size={12} /> : <span>Ctrl</span>}
          <span class="text-zinc-400">+</span>
          <CornerDownLeft size={12} />
        </kbd>
      </Show>
    </button>
  );
}
