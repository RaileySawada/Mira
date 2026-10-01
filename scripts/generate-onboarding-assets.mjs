import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const characters = [
  "mira-welcome-wave",
  "mira-setup-attentive",
  "mira-ready-laptop",
  "mira-peek-left",
];
const icons = [
  "personal-setup",
  "light-theme",
  "dark-theme",
  "system-theme",
  "daily-goal",
  "create-reviewer",
  "backup",
  "explore",
];
const root = new URL("../src/assets/images/", import.meta.url);
const output = new URL("onboarding/", root);
await mkdir(output, { recursive: true });
for (const [folder, names, size] of [
  ["mira", characters, 640],
  ["icons", icons, 144],
]) {
  for (const name of names) {
    await sharp(fileURLToPath(new URL(folder + "/" + name + ".png", root)))
      .trim()
      .resize(size, size, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(fileURLToPath(new URL(name + ".webp", output)));
  }
}
