import { For, Show } from 'solid-js';
import { Toggle } from '../shared/Toggle';
import type { Component } from 'solid-js';
import type { LucideProps } from 'lucide-solid';

interface CvItemSelectorProps {
  title: string;
  items: any[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  getLabel: (item: any) => string;
  getSubLabel?: (item: any) => string;
  emptyIcon?: Component<LucideProps>;
  emptyText?: string;
}

export function CvItemSelector(props: CvItemSelectorProps) {
  return (
    <div class="space-y-1">
      <Show when={props.items.length === 0}>
        <div class="flex flex-col items-center justify-center py-8 gap-3">
          <Show when={props.emptyIcon}>
            {(() => {
              const Icon = props.emptyIcon!;
              return <Icon class="w-8 h-8 text-zinc-700" />;
            })()}
          </Show>
          <p class="text-sm text-zinc-500">
            {props.emptyText || `No ${props.title.toLowerCase()} in your profile yet.`}
          </p>
        </div>
      </Show>

      <For each={props.items}>
        {(item) => (
          <div class="flex items-center justify-between px-3 py-2.5 rounded-lg border border-transparent hover:border-white/[0.06] hover:bg-zinc-800/30 transition-all duration-150 group">
            <div class="min-w-0 flex-1 mr-3">
              <div class="text-sm text-white truncate">{props.getLabel(item)}</div>
              <Show when={props.getSubLabel}>
                <div class="text-xs text-zinc-500 truncate">{props.getSubLabel!(item)}</div>
              </Show>
            </div>
            <Toggle
              checked={props.selectedIds.includes(item.id)}
              onChange={() => props.onToggle(item.id)}
            />
          </div>
        )}
      </For>
    </div>
  );
}
