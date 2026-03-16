import { createSignal, createEffect, Show } from "solid-js";
import { schema } from "../../schema.gen";
import {
  useDb,
  useQuery,
  type GetTable,
  type TableModel,
} from "@spooky-sync/client-solid";
import { useAuth } from "../../auth";
import { FormField, Input } from "../shared/FormField";
import { SaveButton } from "../shared/SaveButton";

type User = TableModel<GetTable<typeof schema, "user">>;

export function PersonalInfoForm() {
  const db = useDb<typeof schema>();
  const auth = useAuth();

  const [name, setName] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [phone, setPhone] = createSignal("");
  const [location, setLocation] = createSignal("");
  const [website, setWebsite] = createSignal("");
  const [saving, setSaving] = createSignal(false);
  const [dirty, setDirty] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Track the last-saved values to detect changes
  const [saved, setSaved] = createSignal({
    name: "",
    email: "",
    phone: "",
    location: "",
    website: "",
  });

  createEffect(() => {
    const u = auth.user();
    if (u) {
      const vals = {
        name: (u as any).name || "",
        email: (u as any).email || "",
        phone: (u as any).phone || "",
        location: (u as any).location || "",
        website: (u as any).website || "",
      };
      setName(vals.name);
      setEmail(vals.email);
      setPhone(vals.phone);
      setLocation(vals.location);
      setWebsite(vals.website);
      setSaved(vals);
      setDirty(false);
    }
  });

  const markDirty = () => {
    const s = saved();
    const changed =
      name() !== s.name ||
      email() !== s.email ||
      phone() !== s.phone ||
      location() !== s.location ||
      website() !== s.website;
    setDirty(changed);
  };

  const save = async () => {
    const uid = auth.userId()?.toString();
    if (!uid) {
      console.warn("[PersonalInfoForm] No userId, cannot save");
      setError("Not signed in. Please sign in first.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      console.log("[PersonalInfoForm] Saving user data for", uid);
      await db.update("user", uid, {
        name: name(),
        email: email(),
        phone: phone(),
        location: location(),
        website: website(),
      });
      console.log("[PersonalInfoForm] Save successful");
      setSaved({
        name: name(),
        email: email(),
        phone: phone(),
        location: location(),
        website: website(),
      });
      setDirty(false);
    } catch (err) {
      console.error("[PersonalInfoForm] Save failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save. Check console for details.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class="space-y-4">
      <h3 class="text-base font-medium text-white">Personal Information</h3>
      <div class="grid grid-cols-2 gap-4">
        <FormField label="Full Name">
          <Input
            value={name()}
            onInput={(e) => {
              setName(e.currentTarget.value);
              markDirty();
            }}
            placeholder="John Doe"
          />
        </FormField>
        <FormField label="Email">
          <Input
            type="email"
            value={email()}
            onInput={(e) => {
              setEmail(e.currentTarget.value);
              markDirty();
            }}
            placeholder="john@example.com"
          />
        </FormField>
        <FormField label="Phone">
          <Input
            value={phone()}
            onInput={(e) => {
              setPhone(e.currentTarget.value);
              markDirty();
            }}
            placeholder="+1 234 567 890"
          />
        </FormField>
        <FormField label="Location">
          <Input
            value={location()}
            onInput={(e) => {
              setLocation(e.currentTarget.value);
              markDirty();
            }}
            placeholder="City, Country"
          />
        </FormField>
        <div class="col-span-2">
          <FormField label="Website">
            <Input
              value={website()}
              onInput={(e) => {
                setWebsite(e.currentTarget.value);
                markDirty();
              }}
              placeholder="https://example.com"
            />
          </FormField>
        </div>
      </div>
      <Show when={error()}>
        <p class="text-sm text-red-400">{error()}</p>
      </Show>
      <Show
        when={dirty()}
        fallback={<span class="text-sm text-zinc-500 py-2 inline-block">Saved</span>}
      >
        <SaveButton onClick={save} saving={saving()} />
      </Show>
    </div>
  );
}
