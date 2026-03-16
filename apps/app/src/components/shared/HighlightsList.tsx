import { For, createSignal } from 'solid-js';
import { Input } from './FormField';

interface HighlightsListProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function HighlightsList(props: HighlightsListProps) {
  const [newItem, setNewItem] = createSignal('');

  const addItem = () => {
    const val = newItem().trim();
    if (val) {
      props.onChange([...props.value, val]);
      setNewItem('');
    }
  };

  const removeItem = (index: number) => {
    props.onChange(props.value.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, val: string) => {
    const updated = [...props.value];
    updated[index] = val;
    props.onChange(updated);
  };

  return (
    <div class="space-y-2">
      <For each={props.value}>
        {(item, index) => (
          <div class="flex gap-2">
            <Input
              value={item}
              onInput={(e) => updateItem(index(), e.currentTarget.value)}
            />
            <button
              type="button"
              onClick={() => removeItem(index())}
              class="text-zinc-500 hover:text-red-400 transition-colors px-2 shrink-0"
            >
              &times;
            </button>
          </div>
        )}
      </For>
      <div class="flex gap-2">
        <Input
          value={newItem()}
          onInput={(e) => setNewItem(e.currentTarget.value)}
          placeholder="Add item..."
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
        />
        <button
          type="button"
          onClick={addItem}
          class="text-zinc-400 hover:text-white transition-colors px-3 shrink-0 border border-white/[0.06] rounded-lg"
        >
          +
        </button>
      </div>
    </div>
  );
}
