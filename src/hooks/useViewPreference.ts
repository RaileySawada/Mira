import { useState } from "react";
import type { ViewMode } from "../types/ui";


type Collection = "reviewers" | "topics" | "quizzes";

export function useViewPreference(collection: Collection) {
  const key = "mira.layout." + collection;
  const [preference, setPreference] = useState<{
    view: ViewMode;
    error: string;
  }>(() => {
    try {
      return {
        view: localStorage.getItem(key) === "list" ? "list" : "grid",
        error: "",
      };
    } catch {
      return {
        view: "grid",
        error: "Your saved layout is unavailable in this browser.",
      };
    }
  });
  function setView(view: ViewMode) {
    try {
      localStorage.setItem(key, view);
      setPreference({ view, error: "" });
    } catch {
      setPreference({
        view,
        error:
          "Layout changed for this visit, but could not be saved in this browser.",
      });
    }
  }
  return { ...preference, setView };
}
