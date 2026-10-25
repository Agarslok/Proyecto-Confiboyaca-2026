interface ChoiceCardProps {
  type: "checkbox" | "radio";
  name: string;
  value: string;
  title: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path
        d="M2.5 6.5L5.2 9.2L10.5 3.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChoiceCard({
  type,
  name,
  value,
  title,
  description,
  checked,
  onChange,
}: ChoiceCardProps) {
  return (
    <label className={checked ? "opt on" : "opt"}>
      <input type={type} name={name} value={value} checked={checked} onChange={onChange} />
      <span className="opt-body">
        <span className="opt-mark" aria-hidden="true">
          <CheckIcon />
        </span>
        <span className="opt-text">
          <span className="opt-label">{title}</span>
          {description ? <span className="opt-hint">{description}</span> : null}
        </span>
      </span>
    </label>
  );
}
