import { messageVariant } from "./messageVariants";
import type { StudyData } from "../../types/study";
import { achievements } from "../achievements/achievements";
import { dayKey } from "../../utils/stats";
export const messages = {
  normal: ["A little curiosity is all we need to begin.", "Your next chapter starts with one card.", "Make yourself at home. We’ll learn at your pace.", "Something new to learn? Let’s give it a place.", "Your ideas belong here. Let’s build on them.", "One small study set can be a lovely start.", "Ready whenever you are. There’s no rush.", "Let’s make a little room for discovery.", "Bring your notes. I’ll keep you company.", "Start small. Your library can grow with you."],
  happy: ["You showed up for yourself today. I’m cheering you on!", "A little practice, a little more confidence.", "Look at you making time to learn!", "Today already has a little progress in it.", "One question at a time. You’re doing it.", "Your effort today deserves a little celebration.", "You made space for learning. That counts.", "Those finished questions are steps forward.", "I love seeing your study story grow.", "Keep this gentle momentum, or enjoy a well-earned pause."],
  amazed: ["A perfect round! Give yourself a little credit.", "Every answer right that time. Nicely done!", "That last quiz? You knew your stuff.", "Perfect recall on your latest quiz. Look at you!", "You got the whole set right. That’s worth a smile.", "A clean sweep! Your practice is showing.", "All correct this round. Let that sink in.", "Your latest result gave me a little wow moment.", "You just nailed that quiz. Take a proud little pause.", "Every question landed. Shall we try another challenge?"],
  thinking: ["There’s something here worth another look.", "Let’s slow down and connect the tricky parts.", "A missed answer can point us to the next step.", "We can try those definitions one at a time.", "Understanding takes a few passes sometimes.", "Let’s give the harder cards a little extra attention.", "Try explaining the answer in your own words while studying.", "A little review now can make the next round clearer.", "What felt tricky? That’s a good place to begin.", "We’re gathering clues about what to practice next."],
  sad: ["A tough round doesn’t define you. We can try gently.", "Some days feel harder. One card is enough to restart.", "It’s okay if those answers didn’t come easily.", "Let’s take the pressure off and review together.", "You don’t have to get it all right to make progress.", "A pause, a breath, then one small step.", "That quiz was practice, not a verdict.", "Be kind to yourself. These ideas may need more time.", "We can revisit the confusing bits without rushing.", "You’re allowed to find this hard. I’m here for the next try."],
} as const;
export interface MiraMessage { mood: keyof typeof messages; text: string; }
export function homeMessages(data: StudyData, now = new Date(), variant = 0): MiraMessage[] {
  const hour = now.getHours();
  const salutation = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const name = data.settings.name.trim();
  const sequence: MiraMessage[] = [{ mood: "happy", text: messageVariant("greeting", variant, { greeting: salutation + (name ? ", " + name : "") }) }];
  const cards = data.reviewers.reduce((sum, reviewer) => sum + reviewer.cards.length, 0);
  if (!data.reviewers.length) {
    sequence.push({ mood: "normal", text: messageVariant("empty", variant) });
  } else {
    sequence.push({ mood: "normal", text: messageVariant("library", variant, { library: data.reviewers.length + " reviewer" + (data.reviewers.length === 1 ? "" : "s") + " and " + cards + " flashcard" + (cards === 1 ? "" : "s") }) });
    const current = data.reviewers.find(reviewer => reviewer.id === data.lastStudy?.reviewerId);
    const folder = data.folders?.find(item => item.id === current?.folderId);
    if (current) sequence.push({ mood: "thinking", text: messageVariant("resume", variant, { reviewer: "“" + current.title + "”" + (folder ? " in “" + folder.name + "”" : "") }) });
    else sequence.push({ mood: "thinking", text: messageVariant("organize", variant, { organization: data.topics.length + " topic" + (data.topics.length === 1 ? "" : "s") + " and " + (data.folders?.length ?? 0) + " folder" + (data.folders?.length === 1 ? "" : "s") }) });
  }
  const today = dayKey(now);
  const practice = (data.milestones?.studyDates ?? []).filter(date => dayKey(date) === today).length;
  const quizzes = data.attempts.filter(attempt => dayKey(attempt.date) === today);
  if (practice || quizzes.length) sequence.push({ mood: "happy", text: messageVariant("activity", variant, { sessions: (practice + quizzes.length) + " study session" + (practice + quizzes.length === 1 ? "" : "s") }) });
  const earned = achievements(data).filter(badge => badge.earned).length;
  if (earned) sequence.push({ mood: "amazed", text: messageVariant("badges", variant, { badges: earned + " badge" + (earned === 1 ? "" : "s") }) });
  sequence.push({ mood: "normal", text: messageVariant("closing", variant) });
  return sequence;
}
