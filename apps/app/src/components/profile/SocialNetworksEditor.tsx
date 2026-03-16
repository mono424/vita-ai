import { For, createSignal } from "solid-js";
import { schema } from "../../schema.gen";
import { useDb, useQuery } from "@spooky-sync/client-solid";
import { useAuth } from "../../auth";
import { Modal } from "../shared/Modal";
import { FormField, Input } from "../shared/FormField";
import { SaveButton } from "../shared/SaveButton";

export function SocialNetworksEditor() {
  const db = useDb<typeof schema>();
  const auth = useAuth();
  const [modalOpen, setModalOpen] = createSignal(false);
  const [editingId, setEditingId] = createSignal<string | null>(null);
  const [network, setNetwork] = createSignal("");
  const [networkUsername, setNetworkUsername] = createSignal("");

  const query = useQuery(
    () =>
      db
        .query("social_network")
        .where({ owner: auth.userId()?.toString() })
        .build(),
    { enabled: () => auth.userId() !== null },
  );

  const items = () => (query.data() as any[]) || [];

  const openNew = () => {
    setEditingId(null);
    setNetwork("");
    setNetworkUsername("");
    setModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setNetwork(item.network);
    setNetworkUsername(item.network_username);
    setModalOpen(true);
  };

  const save = async () => {
    const id = editingId();
    if (id) {
      await db.update(
        "social_network" as any,
        id as any,
        { network: network(), network_username: networkUsername() } as any,
      );
    } else {
      const newId = `social_network:${crypto.randomUUID().replace(/-/g, "")}`;
      await db.create(
        newId as any,
        {
          owner: auth.userId()?.toString(),
          network: network(),
          network_username: networkUsername(),
        } as any,
      );
    }
    setModalOpen(false);
  };

  const remove = async (id: string) => {
    await db.delete("social_network" as any, id as any);
  };

  return (
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-medium text-white">Social Networks</h3>
        <button
          onClick={openNew}
          class="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          + Add
        </button>
      </div>
      <div class="space-y-2">
        <For
          each={items()}
          fallback={
            <p class="text-sm text-zinc-500">No social networks added yet.</p>
          }
        >
          {(item) => (
            <div class="flex items-center justify-between bg-zinc-800/50 border border-white/[0.04] rounded-lg px-4 py-3">
              <div>
                <span class="text-white text-sm font-medium">
                  {item.network}
                </span>
                <span class="text-zinc-400 text-sm ml-2">
                  {item.network_username}
                </span>
              </div>
              <div class="flex gap-2">
                <button
                  onClick={() => openEdit(item)}
                  class="text-zinc-500 hover:text-white text-sm transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(item.id)}
                  class="text-zinc-500 hover:text-red-400 text-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </For>
      </div>
      <Modal
        open={modalOpen()}
        onClose={() => setModalOpen(false)}
        title={editingId() ? "Edit Social Network" : "Add Social Network"}
      >
        <div class="space-y-4">
          <FormField label="Network (e.g. LinkedIn, GitHub)">
            <Input
              value={network()}
              onInput={(e) => setNetwork(e.currentTarget.value)}
              placeholder="LinkedIn"
            />
          </FormField>
          <FormField label="Username">
            <Input
              value={networkUsername()}
              onInput={(e) => setNetworkUsername(e.currentTarget.value)}
              placeholder="johndoe"
            />
          </FormField>
          <SaveButton onClick={save} label={editingId() ? "Update" : "Add"} />
        </div>
      </Modal>
    </div>
  );
}
