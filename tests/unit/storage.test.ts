import { downloadJson, emptyData, readData, saveData, validateData } from "../../src/services/storage";
import { STORAGE_KEY } from "../../src/config/storage";

import { attempt, library } from "../support/fixtures";

describe("backup validation", () => {
  test("round trips all library data", () => {
    const data = { ...library(), attempts: [attempt()] };
    expect(validateData(JSON.parse(JSON.stringify(data)))).toEqual(data);
    expect(emptyData()).not.toBe(emptyData());
  });
  test.each([
    null,
    [],
    {},
    { version: 9 },
    { ...emptyData(), topics: null },
    { ...emptyData(), settings: null },
  ])("rejects malformed backup %j", (value) => {
    expect(() => validateData(value)).toThrow(/supported Mira backup/);
  });
  test.each([
    { id: "", name: "Biology", color: "#ffffff" },
    { id: "t", name: " ", color: "#ffffff" },
    { id: "t", name: "Biology", color: "red" },
    { id: "t", name: 5, color: "#ffffff" },
  ])("rejects malformed topics %j", (topic) =>
    expect(() => validateData({ ...emptyData(), topics: [topic] })).toThrow(),
  );
  test.each([
    { title: "" },
    { description: 9 },
    { updatedAt: "invalid" },
    { topicId: "missing" },
    { cards: [{ id: "c", question: " ", answer: "A" }] },
    { cards: [{ id: "c", question: "Q", answer: "" }] },
  ])("rejects malformed reviewer %j", (fields) => {
    const data = library();
    expect(() =>
      validateData({
        ...data,
        reviewers: [{ ...data.reviewers[0], ...fields }],
      }),
    ).toThrow();
  });
  test.each([
    { correct: 3, total: 2 },
    { total: 0 },
    { total: 1.5 },
    { date: "bad" },
    { mode: "cards" },
  ])("rejects invalid results %j", (fields) =>
    expect(() =>
      validateData({ ...emptyData(), attempts: [{ ...attempt(), ...fields }] }),
    ).toThrow(/quiz result/),
  );
  test.each([
    { name: 8 },
    { dailyGoal: 0 },
    { dailyGoal: 201 },
    { quizSize: 101 },
    { quizSize: 1.5 },
    { shuffle: "yes" },
    { autoDaily: null },
    { theme: "rainbow" },
  ])("rejects invalid settings %j", (fields) => {
    const data = emptyData();
    expect(() =>
      validateData({ ...data, settings: { ...data.settings, ...fields } }),
    ).toThrow(/settings/);
  });
  test("rejects duplicate IDs and preserves historical results for deleted reviewers", () => {
    const data = library();
    expect(() =>
      validateData({ ...data, topics: [...data.topics, ...data.topics] }),
    ).toThrow(/duplicate/);
    expect(() =>
      validateData({
        ...data,
        reviewers: [...data.reviewers, ...data.reviewers],
      }),
    ).toThrow(/duplicate/);
    expect(() =>
      validateData({ ...data, attempts: [attempt(), attempt()] }),
    ).toThrow(/duplicate/);
    expect(() =>
      validateData({
        ...data,
        reviewers: [
          {
            ...data.reviewers[0],
            cards: [data.reviewers[0].cards[0], data.reviewers[0].cards[0]],
          },
        ],
      }),
    ).toThrow(/duplicate/);
    expect(
      validateData({ ...emptyData(), attempts: [attempt()] }).attempts,
    ).toHaveLength(1);
  });
  test("migrates version 1 and missing theme without changing the source", () => {
    const current = library();
    const { theme: _theme, ...settings } = current.settings;
    const { topicId, ...reviewer } = current.reviewers[0];
    const old = {
      version: 1,
      subjects: current.topics,
      reviewers: [{ ...reviewer, subjectId: topicId }],
      attempts: [],
      settings,
    };
    const result = validateData(old);
    expect(result.version).toBe(2);
    expect(result.topics).toEqual(current.topics);
    expect(result.reviewers[0].topicId).toBe(topicId);
    expect(result.settings.theme).toBe("system");
    expect(old.version).toBe(1);
    expect(() => validateData({ ...old, reviewers: [null] })).toThrow();
  });
});
describe("local storage and downloads", () => {
  test("loads empty or saved data", () => {
    expect(readData()).toEqual({ data: emptyData(), error: "" });
    saveData(library());
    expect(readData().data).toEqual(library());
  });
  test("keeps unreadable data available for recovery", () => {
    localStorage.setItem(STORAGE_KEY, "broken");
    expect(readData().error).toMatch(/could not load/);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("broken");
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(readData().error).not.toBe("");
  });
  test("surfaces write failures", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("full");
    });
    expect(() => saveData(emptyData())).toThrow("full");
  });
  test("downloads JSON and raw recovery text, then releases URLs", () => {
    jest.useFakeTimers();
    const click = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    downloadJson(library());
    downloadJson("broken", "recovery.json");
    expect(click).toHaveBeenCalledTimes(2);
    expect((click.mock.contexts[1] as HTMLAnchorElement).download).toBe(
      "recovery.json",
    );
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
    jest.runAllTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
