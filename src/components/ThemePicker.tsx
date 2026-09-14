import type { Theme } from "../types/study";
import { Icon } from "./Icon";
const options: { value: Theme; title: string; description: string }[] = [
  { value: "light", title: "Light", description: "A fresh start" },
  { value: "dark", title: "Dark", description: "A softer evening" },
  { value: "system", title: "System", description: "Follow your device" },
];
export function ThemePicker({
  value,
  onChange,
}: {
  value: Theme;
  onChange: (theme: Theme, origin: HTMLElement) => void;
}) {
  return (
    <div
      className="grid grid-cols-3 gap-3"
      role="group"
      aria-label="Color theme"
    >
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          aria-pressed={value === option.value}
          className={`theme-option ${value === option.value ? "selected" : ""}`}
          onClick={(event) => onChange(option.value, event.currentTarget)}
        >
          <div
            className={`theme-preview preview-${option.value}`}
            aria-hidden="true"
          >
            <div className="preview-sidebar" />
            <div className="preview-content">
              <span />
              <div>
                <i />
                <i />
              </div>
              <span />
            </div>
          </div>
          <span className="mt-3 flex items-center justify-between gap-1 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <Icon name={option.value} size={15} />
              {option.title}
            </span>
            {value === option.value && <Icon name="check" size={14} />}
          </span>
          <span className="mt-1 hidden text-left text-[10px] text-stone-500 sm:block">
            {option.description}
          </span>
        </button>
      ))}
    </div>
  );
}
