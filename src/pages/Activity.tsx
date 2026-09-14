import type { StudyData } from "../types/study";
import { EmptyState, PageHeading } from "../components/ui";
export function Activity({ data }: { data: StudyData }) {
  return (
    <>
      <PageHeading
        eyebrow="LOOK HOW FAR YOU’VE COME"
        title="Your learning story."
        description="Every completed quiz, every small win. All in one place."
      />
      {data.attempts.length ? (
        <div className="panel overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs text-stone-500">
              <tr>
                <th className="p-5">Reviewer</th>
                <th className="p-5">Type</th>
                <th className="p-5">Date</th>
                <th className="p-5">Result</th>
              </tr>
            </thead>
            <tbody>
              {[...data.attempts]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((a) => (
                  <tr
                    className="border-b border-stone-100 last:border-0"
                    key={a.id}
                  >
                    <td className="p-5 font-medium">{a.title}</td>
                    <td className="p-5 text-stone-500">
                      {a.mode === "daily" ? "Daily review" : "Quiz"}
                    </td>
                    <td className="whitespace-nowrap p-5 text-stone-500">
                      {new Date(a.date).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="whitespace-nowrap p-5">
                      <span className="badge">
                        {Math.round((a.correct / a.total) * 100)}%
                      </span>
                      <span className="ml-2 text-xs text-stone-400">
                        {a.correct}/{a.total}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="Your story is just beginning"
          description="Finish a quiz or daily review and your results will appear here. There’s no rush — just a next step."
        />
      )}
    </>
  );
}
