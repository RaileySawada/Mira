import { ambientMood } from "../../src/features/ai/ambientMood";

test.each([
  [false, false, "Let’s explore cells.", false, "normal"],
  [true, false, "Well done!", false, "thinking"],
  [true, true, "", false, "sad"],
  [false, false, "Well done! Keep it up.", false, "happy"],
  [false, false, "Congratulations on your milestone.", false, "amazed"],
  [false, false, "Take your time, one step at a time.", false, "sad"],
  [false, false, "", true, "amazed"],
])("maps conversation signals to a visual tone (%s, %s, %s)", (busy, error, reply, reviewers, expected) => {
  expect(ambientMood(busy as boolean, error as boolean, reply as string, reviewers as boolean)).toBe(expected);
});
