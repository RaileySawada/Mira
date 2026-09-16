import { Icon } from "./Icon";

export type ViewMode = "grid" | "list";

export function ViewToggle({ value, onChange, label }: { value: ViewMode; onChange: (view: ViewMode) => void; label: string }) {
  return <div className="view-toggle" aria-label={label}>
    <button type="button" aria-label="Grid view" aria-pressed={value === "grid"} onClick={() => onChange("grid")}><Icon name="grid" size={16} /></button>
    <button type="button" aria-label="List view" aria-pressed={value === "list"} onClick={() => onChange("list")}><Icon name="list" size={17} /></button>
  </div>;
}
