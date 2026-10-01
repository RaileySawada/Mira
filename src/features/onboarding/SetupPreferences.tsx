import type { Theme } from "../../types/study";
import { artwork } from "./assets";

const themes = [
  ["light", "Light", artwork.lightTheme],
  ["dark", "Dark", artwork.darkTheme],
  ["system", "System", artwork.systemTheme],
] as const;

export function SetupPreferences({
  name,
  theme,
  goal,
  onName,
  onTheme,
  onGoal,
}: {
  name: string;
  theme: Theme;
  goal: number;
  onName: (value: string) => void;
  onTheme: (value: Theme) => void;
  onGoal: (value: number) => void;
}) {
  return (
    <>
      <label className="field">
        What should Mira call you?{" "}
        <span className="onboarding-note">Optional</span>
        <input
          autoComplete="given-name"
          maxLength={80}
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="Your name"
        />
      </label>
      <fieldset>
        <legend>Choose your atmosphere</legend>
        <div className="onboarding-themes">
          {themes.map(([value, label, icon]) => (
            <label className="onboarding-option" key={value}>
              <input
                type="radio"
                name="setup-theme"
                checked={theme === value}
                onChange={() => onTheme(value)}
              />
              <img src={icon} alt="" width={40} height={40} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Your daily question goal</legend>
        <div className="onboarding-goals">
          {[5, 10, 20].map((value) => (
            <label className="onboarding-option" key={value}>
              <input
                type="radio"
                name="setup-goal"
                checked={goal === value}
                onChange={() => onGoal(value)}
              />
              <span>{value}</span>
              <small>
                {value === 5
                  ? "Ease in"
                  : value === 10
                    ? "Steady steps"
                    : "Keep growing"}
              </small>
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}
