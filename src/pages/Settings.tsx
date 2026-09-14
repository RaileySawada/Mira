import { ProcessButton } from "../components/ProcessButton";
import { useActionFeedback } from "../hooks/useActionFeedback";
import { useRef, useState } from "react";
import type { StudyData, Theme } from "../types/study";
import { downloadJson, emptyData, validateData } from "../services/storage";
import { PageHeading } from "../components/ui";
import { Icon } from "../components/Icon";
import { ThemePicker } from "../components/ThemePicker";
import { RouteLink } from "../components/RouteLink";

export function Settings({
  data,
  update,
  onThemeChange,
}: {
  data: StudyData;
  update: (d: StudyData) => boolean;
  onThemeChange: (theme: Theme, origin: HTMLElement) => void;
}) {
  const save = useActionFeedback();
  const exporting = useActionFeedback();
  const importing = useActionFeedback();
  const clearing = useActionFeedback();
  const [settings, setSettings] = useState(data.settings);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  async function importFile(file?: File) {
    if (!file) return;
    setMessage("");
    setError("");
    await importing.run(async () => {
      try {
        if (file.size > 5 * 1024 * 1024) throw new Error("Please choose a backup smaller than 5 MB.");
        const imported = validateData(JSON.parse(await file.text()));
        if (!confirm(`Replace this device’s data with ${imported.reviewers.length} reviewers, ${imported.topics.length} topics and ${imported.attempts.length} results? Export your current data first if you want to keep it.`)) return null;
        if (!update(imported)) return false;
        setSettings(imported.settings);
        setMessage("Your backup has been imported. Welcome back.");
        return true;
      } finally {
        if (input.current) input.current.value = "";
      }
    });
  }
  const actionError = error || save.error || exporting.error || importing.error || clearing.error;

  return (
    <>
      <PageHeading
        eyebrow="THE LITTLE THINGS, YOUR WAY"
        title="Your space. Your pace."
        description="A few thoughtful touches to make studying feel more like you."
      />
      <div className="settings-banner mb-7 flex items-center justify-between gap-5 rounded-2xl p-6 sm:px-8">
        <div>
          <span className="eyebrow">DESIGNED AROUND YOU</span>
          <h2 className="mt-2 text-xl font-medium">Make yourself at home.</h2>
          <p className="mt-2 text-sm text-stone-500">
            Set the mood, find your rhythm, and keep your learning safe.
          </p>
        </div>
      </div>
      {message && (
        <p
          role="status"
          className="mb-5 rounded-xl bg-green-50 p-4 text-sm text-green-800"
        >
          {message}
        </p>
      )}
      {actionError && (
        <p
          role="alert"
          className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-800"
        >
          {actionError}
        </p>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          <section className="panel p-6 sm:p-7">
            <SectionTitle
              title="Set the mood"
              description="The same cozy space, in your favorite light."
            />
            <ThemePicker value={data.settings.theme} onChange={onThemeChange} />
            <p className="mt-4 flex items-center gap-2 text-[11px] text-stone-400">
              <Icon name="check" size={13} />
              Appearance saves automatically. System follows your device.
            </p>
          </section>
          <form
            className="panel space-y-5 p-6 sm:p-7"
            onSubmit={(event) => {
              event.preventDefault();
              void save.run(() => { if (
                update({
                  ...data,
                  settings: { ...settings, theme: data.settings.theme },
                })
              ) {
                setError("");
                setMessage("Your preferences are saved.");
                return true;
              } return false; });
            }}
          >
            <SectionTitle
              title="Find your rhythm"
              description="Small, sustainable steps look different for everyone."
            />
            <label className="field">
              What should we call you?
              <input
                maxLength={40}
                placeholder="Your first name"
                value={settings.name}
                onChange={(e) =>
                  setSettings({ ...settings, name: e.target.value })
                }
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field">
                Daily question goal
                <input
                  required
                  type="number"
                  min={1}
                  max={200}
                  value={settings.dailyGoal}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      dailyGoal: Number(e.target.value),
                    })
                  }
                />
                <span className="text-[11px] font-normal text-stone-400">
                  A little target to come back to. 1–200.
                </span>
              </label>
              <label className="field">
                Questions per quiz
                <input
                  required
                  type="number"
                  min={1}
                  max={100}
                  value={settings.quizSize}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      quizSize: Number(e.target.value),
                    })
                  }
                />
                <span className="text-[11px] font-normal text-stone-400">
                  Up to 100, or your available cards.
                </span>
              </label>
            </div>
            {(
              [
                {
                  key: "autoDaily",
                  title: "A daily dose of learning",
                  description:
                    "Keep a daily review shortcut on your home page.",
                },
                {
                  key: "shuffle",
                  title: "Keep things fresh",
                  description:
                    "Shuffle cards and questions each time you practice.",
                },
              ] as const
            ).map((option) => (
              <label
                key={option.key}
                className="flex cursor-pointer items-center justify-between gap-5 border-t border-stone-100 pt-5"
              >
                <span>
                  <span className="block text-sm font-medium">
                    {option.title}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-stone-500">
                    {option.description}
                  </span>
                </span>
                <span className="toggle">
                  <input
                    type="checkbox"
                    checked={settings[option.key]}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        [option.key]: e.target.checked,
                      })
                    }
                  />
                  <span />
                </span>
              </label>
            ))}
            <div className="flex items-center justify-between gap-3 border-t border-stone-100 pt-5">
              <span className="text-[11px] text-stone-400">
                Your next session, your way.
              </span>
              <ProcessButton label="Save preferences" state={save.state} successLabel="Saved" />
            </div>
          </form>
        </div>
        <div className="space-y-6">
          <section className="panel p-6 sm:p-7">
            <SectionTitle
              title="Keep your learning safe"
              description="Your knowledge belongs to you."
            />
            <div className="mb-5 grid grid-cols-3 divide-x divide-stone-200 rounded-xl bg-stone-50 py-4 text-center">
              {[
                { value: data.reviewers.length, label: "reviewers" },
                { value: data.topics.length, label: "topics" },
                { value: data.attempts.length, label: "quizzes" },
              ].map((stat) => (
                <div key={stat.label}>
                  <strong className="text-xl font-semibold">
                    {stat.value}
                  </strong>
                  <span className="mt-1 block text-[10px] text-stone-400">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs leading-6 text-stone-500">
              Everything lives in this browser. Save a backup for peace of mind,
              or bring your library to another device.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <ProcessButton label="Export JSON" className="button secondary" state={exporting.state} successLabel="Exported" onClick={() => void exporting.run(() => downloadJson(data))} />
              <ProcessButton label="Import JSON" className="button secondary" state={importing.state} successLabel="Imported" onClick={() => input.current?.click()} />
            </div>
            <input
              ref={input}
              type="file"
              accept=".json,application/json"
              className="hidden"
              aria-label="Import Mira backup"
              onChange={(e) => void importFile(e.target.files?.[0])}
            />
            <p className="mt-3 text-[10px] leading-5 text-stone-400">
              Import replaces existing data after confirmation. Maximum 5 MB.
            </p>
          </section>
          <section className="install-card rounded-2xl border p-6 sm:p-7">
            <SectionTitle
              title="A little closer, wherever you are"
              description="Give Mira a spot on your home screen."
            />
            <p className="text-xs leading-6 text-stone-500">
              Choose “Install app” or “Add to Home Screen” in your browser.
              Visit once online, then take your learning offline.
            </p>
            <RouteLink page="Guide" className="text-button mt-4">
              Read the getting-started guide <Icon name="arrow" size={14} />
            </RouteLink>
          </section>
          <section className="panel p-6 sm:p-7">
            <SectionTitle
              title="Good to know"
              description="A little clarity goes a long way."
            />
            <div className="divide-y divide-stone-100">
              {(
                [
                  { page: "Guide", label: "Study guide & help" },
                  { page: "Privacy", label: "Privacy & your data" },
                  { page: "Terms", label: "Terms & conditions" },
                  { page: "About", label: "About Mira" },
                ] as const
              ).map((link) => (
                <RouteLink
                  className="flex items-center gap-3 py-3 text-xs text-stone-500 hover:text-violet-500"
                  key={link.page}
                  page={link.page}
                >
                  <Icon name={link.page} size={16} />
                  <span className="flex-1">{link.label}</span>
                  <Icon name="arrow" size={13} />
                </RouteLink>
              ))}
            </div>
          </section>
        </div>
      </div>
      <section className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-200 p-6">
        <div>
          <h2 className="text-sm font-semibold text-red-800">
            Need a fresh start?
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            Clear your library, results, and preferences. Export a backup first.
          </p>
        </div>
        <ProcessButton label="Clear all local data" state={clearing.state} successLabel="Cleared"
          className="button border border-red-200 text-red-700 hover:bg-red-50"
          onClick={() => {
            if (
              confirm(
                "Permanently clear all Mira data on this device? Export a backup first.",
              )
            ) {
              void clearing.run(() => {
              const fresh = emptyData();
              if (update(fresh)) {
                setSettings(fresh.settings);
                setError("");
                setMessage("Your local data has been cleared.");
                return true;
              } return false; });
            }
          }}
        >
          Clear all local data
        </ProcessButton>
      </section>
    </>
  );
}
function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div>
        <h2 className="section-title">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-stone-500">{description}</p>
      </div>
    </div>
  );
}
