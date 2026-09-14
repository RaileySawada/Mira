import { useEffect, useRef, useState } from "react";

export type ActionState = "idle" | "loading" | "success";

export function useActionFeedback() {
  const [state, setState] = useState<ActionState>("idle");
  const [error, setError] = useState("");
  const locked = useRef(false);
  const mounted = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; clearTimeout(timer.current); };
  }, []);

  async function run(action: () => boolean | void | null | Promise<boolean | void | null>, afterSuccess?: () => void) {
    if (locked.current) return;
    locked.current = true;
    setState("loading");
    setError("");
    try {
      const result = await action();
      if (!mounted.current) return;
      if (result === null) { locked.current = false; setState("idle"); return; }
      if (result === false) {
        locked.current = false;
        setState("idle");
        setError("The action could not be completed. Please try again.");
        return;
      }
      setState("success");
      timer.current = setTimeout(() => {
        locked.current = false;
        setState("idle");
        afterSuccess?.();
      }, 600);
    } catch (failure) {
      if (!mounted.current) return;
      locked.current = false;
      setState("idle");
      setError(failure instanceof Error ? failure.message : "The action could not be completed. Please try again.");
    }
  }
  function reset() { clearTimeout(timer.current); locked.current = false; setState("idle"); setError(""); }
  return { state, error, run, reset };
}
