import { confirmAction as confirm } from "../src/components/confirmAction";
import { waitFor, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Home } from "../src/pages/Home";
import { Reviewers } from "../src/pages/Reviewers";
import { Topics } from "../src/pages/Topics";
import { Quizzes } from "../src/pages/Quizzes";
import { Activity } from "../src/pages/Activity";
import { Documentation } from "../src/pages/Documentation";
import { emptyData } from "../src/services/storage";
import { attempt, library, reviewer } from "./fixtures";

test("Home shows empty states and creation actions without fabricated stats", async () => {
  const create = jest.fn(),
    navigate = jest.fn();
  render(
    <Home
      data={emptyData()}
      navigate={navigate}
      onCreate={create}
      onStudy={jest.fn()}
      onDaily={jest.fn()}
    />,
  );
  expect(
    screen.getByRole("button", { name: "Start daily review" }),
  ).toBeDisabled();
  await userEvent.click(
    screen.getByRole("button", { name: "Create a reviewer" }),
  );
  await userEvent.click(screen.getByRole("button", { name: "New reviewer" }));
  await userEvent.click(screen.getByRole("button", { name: "View all" }));
  expect(create).toHaveBeenCalledTimes(2);
  expect(navigate).toHaveBeenCalledWith("Reviewers");
});
test("Home uses recorded results and supports daily and flashcard practice", async () => {
  const data = library();
  data.settings.name = "Mira";
  data.settings.dailyGoal = 1;
  data.attempts = [attempt({ mode: "daily", correct: 2, total: 2 })];
  const daily = jest.fn(),
    study = jest.fn();
  render(
    <Home
      data={data}
      navigate={jest.fn()}
      onCreate={jest.fn()}
      onStudy={study}
      onDaily={daily}
    />,
  );
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Mira");
  expect(screen.getByText(/You reached your goal/)).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "Practice again" }));
  await userEvent.click(screen.getByRole("button", { name: /Cell biology/ }));
  expect(daily).toHaveBeenCalled();
  expect(study).toHaveBeenCalledWith(data.reviewers[0]);
});
test("Home supports manual reviews and uncategorized cards", async () => {
  const data = library();
  data.settings.autoDaily = false;
  data.reviewers = [
    reviewer({ topicId: "", cards: [reviewer().cards[0]] }),
    reviewer({ id: "r2", updatedAt: "2026-09-15T10:00:00Z" }),
  ];
  const navigate = jest.fn();
  render(
    <Home
      data={data}
      navigate={navigate}
      onCreate={jest.fn()}
      onStudy={jest.fn()}
      onDaily={jest.fn()}
    />,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Explore reviewers" }),
  );
  expect(navigate).toHaveBeenCalledWith("Reviewers");
  expect(screen.getByText(/Uncategorized/)).toBeVisible();
});
test("reviewer cards search and expose edit, delete, practice, and quiz actions", async () => {
  const user = userEvent.setup(),
    create = jest.fn(),
    edit = jest.fn(),
    remove = jest.fn(),
    study = jest.fn(),
    quiz = jest.fn();
  render(
    <Reviewers
      data={library()}
      onCreate={create}
      onEdit={edit}
      onDelete={remove}
      onStudy={study}
      onQuiz={quiz}
    />,
  );
  for (const name of [
    "New reviewer",
    "Edit",
    "Delete",
    "Study cards",
    "Take quiz",
  ])
    await user.click(screen.getByRole("button", { name }));
  for (const action of [create, edit, remove, study, quiz])
    expect(action).toHaveBeenCalled();
  await user.type(screen.getByLabelText("Search reviewers"), "unmatched");
  expect(screen.getByText("No matches just yet")).toBeVisible();
  await user.clear(screen.getByLabelText("Search reviewers"));
  await user.click(screen.getByRole("button", { name: "Filter by topic" }));
  await user.click(screen.getByRole("option", { name: "Uncategorized" }));
  expect(screen.getByText("No matches just yet")).toBeVisible();
});
test("empty reviewer and quiz pages explain how to start", () => {
  render(
    <>
      <Reviewers
        data={emptyData()}
        onCreate={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onStudy={jest.fn()}
        onQuiz={jest.fn()}
      />
      <Quizzes data={emptyData()} onQuiz={jest.fn()} onDaily={jest.fn()} />
    </>,
  );
  expect(
    screen.getByText("Every expert starts with a first card"),
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Begin daily review" }),
  ).toBeDisabled();
});
test("quizzes offer individual and daily practice and mark daily completion", async () => {
  const data = library(),
    daily = jest.fn(),
    quiz = jest.fn();
  data.settings.autoDaily = false;
  data.attempts = [attempt({ mode: "daily" })];
  render(<Quizzes data={data} onQuiz={quiz} onDaily={daily} />);
  await userEvent.click(screen.getByRole("button", { name: "Practice again" }));
  await userEvent.click(screen.getByRole("button", { name: /Start quiz/ }));
  expect(daily).toHaveBeenCalled();
  expect(quiz).toHaveBeenCalledWith(data.reviewers[0]);
});
test("topics create, update, and delete without removing reviewer cards", async () => {
  const user = userEvent.setup(),
    update = jest.fn(() => true);
  const { rerender } = render(<Topics data={emptyData()} update={update} />);
  expect(screen.getByText("So much to be curious about")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "New topic" }));
  fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);
  expect(update).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText("Topic name"), "Math");
  fireEvent.change(screen.getByLabelText("Topic color"), {
    target: { value: "#123456" },
  });
  await user.click(screen.getByRole("button", { name: "Save topic" }));
  expect(update).toHaveBeenLastCalledWith(
    expect.objectContaining({
      topics: [expect.objectContaining({ name: "Math", color: "#123456" })],
    }),
  );
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  rerender(<Topics data={library()} update={update} />);
  await user.click(screen.getByRole("button", { name: "Edit topic" }));
  await user.clear(screen.getByLabelText("Topic name"));
  await user.type(screen.getByLabelText("Topic name"), "Cells");
  await user.click(screen.getByRole("button", { name: "Save topic" }));
  expect(update).toHaveBeenLastCalledWith(
    expect.objectContaining({
      topics: [expect.objectContaining({ id: "topic-1", name: "Cells" })],
    }),
  );
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  jest.mocked(confirm).mockResolvedValueOnce(false);
  update.mockClear();
  await user.click(screen.getByRole("button", { name: "Delete" }));
  expect(update).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Delete" }));
  expect(update).toHaveBeenLastCalledWith(
    expect.objectContaining({
      reviewers: [
        expect.objectContaining({
          topicId: "",
          cards: expect.arrayContaining([
            expect.objectContaining({ id: "card-1" }),
          ]),
        }),
      ],
    }),
  );
});
test("failed topic saves keep the editor open and it can be closed", async () => {
  render(<Topics data={library()} update={jest.fn(() => false)} />);
  await userEvent.click(screen.getByRole("button", { name: "Edit topic" }));
  await userEvent.click(screen.getByRole("button", { name: "Save topic" }));
  expect(screen.getByRole("dialog")).toBeVisible();
  await userEvent.click(screen.getByLabelText("Close dialog"));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
test("activity renders empty and populated histories", () => {
  const { rerender } = render(<Activity data={emptyData()} />);
  expect(screen.getByText("Your story is just beginning")).toBeVisible();
  const data = library();
  data.attempts = [
    attempt(),
    attempt({ id: "a2", mode: "daily", date: "2026-01-01T10:00:00Z" }),
  ];
  rerender(<Activity data={data} />);
  expect(screen.getAllByRole("row")).toHaveLength(3);
  expect(screen.getByText("Daily review")).toBeVisible();
});
test.each([
  "Guide",
  "Terms",
  "Privacy",
  "About",
  "Contribute",
  "Not found",
] as const)("documentation page %s renders useful content", (page) => {
  render(<Documentation page={page} />);
  expect(screen.getByRole("heading", { level: 1 })).toBeVisible();
  if (page === "Contribute")
    expect(
      screen.getByRole("link", { name: "View repository" }),
    ).toHaveAttribute("href", "https://github.com/RaileySawada/Mira");
  if (page === "About")
    expect(
      screen.getByText("Developed with love for Mira, by Railey"),
    ).toBeVisible();
  if (page === "Not found")
    expect(screen.getByRole("link", { name: /Back home/ })).toHaveAttribute(
      "href",
      "/",
    );
});
