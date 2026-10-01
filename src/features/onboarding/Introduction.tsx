import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { ProcessButton } from "../../components/ProcessButton";
import { useActionFeedback } from "../../hooks/useActionFeedback";
import type { Theme } from "../../types/study";
import type { SetupSettings, StartChoice } from "./onboarding";
import { SetupPreferences } from "./SetupPreferences";
import { StartOptions } from "./StartOptions";
import { artwork } from "./assets";
import "../../assets/styles/features/onboarding.css";

const titles = [
  "A little wiser, together.",
  "Make it yours.",
  "Where shall we start?",
];
const poses = [
  artwork.miraPeekLeft,
  artwork.miraSetupAttentive,
  artwork.miraReadyLaptop,
];

export function Introduction({
  settings,
  onPreviewTheme,
  onSave,
  onDone,
}: {
  settings: SetupSettings;
  onPreviewTheme: (theme: Theme) => void;
  onSave: (settings?: SetupSettings) => Promise<boolean>;
  onDone: (choice: StartChoice) => void;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(settings.name);
  const [theme, setTheme] = useState(settings.theme);
  const [goal, setGoal] = useState(settings.dailyGoal);
  const [choice, setChoice] = useState<StartChoice>("create");
  const [skipping, setSkipping] = useState(false);
  const action = useActionFeedback();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo(0, 0);
  }, [step]);

  function finish(skip = false) {
    setSkipping(skip);
    void action.run(
      () =>
        onSave(
          skip ? undefined : { name: name.trim(), theme, dailyGoal: goal },
        ),
      () => onDone(skip ? "explore" : choice),
    );
  }

  return (
    <main className="onboarding" data-step={step}>
      <header className="onboarding-top">
        <span className="onboarding-brand">
          mira<span>.</span>
        </span>
        <ProcessButton
          type="button"
          className="button secondary"
          label="Skip introduction"
          state={skipping ? action.state : "idle"}
          disabled={action.state !== "idle"}
          successLabel="Ready"
          onClick={() => finish(true)}
        />
      </header>
      <div className="onboarding-layout">
        <section className="onboarding-art" aria-hidden="true">
          <div className="onboarding-orbit" />
          <img
            key={step}
            className="onboarding-mira"
            src={poses[step]}
            alt=""
            width={400}
            height={440}
            draggable={false}
          />
          <span className="onboarding-ground" />
        </section>
        <section className="onboarding-content">
          <h1 ref={heading} tabIndex={-1}>
            {titles[step]}
          </h1>
          <div key={step} className="onboarding-step">
            {step === 0 && (
              <>
                <p className="onboarding-lead">
                  Hi, I’m Mira. Ready to learn together?
                </p>
              </>
            )}
            {step === 1 && (
              <>
                <SetupPreferences
                  name={name}
                  theme={theme}
                  goal={goal}
                  onName={setName}
                  onTheme={(value) => {
                    setTheme(value);
                    onPreviewTheme(value);
                  }}
                  onGoal={setGoal}
                />
              </>
            )}
            {step === 2 && (
              <>
                <StartOptions choice={choice} onChange={setChoice} />
              </>
            )}
          </div>
          {action.error && (
            <p role="alert" className="onboarding-error">
              {action.error}
            </p>
          )}
          <div className="onboarding-actions">
            {step > 0 && (
              <button
                className="button secondary"
                disabled={action.state !== "idle"}
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )}
            {step < 2 ? (
              <button
                className="button primary"
                disabled={action.state !== "idle"}
                onClick={() => setStep(step + 1)}
              >
                {step === 0 ? "Let’s begin" : "Continue"}
                <ArrowRight size={16} />
              </button>
            ) : (
              <ProcessButton
                label="Start learning"
                state={skipping ? "idle" : action.state}
                disabled={action.state !== "idle"}
                successLabel="You’re all set"
                onClick={() => finish()}
              />
            )}
          </div>
          <div
            className="onboarding-progress"
            aria-label={"Introduction step " + (step + 1) + " of 3"}
          >
            {[0, 1, 2].map((n) => (
              <span key={n} data-active={n === step} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
