import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
export interface SelectOption {
  value: string;
  label: string;
}
export function SearchSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
  className = "",
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const filtered = options.filter((option) =>
    option.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  function choose(option: SelectOption) {
    onChange(option.value);
    close();
  }
  function show() {
    setQuery("");
    setActive(
      Math.max(
        0,
        options.findIndex((option) => option.value === value),
      ),
    );
    setOpen(true);
  }
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  useEffect(() => {
    if (open)
      document
        .getElementById(`${id}-option-${active}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [active, open, id]);
  return (
    <div
      ref={root}
      className={`search-select ${className}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="select-trigger"
        disabled={disabled}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open && !disabled}
        aria-controls={`${id}-list`}
        onClick={() => (open ? close() : show())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            show();
          }
        }}
      >
        <span className="truncate">
          {options.find((option) => option.value === value)?.label ||
            "Select an option"}
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && !disabled && (
        <div className="select-panel">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-3 text-stone-400"
              aria-hidden="true"
            />
            <input
              autoFocus
              className="input w-full !pl-9"
              role="combobox"
              aria-label={`Search ${label.toLowerCase()}`}
              aria-expanded="true"
              aria-autocomplete="list"
              aria-controls={`${id}-list`}
              aria-activedescendant={
                filtered[active] ? `${id}-option-${active}` : undefined
              }
              placeholder="Search…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  event.stopPropagation();
                  close();
                }
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  setActive((index) =>
                    Math.max(
                      0,
                      Math.min(
                        filtered.length - 1,
                        index + (event.key === "ArrowDown" ? 1 : -1),
                      ),
                    ),
                  );
                }
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (filtered[active]) choose(filtered[active]);
                }
              }}
            />
          </div>
          <ul
            id={`${id}-list`}
            role="listbox"
            aria-label={label}
            className="mt-2 max-h-44 overflow-y-auto overscroll-contain"
          >
            {filtered.map((option, index) => (
              <li
                key={option.value}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={value === option.value}
                className={`select-option ${active === index ? "is-active" : ""}`}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
              >
                <span className="min-w-0 flex-1 break-words">
                  {option.label}
                </span>
                {option.value === value && (
                  <Check size={14} aria-hidden="true" />
                )}
              </li>
            ))}
          </ul>
          {!filtered.length && (
            <p role="status" className="px-3 py-4 text-xs text-stone-500">
              No matches. Try another search.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
