import { For } from 'solid-js';

interface CvItemSelectorProps {
  title: string;
  items: any[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  getLabel: (item: any) => string;
  getSubLabel?: (item: any) => string;
}

export function CvItemSelector(props: CvItemSelectorProps) {
  return (
    <div class="space-y-2">
      <h4 class="text-sm font-medium text-zinc-300">{props.title}</h4>
      <For each={props.items} fallback={<p class="text-xs text-zinc-500">No items in profile.</p>}>
        {(item) => (
          <label class="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={props.selectedIds.includes(item.id)}
              onChange={() => props.onToggle(item.id)}
              class="mt-0.5 accent-white"
            />
            <div>
              <div class="text-sm text-white">{props.getLabel(item)}</div>
              {props.getSubLabel && (
                <div class="text-xs text-zinc-500">{props.getSubLabel(item)}</div>
              )}
            </div>
          </label>
        )}
      </For>
    </div>
  );
}
