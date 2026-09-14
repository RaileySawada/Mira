import { render, screen } from "@testing-library/react";
import StudyCharts from "../src/components/StudyCharts";
import { ChartContainer, ChartLegendContent, ChartStyle, ChartTooltipContent } from "../src/components/ui/chart";
import { cn } from "../src/lib/utils";
import { attempt } from "./fixtures";

test("shadcn charts show real totals, accessible labels and empty state", () => {
  const { container, rerender } = render(<StudyCharts attempts={[]} />);
  expect(screen.getByLabelText("No completed quizzes yet")).toBeInTheDocument();
  expect(screen.getByText("0 correct · 0 to revisit")).toBeVisible();
  expect(container.querySelectorAll('[data-slot="chart"]')).toHaveLength(2);
  rerender(<StudyCharts attempts={[attempt()]} />);
  expect(screen.getByLabelText("50% correct answers")).toBeInTheDocument();
  expect(screen.getByText("1 correct · 1 to revisit")).toBeVisible();
  expect(container.querySelectorAll("svg.recharts-surface")).toHaveLength(2);
  expect(cn("p-2", false, "p-4")).toBe("p-4");
});

const config = { total: { label: "Questions", color: "#8d80b5" }, other: { label: "Other", theme: { light: "red", dark: "blue" } } };
const payload = [{ graphicalItemId: "chart", dataKey: "total", name: "total", value: 3, color: "red", payload: { fill: "red" } }];
function wrapper(children: React.ReactNode) {
  return <ChartContainer id="test" config={config}><div>{children}</div></ChartContainer>;
}

test("chart styles support both themes and label-only configurations", () => {
  const { container, rerender } = render(<ChartStyle id="colors" config={config} />);
  expect(container.textContent).toContain(":root[data-theme=dark]");
  expect(container.textContent).toContain("--color-other: blue");
  rerender(<ChartStyle id="empty" config={{ label: { label: "No color" } }} />);
  expect(container).toBeEmptyDOMElement();
  rerender(<ChartStyle id="partial" config={{ value: { theme: { light: "red", dark: "" } } }} />);
  expect(container.textContent).toContain("--color-value: red");
});

test("tooltips support labels, formatted values and indicators", () => {
  const { rerender, container } = render(wrapper(<ChartTooltipContent active payload={payload} label="total" />));
  expect(screen.getAllByText("Questions")).toHaveLength(2);
  expect(screen.getByText("3")).toBeVisible();
  rerender(wrapper(<ChartTooltipContent active payload={payload} label="Monday" indicator="line" />));
  expect(screen.getByText("Monday")).toBeVisible();
  rerender(wrapper(<ChartTooltipContent active payload={payload} labelKey="total" indicator="dashed" labelFormatter={label => "Day: " + label} />));
  expect(screen.getByText("Day: Questions")).toBeVisible();
  rerender(wrapper(<ChartTooltipContent active payload={payload} hideLabel hideIndicator formatter={value => "Answered " + value} />));
  expect(screen.getByText("Answered 3")).toBeVisible();
  rerender(wrapper(<ChartTooltipContent active payload={[{ graphicalItemId: "chart", name: "unknown", value: "answer" }]} nameKey="unknown" />));
  expect(screen.getByText("answer")).toBeVisible();
  rerender(wrapper(<ChartTooltipContent active payload={[{ graphicalItemId: "chart", type: "none", value: 0 }, { graphicalItemId: "chart", value: undefined }]} />));
  expect(container.querySelector('[data-slot="chart"]')).toBeInTheDocument();
  rerender(wrapper(<ChartTooltipContent active={false} payload={payload} />));
  expect(screen.queryByText("3")).not.toBeInTheDocument();
  rerender(wrapper(<ChartTooltipContent active payload={[]} />));
  rerender(wrapper(<ChartTooltipContent active={false} payload={[null] as unknown as React.ComponentProps<typeof ChartTooltipContent>["payload"]} />));
});

test("legend and tooltip resolve nested names and custom icons", () => {
  const Badge = () => <span>Custom indicator</span>;
  const customConfig = { ...config, total: { ...config.total, icon: Badge } };
  const { rerender } = render(<ChartContainer config={customConfig}><div>
    <ChartTooltipContent active payload={payload} color="pink" />
    <ChartLegendContent payload={[{ value: "total", dataKey: "total", color: "red" }]} />
  </div></ChartContainer>);
  expect(screen.getAllByText("Custom indicator")).toHaveLength(2);
  rerender(wrapper(<ChartLegendContent payload={[{ value: "total", dataKey: "total", color: "red" }, { value: "hidden", type: "none" }]} hideIcon verticalAlign="top" />));
  expect(screen.getByText("Questions")).toBeVisible();
  rerender(wrapper(<ChartLegendContent payload={[]} />));
  expect(screen.queryByText("Questions")).not.toBeInTheDocument();
  rerender(wrapper(<ChartLegendContent payload={[{ value: "nested", payload: { kind: "other" } }]} nameKey="kind" />));
  expect(screen.getByText("Other")).toBeVisible();
  rerender(wrapper(<ChartTooltipContent active payload={[{ graphicalItemId: "chart", name: "other", dataKey: "kind", value: 1, payload: { kind: "other" } }]} />));
  expect(screen.getAllByText("Other").length).toBeGreaterThan(0);
  rerender(wrapper(<ChartLegendContent payload={[{ value: "unknown" }]} />));
});

test("chart content requires a chart container", () => {
  const error = jest.spyOn(console, "error").mockImplementation(() => {});
  expect(() => render(<ChartTooltipContent active payload={payload} />)).toThrow("ChartContainer");
  error.mockRestore();
});
