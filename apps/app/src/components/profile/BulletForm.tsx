import { createSignal } from 'solid-js';
import { FormField, Input } from '../shared/FormField';
import { SaveButton } from '../shared/SaveButton';

interface BulletFormProps {
  item: any | null;
  onSave: (data: any) => void;
}

export function BulletForm(props: BulletFormProps) {
  const [sectionName, setSectionName] = createSignal(props.item?.section_name || '');
  const [bullet, setBullet] = createSignal(props.item?.bullet || '');

  const save = () => {
    props.onSave({
      section_name: sectionName(),
      bullet: bullet(),
    });
  };

  return (
    <div class="space-y-4">
      <FormField label="Section Name (e.g. Hackathons, Volunteering)">
        <Input value={sectionName()} onInput={(e) => setSectionName(e.currentTarget.value)} placeholder="Hackathons" />
      </FormField>
      <FormField label="Bullet Point">
        <Input value={bullet()} onInput={(e) => setBullet(e.currentTarget.value)} placeholder="Won first place at HackMIT 2023" />
      </FormField>
      <SaveButton onClick={save} label={props.item ? 'Update' : 'Add'} />
    </div>
  );
}
