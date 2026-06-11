import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
} from "react";

export const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 " +
  "placeholder:text-slate-500 outline-none transition focus:border-violet-400/60 " +
  "focus:ring-2 focus:ring-violet-500/25";

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 py-2 " +
  "text-sm font-semibold text-white transition hover:bg-violet-400 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 " +
  "bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export const dangerButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-rose-500/90 px-4 py-2 " +
  "text-sm font-semibold text-white transition hover:bg-rose-400 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={`mb-1.5 block text-[13px] font-medium text-slate-300 ${props.className ?? ""}`}
    />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function FieldHint({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-xs text-slate-500">{children}</p>;
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
    >
      {message}
    </p>
  );
}
