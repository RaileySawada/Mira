import { fireEvent, render, screen } from "@testing-library/react";
import { LearningInsights } from "../../src/features/home/LearningInsights";
import { learningAnalytics } from "../../src/features/learning/analytics";
import { recordRating } from "../../src/features/learning/scheduler";
import { library } from "../support/fixtures";

test("insights switch categories and open a reviewer needing practice", () => {
  const data = recordRating(library(), "reviewer-1", "card-1", false, "flashcard");
  const study = jest.fn();
  render(<LearningInsights insights={learningAnalytics(data)} onStudy={study} />);
  expect(screen.getByRole("button", { name: "Topics" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "Reviewers" }));
  expect(screen.getByRole("progressbar", { name: "Cell biology mastery" })).toHaveAttribute("value", "0");
  fireEvent.click(screen.getByRole("button", { name: /Practice this reviewer/ }));
  expect(study).toHaveBeenCalledWith(data.reviewers[0]);
});

test("large groups start with five rows and can be expanded", () => {
  const data = library();
  data.topics = Array.from({ length: 8 }, (_, i) => ({ id: String(i), name: `Topic ${i}`, color: "#123456" }));
  data.reviewers = data.topics.map(topic => ({ ...data.reviewers[0], id: topic.id, topicId: topic.id }));
  render(<LearningInsights insights={learningAnalytics(data)} onStudy={jest.fn()} />);
  expect(screen.getAllByRole("progressbar")).toHaveLength(5);
  fireEvent.click(screen.getByRole("button", { name: "Show all 8" }));
  expect(screen.getAllByRole("progressbar")).toHaveLength(8);
  fireEvent.click(screen.getByRole("button", { name: "Folders" }));
  expect(screen.getAllByRole("progressbar")).toHaveLength(1);
});
