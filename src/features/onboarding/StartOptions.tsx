import type { StartChoice } from "./onboarding";
import { artwork } from "./assets";

const options = [
  [
    "create",
    "Create a reviewer",
    "Start with a topic you’re learning.",
    artwork.createReviewer,
  ],
  [
    "import",
    "Import a backup",
    "Bring an existing Mira JSON library.",
    artwork.backup,
  ],
  [
    "explore",
    "Explore Mira",
    "Take a look around at your own pace.",
    artwork.explore,
  ],
] as const;

export function StartOptions({
  choice,
  onChange,
}: {
  choice: StartChoice;
  onChange: (value: StartChoice) => void;
}) {
  return (
    <fieldset className="onboarding-choices">
      <legend className="sr-only">Your next step</legend>
      {options.map(([value, title, detail, icon]) => (
        <label className="onboarding-choice" key={value}>
          <input
            type="radio"
            name="setup-start"
            checked={choice === value}
            onChange={() => onChange(value)}
          />
          <img src={icon} alt="" width={48} height={48} />
          <span>
            <strong>{title}</strong>
            <small>{detail}</small>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
