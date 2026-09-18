import { useCallback, useEffect, useRef, useState } from "react";
import { useScrollLock } from "../hooks/useScrollLock";
import type { Page } from "../types/study";
import { RouteLink } from "./RouteLink";
import { Icon } from "./Icon";
const pages: Page[] = [
  "Home",
  "Reviewers",
  "Topics",
  "Folders",
  "Quizzes",
  "Activity",
  "Settings",
  "Docs",
];

function Brand({ onNavigate, showName = true }: { onNavigate?: () => void; showName?: boolean }) {
  return (
    <RouteLink
      page="Home"
      onClick={onNavigate}
      className="flex items-center gap-3"
      aria-label="Mira home"
    >
      <img
        src="/brand/mark.png"
        alt=""
        width={44}
        height={44}
        className="brand-image"
      />
      {showName && <span className="brand-name" aria-hidden="true">mira</span>}
    </RouteLink>
  );
}
function NavigationLinks({
  page,
  onNavigate,
}: {
  page: Page;
  onNavigate?: () => void;
}) {
  return (
    <>
      <p className="eyebrow mb-4 px-4 text-[9px]">YOUR LEARNING SPACE</p>
      <nav className="flex flex-col gap-1.5" aria-label="Main navigation">
        {pages.map((item) => (
          <RouteLink
            key={item}
            page={item}
            onClick={onNavigate}
            aria-current={page === item ? "page" : undefined}
            className={`nav-item ${page === item ? "active" : ""}`}
          >
            <Icon name={item} size={19} />
            <span>{item}</span>
            {page === item && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#8d80b5]" />
            )}
          </RouteLink>
        ))}
      </nav>
    </>
  );
}
export function Sidebar({ page }: { page: Page }) {
  return (
    <aside className="sidebar">
      <div className="mb-6 px-3">
        <Brand />
      </div>
      <NavigationLinks page={page} />
      <div className="mt-auto pt-8">
        <div className="rounded-xl border border-line bg-soft p-4">
          <p className="text-xs font-medium">Made for your kind of mind.</p>
          <p className="mt-2 text-[11px] leading-5 text-stone-500">
            A quiet space to learn,
            <br />
            grow, and surprise yourself.
          </p>
        </div>
        <p className="mt-6 px-3 text-[10px] text-stone-400">
          Local-first. Always yours.
        </p>
      </div>
    </aside>
  );
}
export function MobileHeader({ page }: { page: Page }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const opened = useRef(false);
  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    if (!open && opened.current && trigger.current?.offsetParent)
      trigger.current.focus();
  }, [open]);
  return (
    <>
      <header className="mobile-header lg:hidden">
        <div className="flex items-center gap-3">
        <button
          type="button"
          className="menu-button"
          ref={trigger}
          aria-label="Open navigation menu"
          aria-expanded={open}
          aria-controls="mobile-sidebar"
          onClick={() => {
            opened.current = true;
            setOpen(true);
          }}
        >
          <Icon name="menu" size={20} />
        </button>
          <Brand showName={false} />
          <span className="text-xs text-stone-400">{page}</span>
        </div>
      </header>
      {open && <MobileDrawer page={page} onClose={close} />}
    </>
  );
}
function MobileDrawer({ page, onClose }: { page: Page; onClose: () => void }) {
  useScrollLock();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const desktop = matchMedia("(min-width: 1024px)");
    const resized = () => {
      if (desktop.matches) onClose();
    };
    desktop.addEventListener("change", resized);
    window.addEventListener("popstate", onClose);
    return () => {
      dialog?.close();
      desktop.removeEventListener("change", resized);
      window.removeEventListener("popstate", onClose);
    };
  }, [onClose]);
  return (
    <dialog
      ref={ref}
      id="mobile-sidebar"
      className="mobile-drawer"
      aria-label="Navigation menu"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
    >
      <div className="mb-9 flex items-center justify-between gap-3">
        <Brand onNavigate={onClose} />
        <button
          type="button"
          className="icon-button"
          aria-label="Close navigation menu"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <NavigationLinks page={page} onNavigate={onClose} />
      <div className="mt-auto pt-8">
        <div className="rounded-xl border border-line bg-soft p-5">
          <p className="text-sm font-medium">A little space just for you.</p>
          <p className="mt-2 text-xs leading-6 text-stone-500">
            Keep learning. Keep growing.
            <br />
            You’re doing better than you think.
          </p>
        </div>
        <nav
          aria-label="Menu documentation"
          className="mt-5 flex flex-wrap gap-4 px-1 text-[11px] text-stone-500"
        >
          {(["Guide", "Contribute", "Privacy", "Terms", "About"] as const).map(
            (item) => (
              <RouteLink key={item} page={item} onClick={onClose}>
                {item}
              </RouteLink>
            ),
          )}
        </nav>
      </div>
    </dialog>
  );
}
