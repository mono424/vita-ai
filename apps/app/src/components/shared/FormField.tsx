import { JSX } from 'solid-js';

interface FormFieldProps {
  label: string;
  children: JSX.Element;
}

export function FormField(props: FormFieldProps) {
  return (
    <div>
      <label class="block text-sm text-zinc-400 mb-1.5">{props.label}</label>
      {props.children}
    </div>
  );
}

export function Input(props: JSX.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      class="w-full bg-zinc-900 border border-white/[0.06] rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
    />
  );
}

export function TextArea(props: JSX.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      class="w-full bg-zinc-900 border border-white/[0.06] rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors resize-none"
      rows={3}
    />
  );
}
