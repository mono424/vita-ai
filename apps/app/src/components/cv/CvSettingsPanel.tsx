import { For } from 'solid-js';
import { FormField, Input } from '../shared/FormField';

const THEMES = ['classic', 'sb2nov', 'moderncv', 'engineeringresumes'];
const SECTIONS = ['education', 'experience', 'projects', 'skills', 'custom'];

interface CvSettingsPanelProps {
  title: string;
  theme: string;
  sectionOrder: string[];
  includePhone: boolean;
  onTitleChange: (val: string) => void;
  onThemeChange: (val: string) => void;
  onSectionOrderChange: (val: string[]) => void;
  onIncludePhoneChange: (val: boolean) => void;
}

export function CvSettingsPanel(props: CvSettingsPanelProps) {
  const moveSection = (index: number, dir: -1 | 1) => {
    const order = [...props.sectionOrder];
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= order.length) return;
    [order[index], order[newIdx]] = [order[newIdx], order[index]];
    props.onSectionOrderChange(order);
  };

  return (
    <div class="space-y-4">
      <FormField label="CV Title">
        <Input value={props.title} onInput={(e) => props.onTitleChange(e.currentTarget.value)} />
      </FormField>

      <FormField label="Theme">
        <select
          value={props.theme}
          onChange={(e) => props.onThemeChange(e.currentTarget.value)}
          class="w-full bg-zinc-900 border border-white/[0.06] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-zinc-600 transition-colors"
        >
          <For each={THEMES}>
            {(theme) => <option value={theme}>{theme}</option>}
          </For>
        </select>
      </FormField>

      <label class="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={props.includePhone}
          onChange={(e) => props.onIncludePhoneChange(e.currentTarget.checked)}
          class="accent-white"
        />
        <span class="text-sm text-zinc-300">Include phone number</span>
      </label>

      <div>
        <label class="block text-sm text-zinc-400 mb-2">Section Order</label>
        <div class="space-y-1">
          <For each={props.sectionOrder}>
            {(section, index) => (
              <div class="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-2">
                <span class="text-sm text-white flex-1 capitalize">{section}</span>
                <button
                  onClick={() => moveSection(index(), -1)}
                  class="text-zinc-500 hover:text-white text-xs transition-colors"
                  disabled={index() === 0}
                >
                  Up
                </button>
                <button
                  onClick={() => moveSection(index(), 1)}
                  class="text-zinc-500 hover:text-white text-xs transition-colors"
                  disabled={index() === props.sectionOrder.length - 1}
                >
                  Down
                </button>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
