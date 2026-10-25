import type { ChangeEvent } from "react";

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  multiline?: boolean;
  large?: boolean;
}

export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  placeholder,
  multiline,
  large = true,
}: TextFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const inputClass = large && !multiline ? "text-in" : "text-in sm";
  const shared = {
    id,
    value,
    placeholder,
    className: inputClass,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.target.value),
  };

  return (
    <div className="field">
      <label className="q-help" htmlFor={id}>{label}</label>
      {hint ? (
        <p id={hintId} className="fine">
          {hint}
        </p>
      ) : null}
      {multiline ? <textarea {...shared} rows={3} /> : <input {...shared} type="text" autoComplete="organization" name="organization" />}
      <p id={errorId} className="err" role="alert">{error ?? ""}</p>
    </div>
  );
}
