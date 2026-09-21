import { fireEvent, render, screen } from "@testing-library/react";
import { LearningPath } from "../../src/features/home/LearningPath";
import { learningAnalytics } from "../../src/features/learning/analytics";
import { emptyData } from "../../src/services/storage";
import { library } from "../support/fixtures";

test("an empty learning path explains how to start without offering an empty quiz", () => {
  const start = jest.fn();
  render(<LearningPath insights={learningAnalytics(emptyData())} onStart={start} />);
  expect(screen.getByRole("button", { name: /Let’s practice/ })).toBeDisabled();
  expect(screen.getByText("Add your first reviewer to build your path.")).toBeVisible();
  expect(screen.getByRole("progressbar")).toHaveAttribute("value", "0");
});

test("a saved library offers daily practice and uses real mastery totals", () => {
  const start = jest.fn();
  render(<LearningPath insights={learningAnalytics(library())} onStart={start} />);
  fireEvent.click(screen.getByRole("button", { name: /Let’s practice/ }));
  expect(start).toHaveBeenCalledTimes(1);
  expect(screen.getByText("0 of 2 cards mastered")).toBeVisible();
});
