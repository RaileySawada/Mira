export const adaptiveDocs = [
  {
    title: "Achievements: progress, consistency and recovery",
    text: "Twenty rewards celebrate learning behavior, never intelligence. Filter Milestones or Challenges, or view All. The original ten badges remain. Getting the Hang of It and Memory Keeper reward one and 25 currently Mastered cards; Topic Tamer requires every card in a topic of at least ten to be Mastered. Comeback Kid needs a recorded Needs review state followed by Mastered. No Card Left Behind requires a nonempty starting due queue and correct reviews of every card in it during one completed session. On Schedule counts five different local-calendar days with a saved correct due review, including individual flashcard ratings. Rising Scholar compares completed quizzes for the same reviewer for a 20-percentage-point improvement. Second Chance counts five distinct reviewer/card pairs answered incorrectly then correctly in later quizzes. Voice Learner requires completing and saving a Hard quiz with a voice transcript for every answer; editing is allowed. Offline Scholar requires rating every flashcard or completing a quiz/daily review while offline at completion. Skipped cards, empty queues and abandoned sessions do not grant completion rewards. New evidence is saved locally and included in JSON backups. Older records cannot retroactively prove voice/offline sessions or unseen mastery transitions. Unlocked rewards remain earned; celebrations group new rewards once. Future hidden badges display ??? without artwork, mission or progress until earned.",
  },
  {
    title: "Adaptive learning and mastery",
    text: "Mira derives New, Learning, Needs review and Mastered states from saved card ratings and quiz results. Three consecutive correct reviews can mark a card Mastered until it becomes due. A missed or due card needs review. Home shows due cards, cards to revisit, recently improved cards and topic/folder/reviewer insights. Self-ratings contribute to learning signals, never quiz accuracy. Mira’s five expressions respond supportively to recent scores, changes, goals, streaks, inactivity, weak cards and new achievements; they are not judgments of ability.",
  },
  {
    title: "Spaced repetition and daily review",
    text: "Mira v3 uses a deterministic lightweight scheduler, not FSRS. Correct reviews schedule a card in 1 day, then 3 days, then double the interval up to 180 days. A missed answer resets repetitions and schedules a retry in 10 minutes. Daily review prioritizes overdue cards, cards needing review, frequent misses, long-unreviewed cards and new cards. Recently reviewed cards move behind new material; mastered cards fill remaining slots only when needed. The selected set can be shuffled, and its size remains configurable. All scheduling works offline.",
  },
  {
    title: "Question history, answer alternatives and streaks",
    text: "Completed quizzes retain each question and expected-answer snapshot, your answer, correctness and response duration alongside the existing totals. Open Activity calendar day details to inspect them. Reviewer editing offers optional accepted alternative answers. Written grading normalizes Unicode, case, whitespace and harmless punctuation; meaningful math symbols remain distinct. Streaks count local-calendar days with a completed quiz, daily review or flashcard practice session. Opening a reviewer alone never counts. The same rule is used by Home, badges, Activity and Mira’s overview.",
  },
  {
    title: "Unfinished quizzes and Voice Study Mode",
    text: "Unfinished quizzes save snapshots, ordering, mode, submitted answers and draft text locally. On return, choose Continue unfinished quiz or Discard; Mira never resumes automatically. Drafts are removed after successful completion or explicit discard. In Hard mode, Start voice study reads the question when speech synthesis is available. Pause, Stop and Repeat control playback; Speak answer uses the existing microphone service. Stop the microphone, edit the transcript and explicitly check the answer. Unsupported browsers and offline recognition fall back to typing; core study never requires speech services.",
  },
  {
    title: "v3 storage, migration and backups",
    text: "Growing study data is stored in a version-3 IndexedDB database with separate stores for reviewers, cards, attempts, question results, schedules and quiz drafts. Small preferences may remain in localStorage. Existing v1/v2 libraries migrate automatically and are read back for verification. The original localStorage backup is retained for recovery and is not the live library after migration. JSON exports remain portable and v1/v2 imports remain supported. Unknown fields are discarded and invalid data is rejected before saving. Keep regular exported backups: clearing browser/site data removes local study records.",
  },
  {
    title: "Local document imports and optional AI context",
    text: "Import notes accepts TXT, Markdown and CSV locally. CSV supports question/answer columns, quoted commas and multiline fields. Preview, edit and remove text before opening the reviewer editor. Text selections for one card are limited to 5,000 characters; CSV supports up to 1,000 rows and files up to 1 MB. PDF extraction is not included; export a PDF as text first. Generate with Mira requires an explicit consent checkbox and only pre-fills the selected text; submit separately to send up to 3,000 characters to Pollinations. Use current reviewer as context is OFF by default. When enabled for chat, only up to 30 cards from the current reviewer are shared, with a 12,000-character content budget. Omitted cards are disclosed. Reviewer text is untrusted data, never system instructions.",
  },
  {
    title: "Anonymous AI verification",
    text: "Online AI requests may require Cloudflare Turnstile verification. The server verifies single-use tokens, hostname and action before contacting Pollinations; rate limits, payload limits, timeouts and origin checks remain in place. Origin checks are not authentication. No account is required and Mira does not persist verification tokens or add a tracking identifier. Cloudflare processes verification information under its own policies. Failed verification affects AI only; saved reviewers, quizzes and offline studying remain available.",
  },
];
