import { createSignal } from 'solid-js';
import { FormField, Input } from '../shared/FormField';
import { SaveButton } from '../shared/SaveButton';
import { HighlightsList } from '../shared/HighlightsList';

interface EducationFormProps {
  item: any | null;
  onSave: (data: any) => void;
}

export function EducationForm(props: EducationFormProps) {
  const [institution, setInstitution] = createSignal(props.item?.institution || '');
  const [area, setArea] = createSignal(props.item?.area || '');
  const [degree, setDegree] = createSignal(props.item?.degree || '');
  const [startDate, setStartDate] = createSignal(props.item?.start_date || '');
  const [endDate, setEndDate] = createSignal(props.item?.end_date || '');
  const [location, setLocation] = createSignal(props.item?.location || '');
  const [highlights, setHighlights] = createSignal<string[]>(props.item?.highlights || []);

  const save = () => {
    props.onSave({
      institution: institution(),
      area: area() || undefined,
      degree: degree() || undefined,
      start_date: startDate() || undefined,
      end_date: endDate() || undefined,
      location: location() || undefined,
      highlights: highlights().length > 0 ? highlights() : undefined,
    });
  };

  return (
    <div class="space-y-4">
      <FormField label="Institution">
        <Input value={institution()} onInput={(e) => setInstitution(e.currentTarget.value)} placeholder="MIT" />
      </FormField>
      <div class="grid grid-cols-2 gap-4">
        <FormField label="Area / Field">
          <Input value={area()} onInput={(e) => setArea(e.currentTarget.value)} placeholder="Computer Science" />
        </FormField>
        <FormField label="Degree">
          <Input value={degree()} onInput={(e) => setDegree(e.currentTarget.value)} placeholder="BS" />
        </FormField>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <FormField label="Start Date">
          <Input value={startDate()} onInput={(e) => setStartDate(e.currentTarget.value)} placeholder="2020-09" />
        </FormField>
        <FormField label="End Date">
          <Input value={endDate()} onInput={(e) => setEndDate(e.currentTarget.value)} placeholder="2024-05 or present" />
        </FormField>
      </div>
      <FormField label="Location">
        <Input value={location()} onInput={(e) => setLocation(e.currentTarget.value)} placeholder="Cambridge, MA" />
      </FormField>
      <FormField label="Highlights">
        <HighlightsList value={highlights()} onChange={setHighlights} />
      </FormField>
      <SaveButton onClick={save} label={props.item ? 'Update' : 'Add'} />
    </div>
  );
}
