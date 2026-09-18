import { fireEvent, render, screen, within } from "@testing-library/react";
import { ActivityCalendar } from "../src/features/activity/ActivityCalendar";
import { attempt } from "./fixtures";

test("calendar groups local days and shows weighted day summaries", () => {
  const today = new Date();
  today.setHours(12,0,0,0);
  const label = today.toLocaleDateString(undefined, { dateStyle: "full" });
  render(<ActivityCalendar attempts={[attempt({id:'one',date:today.toISOString(),correct:1,total:2}),attempt({id:'two',date:today.toISOString(),correct:2,total:8,mode:'daily'})]} />);
  fireEvent.click(screen.getByRole("button", { name: label + ": 2 completed, Active" }));
  const modal = within(screen.getByRole("dialog", { name: label }));
  expect(modal.getByText("30%")).toBeVisible();
  expect(modal.getByText("10")).toBeVisible();
  expect(modal.getByText("1/2")).toBeVisible();
  expect(modal.getByText("2/8")).toBeVisible();
  fireEvent.click(modal.getByLabelText("Close dialog"));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("calendar navigates month/year boundaries and opens empty days", () => {
  render(<ActivityCalendar attempts={[]} />);
  const month = new Date().getMonth();
  for (let index=0; index <= month; index++) fireEvent.click(screen.getByLabelText("Previous month"));
  const december = new Date(new Date().getFullYear()-1,11,1);
  expect(screen.getByRole("heading",{name:december.toLocaleDateString(undefined,{month:'long',year:'numeric'})})).toBeVisible();
  fireEvent.click(screen.getByLabelText("Next month"));
  const january = new Date(new Date().getFullYear(),0,1);
  fireEvent.click(screen.getByRole("button",{name:january.toLocaleDateString(undefined,{dateStyle:'full'})+': 0 completed, No activity'}));
  expect(screen.getByRole("dialog")).toHaveTextContent("No completed quizzes");
});

test("activity icons distinguish one completion from five", () => {
  const date = new Date().toISOString();
  const view = render(<ActivityCalendar attempts={[attempt({date})]} />);
  expect(screen.getByRole('button',{name:/1 completed, Slightly active/})).toBeVisible();
  view.rerender(<ActivityCalendar attempts={Array.from({length:5},(_,i)=>attempt({id:String(i),date}))} />);
  expect(screen.getByRole('button',{name:/5 completed, Super active/})).toBeVisible();
});
