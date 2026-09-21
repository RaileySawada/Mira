import { fireEvent, render, screen, within } from "@testing-library/react";
import { Activity } from "../../src/pages/Activity";
import { Reviewers } from "../../src/pages/Reviewers";
import { Topics } from "../../src/pages/Topics";
import { Quizzes } from "../../src/pages/Quizzes";
import { library, attempt, reviewer } from "../support/fixtures";

test("activity table searches, sorts, and paginates every result", () => {
  const data = library();
  data.attempts = Array.from({ length: 10 }, (_, index) =>
    attempt({
      id: "attempt-" + index,
      title: index === 9 ? "Algebra" : "Biology " + index,
      correct: index,
      total: 10,
      date: "2026-01-" + String(index + 1).padStart(2, "0") + "T10:00:00Z",
      mode: index % 2 ? "daily" : "quiz",
    }),
  );
  render(<Activity data={data} />);
  expect(screen.getByText("Page 1 of 2")).toBeVisible();
  expect(screen.getAllByRole("row")).toHaveLength(9);
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  expect(screen.getByText("Page 2 of 2")).toBeVisible();
  expect(screen.getAllByRole("row")).toHaveLength(3);
  fireEvent.change(screen.getByLabelText("Search activity"), {
    target: { value: "Algebra" },
  });
  expect(screen.getByText("1 result")).toBeVisible();
  expect(screen.getByText("Algebra")).toBeVisible();
  fireEvent.change(screen.getByLabelText("Search activity"), {
    target: { value: "" },
  });
  fireEvent.click(screen.getByRole("button", { name: /Reviewer/ }));
  expect(
    screen.getByRole("columnheader", { name: /Reviewer/ }),
  ).toHaveAttribute("aria-sort", "ascending");
  const rows = screen.getAllByRole("row");
  expect(within(rows[1]).getByText("Algebra")).toBeVisible();
});

test("reviewers and topics can switch between grid and list layouts", () => {
  const data = library();
  data.reviewers.push(reviewer({ id: "reviewer-2", title: "Ecology" }));
  const { rerender } = render(
    <Reviewers
      data={data}
      onCreate={jest.fn()}
      onEdit={jest.fn()}
      onDelete={jest.fn()}
      onStudy={jest.fn()}
      onQuiz={jest.fn()}
    />,
  );
  expect(document.querySelector(".reviewer-grid")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "List view" }));
  expect(document.querySelector(".reviewer-list")).toBeTruthy();
  rerender(<Topics data={data} update={jest.fn(() => true)} />);
  expect(document.querySelector(".topic-grid")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "List view" }));
  expect(document.querySelector(".topic-list")).toBeTruthy();
});

test("quizzes offer matching grid and list layouts", () => {
  const data = library();
  render(<Quizzes data={data} onQuiz={jest.fn()} onDaily={jest.fn()} />);
  expect(document.querySelector(".quiz-grid")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "List view" }));
  expect(document.querySelector(".quiz-list")).toBeTruthy();
});

test("activity dates sort by instant rather than timezone text", () => {
  const data = library();
  data.attempts = [
    attempt({
      id: "earlier",
      title: "Earlier",
      date: "2026-01-02T01:00:00+08:00",
    }),
    attempt({ id: "later", title: "Later", date: "2026-01-01T23:00:00Z" }),
  ];
  render(<Activity data={data} />);
  expect(
    within(screen.getAllByRole("row")[1]).getByText("Later"),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: /Date/ }));
  expect(
    within(screen.getAllByRole("row")[1]).getByText("Earlier"),
  ).toBeVisible();
});
