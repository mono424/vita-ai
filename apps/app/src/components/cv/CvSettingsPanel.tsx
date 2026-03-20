import { createSignal, For, Show } from 'solid-js';
import { ChevronUp, ChevronDown, GripVertical, BookOpen, Briefcase, FolderOpen, Wrench, ListPlus } from 'lucide-solid';
import { Toggle } from '../shared/Toggle';
import { SegmentedControl } from '../shared/SegmentedControl';
import { CvItemSelector } from './CvItemSelector';

const THEME_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'sb2nov', label: 'SB2Nov' },
  { value: 'moderncv', label: 'ModernCV' },
  { value: 'engineeringresumes', label: 'Engineering' },
];

const CONTENT_TABS = [
  { key: 'education', label: 'Education', icon: BookOpen },
  { key: 'experience', label: 'Experience', icon: Briefcase },
  { key: 'projects', label: 'Projects', icon: FolderOpen },
  { key: 'skills', label: 'Skills', icon: Wrench },
  { key: 'custom', label: 'Custom', icon: ListPlus },
] as const;

interface CvSettingsPanelProps {
  theme: string;
  sectionOrder: string[];
  includePhone: boolean;
  onThemeChange: (val: string) => void;
  onSectionOrderChange: (val: string[]) => void;
  onIncludePhoneChange: (val: boolean) => void;
  // Item selector data
  education: any[];
  experience: any[];
  projects: any[];
  skills: any[];
  bullets: any[];
  selectedEducation: string[];
  selectedExperience: string[];
  selectedProjects: string[];
  selectedSkills: string[];
  selectedBullets: string[];
  onToggleItem: (field: string, id: string) => void;
}

export function CvSettingsPanel(props: CvSettingsPanelProps) {
  const [activeTab, setActiveTab] = createSignal<string>('education');

  const moveSection = (index: number, dir: -1 | 1) => {
    const order = [...props.sectionOrder];
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= order.length) return;
    [order[index], order[newIdx]] = [order[newIdx], order[index]];
    props.onSectionOrderChange(order);
  };

  const tabData = () => {
    const tab = activeTab();
    switch (tab) {
      case 'education':
        return { items: props.education, selected: props.selectedEducation, field: 'selected_education', getLabel: (e: any) => e.institution, getSubLabel: (e: any) => [e.degree, e.area].filter(Boolean).join(' in '), emptyIcon: BookOpen, emptyText: 'Add education entries in your profile.' };
      case 'experience':
        return { items: props.experience, selected: props.selectedExperience, field: 'selected_experience', getLabel: (e: any) => e.company, getSubLabel: (e: any) => e.position, emptyIcon: Briefcase, emptyText: 'Add work experience in your profile.' };
      case 'projects':
        return { items: props.projects, selected: props.selectedProjects, field: 'selected_projects', getLabel: (e: any) => e.name, getSubLabel: undefined, emptyIcon: FolderOpen, emptyText: 'Add projects in your profile.' };
      case 'skills':
        return { items: props.skills, selected: props.selectedSkills, field: 'selected_skills', getLabel: (e: any) => e.label, getSubLabel: (e: any) => e.details, emptyIcon: Wrench, emptyText: 'Add skills in your profile.' };
      case 'custom':
        return { items: props.bullets, selected: props.selectedBullets, field: 'selected_bullets', getLabel: (e: any) => e.bullet, getSubLabel: (e: any) => e.section_name, emptyIcon: ListPlus, emptyText: 'Add custom bullet entries in your profile.' };
      default:
        return { items: [], selected: [], field: '', getLabel: (e: any) => '', getSubLabel: undefined, emptyIcon: ListPlus, emptyText: '' };
    }
  };

  return (
    <div class="flex flex-col h-full">
      {/* Appearance */}
      <div class="px-5 py-4 space-y-4 border-b border-white/[0.06]">
        <h3 class="text-xs font-medium text-zinc-500 uppercase tracking-wider">Appearance</h3>
        <SegmentedControl
          options={THEME_OPTIONS}
          value={props.theme}
          onChange={props.onThemeChange}
        />
        <div class="flex items-center justify-between">
          <span class="text-sm text-zinc-300">Include phone number</span>
          <Toggle checked={props.includePhone} onChange={props.onIncludePhoneChange} />
        </div>
      </div>

      {/* Section Order */}
      <div class="px-5 py-4 space-y-3 border-b border-white/[0.06]">
        <h3 class="text-xs font-medium text-zinc-500 uppercase tracking-wider">Section Order</h3>
        <div class="space-y-1">
          <For each={props.sectionOrder}>
            {(section, index) => (
              <div class="flex items-center gap-2 bg-zinc-800/30 rounded-lg px-3 py-2 group">
                <GripVertical class="w-4 h-4 text-zinc-600 shrink-0" />
                <span class="text-sm text-white flex-1 capitalize">{section}</span>
                <button
                  onClick={() => moveSection(index(), -1)}
                  disabled={index() === 0}
                  class="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-700/50 transition-colors disabled:opacity-25 disabled:hover:text-zinc-500 disabled:hover:bg-transparent"
                >
                  <ChevronUp class="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveSection(index(), 1)}
                  disabled={index() === props.sectionOrder.length - 1}
                  class="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-700/50 transition-colors disabled:opacity-25 disabled:hover:text-zinc-500 disabled:hover:bg-transparent"
                >
                  <ChevronDown class="w-4 h-4" />
                </button>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Content tabs */}
      <div class="flex-1 flex flex-col min-h-0">
        <div class="px-5 pt-4 pb-2">
          <h3 class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Content</h3>
          <div class="flex gap-1 overflow-x-auto pb-1">
            <For each={CONTENT_TABS}>
              {(tab) => (
                <button
                  onClick={() => setActiveTab(tab.key)}
                  class={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                    activeTab() === tab.key
                      ? 'bg-zinc-700 text-white'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab.label}
                </button>
              )}
            </For>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto px-5 pb-5">
          {(() => {
            const data = tabData();
            return (
              <div class="animate-fade-in">
                <CvItemSelector
                  title={activeTab()}
                  items={data.items}
                  selectedIds={data.selected}
                  onToggle={(id) => props.onToggleItem(data.field, id)}
                  getLabel={data.getLabel}
                  getSubLabel={data.getSubLabel}
                  emptyIcon={data.emptyIcon}
                  emptyText={data.emptyText}
                />
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
