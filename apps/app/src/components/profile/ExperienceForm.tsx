import { createSignal } from 'solid-js';
import { FormField, Input } from '../shared/FormField';
import { SaveButton } from '../shared/SaveButton';
import { HighlightsList } from '../shared/HighlightsList';

interface ExperienceFormProps {
  item: any | null;
  onSave: (data: any) => void;
}

export function ExperienceForm(props: ExperienceFormProps) {
  const [company, setCompany] = createSignal(props.item?.company || '');
  const [position, setPosition] = createSignal(props.item?.position || '');
  const [startDate, setStartDate] = createSignal(props.item?.start_date || '');
  const [endDate, setEndDate] = createSignal(props.item?.end_date || '');
  const [location, setLocation] = createSignal(props.item?.location || '');
  const [highlights, setHighlights] = createSignal<string[]>(props.item?.highlights || []);

  const save = () => {
    props.onSave({
      company: company(),
      position: position() || undefined,
      start_date: startDate() || undefined,
      end_date: endDate() || undefined,
      location: location() || undefined,
      highlights: highlights().length > 0 ? highlights() : undefined,
    });
  };

  return (
    <div class="space-y-4">
      <FormField label="Company">
        <Input value={company()} onInput={(e) => setCompany(e.currentTarget.value)} placeholder="Acme Inc" />
      </FormField>
      <FormField label="Position">
        <Input value={position()} onInput={(e) => setPosition(e.currentTarget.value)} placeholder="Software Engineer" />
      </FormField>
      <div class="grid grid-cols-2 gap-4">
        <FormField label="Start Date">
          <Input value={startDate()} onInput={(e) => setStartDate(e.currentTarget.value)} placeholder="2022-01" />
        </FormField>
        <FormField label="End Date">
          <Input value={endDate()} onInput={(e) => setEndDate(e.currentTarget.value)} placeholder="present" />
        </FormField>
      </div>
      <FormField label="Location">
        <Input value={location()} onInput={(e) => setLocation(e.currentTarget.value)} placeholder="San Francisco, CA" />
      </FormField>
      <FormField label="Highlights">
        <HighlightsList value={highlights()} onChange={setHighlights} />
      </FormField>
      <SaveButton onClick={save} label={props.item ? 'Update' : 'Add'} />
    </div>
  );
}
