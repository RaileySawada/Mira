import {
  dayKey,
  normalizeAnswer,
  percentage,
  prepareCards,
  shuffled,
  streak,
  weekActivity,
} from "../../src/utils/stats";
import { attempt, reviewer } from "../support/fixtures";

describe("study statistics", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 8, 14, 12));
  });
  test("formats local calendar dates, including strings", () => {
    expect(dayKey(new Date(2026, 0, 2))).toBe("2026-01-02");
    expect(dayKey(new Date(2026, 0, 2).toISOString())).toBe("2026-01-02");
  });
  test("weights accuracy by questions and handles an empty history", () => {
    expect(percentage([])).toBe(0);
    expect(
      percentage([
        attempt({ correct: 1, total: 1 }),
        attempt({ correct: 0, total: 9 }),
      ]),
    ).toBe(10);
    expect(percentage([attempt({ correct: 2, total: 3 })])).toBe(67);
  });
  test("counts consecutive days, ignores duplicate sessions, and allows yesterday", () => {
    const days = [14, 13, 12].map((day) =>
      attempt({ date: new Date(2026, 8, day).toISOString() }),
    );
    expect(streak([])).toBe(0);
    expect(streak([...days, days[0]])).toBe(3);
    expect(streak(days.slice(1))).toBe(2);
    expect(streak(days.slice(2))).toBe(0);
  });
  test("builds seven days of totals and excludes old sessions", () => {
    const week = weekActivity([
      attempt({ total: 5 }),
      attempt({ id: "other", total: 3 }),
      attempt({ date: new Date(2026, 7, 1).toISOString(), total: 100 }),
    ]);
    expect(week).toHaveLength(7);
    expect(week[6].total).toBe(8);
    expect(week.slice(0, 6).every((day) => day.total === 0)).toBe(true);
  });
  test("normalizes whitespace and case without changing answer wording", () => {
    expect(normalizeAnswer("  Cell   WALL\n ")).toBe("cell wall");
    expect(normalizeAnswer("DNA!")).toBe("dna");
  });
  test("shuffles without losing cards or mutating the input", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    const cards = reviewer().cards;
    expect(shuffled(cards)).toEqual([cards[1], cards[0]]);
    expect(cards[0].id).toBe("card-1");
    expect(shuffled([])).toEqual([]);
    expect(prepareCards(cards, false, 1)).toEqual([cards[0]]);
    expect(prepareCards(cards, true, 10)).toHaveLength(2);
  });
});
