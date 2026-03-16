import { For, Show, createSignal, JSX } from 'solid-js';
import { schema } from '../../schema.gen';
import { useDb, useQuery } from '@spooky-sync/client-solid';
import { useAuth } from '../../auth';
import { Modal } from '../shared/Modal';


interface SectionEditorProps<T> {
  title: string;
  table: string;
  renderItem: (item: T) => JSX.Element;
  renderForm: (item: T | null, onSave: (data: any) => void) => JSX.Element;
  getLabel: (item: T) => string;
}

export function SectionEditor<T extends { id: string }>(props: SectionEditorProps<T>) {
  const db = useDb<typeof schema>();
  const auth = useAuth();
  const [modalOpen, setModalOpen] = createSignal(false);
  const [editing, setEditing] = createSignal<T | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  const query = useQuery(
    () => db.query(props.table as any).where({ owner: auth.userId()! }).build(),
    { enabled: () => auth.userId() !== null }
  );

  const items = () => (query.data() as T[]) || [];

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (item: T) => {
    setEditing(() => item);
    setModalOpen(true);
  };

  const handleSave = async (data: any) => {
    const uid = auth.userId();
    if (!uid) {
      console.warn(`[SectionEditor:${props.table}] No userId, cannot save`);
      setError('Not signed in. Please sign in first.');
      return;
    }
    setError(null);
    try {
      const current = editing();
      if (current) {
        console.log(`[SectionEditor:${props.table}] Updating`, current.id, data);
        await db.update(props.table as any, current.id as any, data);
      } else {
        const id = `${props.table}:${crypto.randomUUID().replace(/-/g, '')}`;
        console.log(`[SectionEditor:${props.table}] Creating`, id, data);
        await db.create(id as any, { owner: uid, ...data } as any);
      }
      console.log(`[SectionEditor:${props.table}] Save successful`);
      setModalOpen(false);
    } catch (err) {
      console.error(`[SectionEditor:${props.table}] Save failed:`, err);
      setError(err instanceof Error ? err.message : 'Failed to save. Check console for details.');
    }
  };

  const remove = async (id: string) => {
    await db.delete(props.table as any, id as any);
  };

  return (
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-medium text-white">{props.title}</h3>
        <button onClick={openNew} class="text-sm text-zinc-400 hover:text-white transition-colors">+ Add</button>
      </div>
      <div class="space-y-2">
        <For each={items()} fallback={<p class="text-sm text-zinc-500">No items added yet.</p>}>
          {(item) => (
            <div class="bg-zinc-800/50 border border-white/[0.04] rounded-lg px-4 py-3">
              <div class="flex items-start justify-between">
                <div class="flex-1">{props.renderItem(item)}</div>
                <div class="flex gap-2 shrink-0 ml-4">
                  <button onClick={() => openEdit(item)} class="text-zinc-500 hover:text-white text-sm transition-colors">Edit</button>
                  <button onClick={() => remove(item.id)} class="text-zinc-500 hover:text-red-400 text-sm transition-colors">Delete</button>
                </div>
              </div>
            </div>
          )}
        </For>
      </div>
      <Modal open={modalOpen()} onClose={() => setModalOpen(false)} title={editing() ? `Edit ${props.title.replace(/s$/, '')}` : `Add ${props.title.replace(/s$/, '')}`}>
        <Show when={error()}>
          <p class="text-sm text-red-400 mb-3">{error()}</p>
        </Show>
        {props.renderForm(editing(), handleSave)}
      </Modal>
    </div>
  );
}
