import { createSignal } from 'solid-js';
import { FormField, Input } from '../shared/FormField';
import { SaveButton } from '../shared/SaveButton';
import { HighlightsList } from '../shared/HighlightsList';

interface ProjectFormProps {
  item: any | null;
  onSave: (data: any) => void;
}

export function ProjectForm(props: ProjectFormProps) {
  const [name, setName] = createSignal(props.item?.name || '');
  const [startDate, setStartDate] = createSignal(props.item?.start_date || '');
  const [endDate, setEndDate] = createSignal(props.item?.end_date || '');
  const [location, setLocation] = createSignal(props.item?.location || '');
  const [highlights, setHighlights] = createSignal<string[]>(props.item?.highlights || []);

  const save = () => {
    props.onSave({
      name: name(),
      start_date: startDate() || undefined,
      end_date: endDate() || undefined,
      location: location() || undefined,
      highlights: highlights().length > 0 ? highlights() : undefined,
    });
  };

  return (
    <div class="space-y-4">
      <FormField label="Project Name">
        <Input value={name()} onInput={(e) => setName(e.currentTarget.value)} placeholder="My Open Source Project" />
      </FormField>
      <div class="grid grid-cols-2 gap-4">
        <FormField label="Start Date">
          <Input value={startDate()} onInput={(e) => setStartDate(e.currentTarget.value)} placeholder="2023-01" />
        </FormField>
        <FormField label="End Date">
          <Input value={endDate()} onInput={(e) => setEndDate(e.currentTarget.value)} placeholder="present" />
        </FormField>
      </div>
      <FormField label="Location">
        <Input value={location()} onInput={(e) => setLocation(e.currentTarget.value)} placeholder="Remote" />
      </FormField>
      <FormField label="Highlights">
        <HighlightsList value={highlights()} onChange={setHighlights} />
      </FormField>
      <SaveButton onClick={save} label={props.item ? 'Update' : 'Add'} />
    </div>
  );
}
