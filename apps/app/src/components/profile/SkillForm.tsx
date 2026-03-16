import { createSignal } from 'solid-js';
import { FormField, Input } from '../shared/FormField';
import { SaveButton } from '../shared/SaveButton';

interface SkillFormProps {
  item: any | null;
  onSave: (data: any) => void;
}

export function SkillForm(props: SkillFormProps) {
  const [label, setLabel] = createSignal(props.item?.label || '');
  const [details, setDetails] = createSignal(props.item?.details || '');

  const save = () => {
    props.onSave({
      label: label(),
      details: details() || undefined,
    });
  };

  return (
    <div class="space-y-4">
      <FormField label="Label (e.g. Languages, Frameworks)">
        <Input value={label()} onInput={(e) => setLabel(e.currentTarget.value)} placeholder="Programming Languages" />
      </FormField>
      <FormField label="Details">
        <Input value={details()} onInput={(e) => setDetails(e.currentTarget.value)} placeholder="Python, TypeScript, Go" />
      </FormField>
      <SaveButton onClick={save} label={props.item ? 'Update' : 'Add'} />
    </div>
  );
}
