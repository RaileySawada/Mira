import type { ButtonHTMLAttributes } from "react";
import { Check, LoaderCircle } from "lucide-react";
import type { ActionState } from "../hooks/useActionFeedback";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  state: ActionState;
  successLabel?: string;
};

export function ProcessButton({ label, state, successLabel = "Done", className = "button primary", disabled, children, ...props }: Props) {
  return <button {...props} className={className + " process-button"} data-state={state}
    aria-label={label} aria-busy={state === "loading"} disabled={disabled || state !== "idle"}>
    {state === "loading" && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
    {state === "success" && <Check size={16} aria-hidden="true" />}
    <span aria-live="polite">{state === "loading" ? "Working…" : state === "success" ? successLabel : children || label}</span>
  </button>;
}
