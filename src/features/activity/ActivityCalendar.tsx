import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Leaf, Flame, Zap } from "lucide-react";
import { Modal } from "../../components/ui";
import type { Attempt } from "../../types/study";
import { dayKey, percentage } from "../../utils/stats";

const levels = [
  { label: "No activity", icon: null },
  { label: "Slightly active", icon: Leaf },
  { label: "Active", icon: Flame },
  { label: "Super active", icon: Zap },
];
function activityLevel(count: number) { return count >= 5 ? 3 : count >= 2 ? 2 : count === 1 ? 1 : 0; }

export function ActivityCalendar({ attempts }: { attempts: Attempt[] }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState<Date | null>(null);
  const grouped = useMemo(() => {
    const days = new Map<string, Attempt[]>();
    for (const attempt of attempts) {
      const key = dayKey(attempt.date);
      const entries = days.get(key) ?? [];
      entries.push(attempt);
      days.set(key, entries);
    }
    return days;
  }, [attempts]);
  const days = Array.from({ length: 42 }, (_, index) => new Date(month.getFullYear(), month.getMonth(), 1 - month.getDay() + index));
  const today = dayKey(new Date());
  const entries = selected ? [...(grouped.get(dayKey(selected)) ?? [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) : [];
  const total = entries.reduce((sum, entry) => sum + entry.total, 0);
  return <>
    <section className="activity-calendar panel" aria-label="Study activity calendar">
      <header className="calendar-toolbar">
        <div><p className="eyebrow">YOUR STUDY DAYS</p><h2 aria-live="polite">{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2></div>
        <div className="calendar-controls">
          <button className="button secondary" onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>Today</button>
          <button className="row-icon-action" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={18} /></button>
          <button className="row-icon-action" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={18} /></button>
        </div>
      </header>
      <div className="calendar-weekdays" aria-hidden="true">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <span key={day}>{day}</span>)}</div>
      <div className="calendar-days">{days.map(date => {
        const key = dayKey(date);
        const count = grouped.get(key)?.length ?? 0;
        const level = activityLevel(count);
        const Indicator = levels[level].icon;
        return <button key={key} className="calendar-day" data-outside={date.getMonth() !== month.getMonth()} data-level={level} aria-current={key === today ? "date" : undefined} aria-label={date.toLocaleDateString(undefined, { dateStyle: "full" }) + ": " + count + " completed, " + levels[level].label} onClick={() => setSelected(date)}>
          <span className="calendar-date">{date.getDate()}</span>
          {Indicator && <span className="calendar-indicator"><Indicator size={17} aria-hidden="true" /><span>{count}<span className="calendar-completed"> completed</span></span></span>}
        </button>;
      })}</div>
      <div className="calendar-legend">{levels.slice(1).map((level, index) => { const Indicator = level.icon!; return <span key={level.label} data-level={index + 1}><Indicator size={15} aria-hidden="true" />{level.label} · {index === 0 ? "1" : index === 1 ? "2–4" : "5+"}</span>; })}</div>
      <p className="calendar-note">Completed quizzes and daily reviews, grouped by your device’s local date. Select any day for its summary.</p>
    </section>
    {selected && <Modal title={selected.toLocaleDateString(undefined, { dateStyle: "full" })} onClose={() => setSelected(null)}>
      <p className="text-sm text-stone-500">{levels[activityLevel(entries.length)].label}</p>
      {entries.length ? <>
        <div className="day-summary-stats"><div><strong>{entries.length}</strong><span>Completed</span></div><div><strong>{total}</strong><span>Questions</span></div><div><strong>{percentage(entries)}%</strong><span>Accuracy</span></div></div>
        <ul className="day-summary-list">{entries.map(entry => <li key={entry.id}><div><h3>{entry.title}</h3><p>{entry.mode === "daily" ? "Daily review" : "Quiz"} · {new Date(entry.date).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</p></div><strong>{entry.correct}/{entry.total}</strong></li>)}</ul>
      </> : <p className="mt-5 text-sm">No completed quizzes or daily reviews were saved on this day. Flashcard self-ratings are temporary and are not included.</p>}
    </Modal>}
  </>;
}
