import { Bar, BarChart, Pie, PieChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "./ui/chart";
import type { Attempt } from "../types/study";
import { percentage, weekActivity } from "../utils/stats";

const config = {
  total: { label: "Questions", color: "#8d80b5" },
  correct: { label: "Correct answers", color: "#8d80b5" },
  remaining: { label: "Room to grow", color: "var(--chart-track)" },
} satisfies ChartConfig;

export default function StudyCharts({ attempts }: { attempts: Attempt[] }) {
  const week = weekActivity(attempts);
  const accuracy = percentage(attempts);
  const correct = attempts.reduce((sum, attempt) => sum + attempt.correct, 0);
  const total = attempts.reduce((sum, attempt) => sum + attempt.total, 0);
  const results = total
    ? [
        { name: "correct", value: correct, fill: "var(--color-correct)" },
        {
          name: "remaining",
          value: total - correct,
          fill: "var(--color-remaining)",
        },
      ]
    : [{ name: "remaining", value: 1, fill: "var(--color-remaining)" }];
  return (
    <div className="study-charts">
      <section className="study-chart">
        <h2 className="section-title">Your learning rhythm</h2>
        <p className="mt-1 text-xs text-stone-500">
          Questions answered over the last 7 days
        </p>
        <ChartContainer
          config={config}
          className="mt-5 h-48 w-full aspect-auto"
          aria-label={week
            .map((day) => day.label + ": " + day.total + " questions")
            .join(", ")}
        >
          <BarChart
            accessibilityLayer
            data={week}
            margin={{ left: -24, right: 8 }}
          >
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar
              dataKey="total"
              fill="var(--color-total)"
              radius={[5, 5, 0, 0]}
              maxBarSize={36}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartContainer>
      </section>
      <section className="study-chart">
        <h2 className="section-title">Your recall, over time</h2>
        <p className="mt-1 text-xs text-stone-500">
          Your all-time quiz performance
        </p>
        <div className="relative mx-auto mt-3 w-48">
          <ChartContainer
            config={config}
            className="h-44 w-48 aspect-auto"
            aria-label={
              total
                ? accuracy + "% correct answers"
                : "No completed quizzes yet"
            }
          >
            <PieChart accessibilityLayer>
              {total > 0 && (
                <ChartTooltip
                  content={<ChartTooltipContent hideLabel nameKey="name" />}
                />
              )}
              <Pie
                data={results}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={76}
                strokeWidth={0}
                isAnimationActive={false}
              />
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <strong className="text-3xl font-semibold">
              {total ? accuracy + "%" : "—"}
            </strong>
            <span className="text-xs text-stone-500">accuracy</span>
          </div>
        </div>
        <p className="text-center text-xs text-stone-500">
          {correct} correct · {total - correct} to revisit
        </p>
        <p className="mt-2 text-center text-[11px] text-stone-400">
          A guide to your progress, not a measure of your potential.
        </p>
      </section>
    </div>
  );
}
