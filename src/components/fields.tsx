import type { ReactNode } from "react";
import type { Fact, FactType } from "../model/types.ts";

export function TextInput({
  value,
  onChange,
  placeholder,
  mono = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={`w-full rounded border border-line bg-paper px-2 py-1.5 text-sm text-ink outline-none focus:border-gold ${mono ? "font-mono" : ""}`}
    />
  );
}

export function Area({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      rows={2}
      onChange={(event) => onChange(event.target.value)}
      className="w-full resize-y rounded border border-line bg-paper px-2 py-1.5 text-sm text-ink outline-none focus:border-gold"
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted">{children}</span>;
}

export function IconButton({
  children,
  onClick,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="rounded border border-line px-2 py-1 text-xs text-muted hover:border-gold hover:text-ink"
    >
      {children}
    </button>
  );
}

export function FactValueInput({
  fact,
  value,
  onChange,
}: {
  fact: Fact | undefined;
  value: string;
  onChange: (value: string) => void;
}) {
  const type: FactType = fact?.type ?? "string";
  if (type === "boolean") {
    return (
      <select
        value={value === "true" ? "true" : "false"}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded border border-line bg-paper px-2 py-1.5 text-sm text-ink"
      >
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }
  return (
    <TextInput
      value={value}
      onChange={onChange}
      placeholder={type === "number" ? "0" : "value"}
    />
  );
}
