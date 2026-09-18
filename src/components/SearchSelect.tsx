import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
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
  triggerIcon,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  triggerIcon?: ReactNode;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [position, setPosition] = useState<CSSProperties>({});
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
  useLayoutEffect(() => {
    if (!open || disabled) return;
    const dropdown = panel.current;
    // The top layer escapes transformed page wrappers and modal scroll containers.
    dropdown?.showPopover?.();
    function place(event?: Event) {
      if (event?.target instanceof Node && dropdown?.contains(event.target)) return;
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const viewport = window.visualViewport;
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportLeft = viewport?.offsetLeft ?? 0;
      const viewportWidth = viewport?.width ?? window.innerWidth;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const width = Math.min(Math.max(rect.width, 280), viewportWidth - 24);
      const below = viewportTop + viewportHeight - rect.bottom - 18;
      const above = rect.top - viewportTop - 18;
      const upwards = below < 220 && above > below;
      const height = Math.min(viewportHeight - 24, Math.max(80, Math.min(320, upwards ? above : below)));
      setPosition({
        width, maxHeight: height,
        left: Math.max(viewportLeft + 12, Math.min(rect.left, viewportLeft + viewportWidth - width - 12)),
        top: Math.max(viewportTop + 12, Math.min(upwards ? rect.top - height - 6 : rect.bottom + 6, viewportTop + viewportHeight - height - 12)),
      });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    window.visualViewport?.addEventListener("resize", place);
    window.visualViewport?.addEventListener("scroll", place);
    return () => {
      dropdown?.hidePopover?.();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      window.visualViewport?.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("scroll", place);
    };
  }, [open, disabled]);
  useEffect(() => {
    const option = document.getElementById(id + "-option-" + active);
    const menu = list.current;
    if (!open || !option || !menu) return;
    // Scroll only the options, never the entire page to the selected option.
    if (option.offsetTop < menu.scrollTop) menu.scrollTop = option.offsetTop;
    else if (option.offsetTop + option.offsetHeight > menu.scrollTop + menu.clientHeight)
      menu.scrollTop = option.offsetTop + option.offsetHeight - menu.clientHeight;
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
          if (open && event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); }
          if (open && event.key === "Enter") { event.preventDefault(); if (filtered[active]) choose(filtered[active]); }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (open) setActive(index => Math.max(0, Math.min(filtered.length - 1, index + (event.key === "ArrowDown" ? 1 : -1))));
            else show();
          }
        }}
      >
        {triggerIcon && <span className="select-trigger-icon">{triggerIcon}</span>}
        <span className="truncate">
          {options.find((option) => option.value === value)?.label ||
            "Select an option"}
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && !disabled && (
        <div ref={panel} popover="manual" className="select-panel" style={position}>
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-3 text-stone-400"
              aria-hidden="true"
            />
            <input
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
            ref={list}
            id={`${id}-list`}
            role="listbox"
            aria-label={label}
            className="select-options"
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
