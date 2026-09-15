import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useScrollLock } from "../hooks/useScrollLock";
import { Icon } from "./Icon";
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm text-stone-500">{description}</p>
      </div>
      {action}
    </div>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 bg-surface/50 px-6 py-12 text-center">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 mb-5 max-w-sm text-sm leading-6 text-stone-500">
        {description}
      </p>
      {action}
    </div>
  );
}
export function Modal({
  title,
  children,
  footer,
  onClose,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}) {
  useScrollLock();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="mira-modal"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-page px-6 py-5">
        <h2 className="text-xl font-semibold">{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="modal-content p-6">{children}</div>
      {footer && (
        <div className="shrink-0 border-t border-line bg-page px-6 py-4">
          {footer}
        </div>
      )}
    </dialog>
  );
}
