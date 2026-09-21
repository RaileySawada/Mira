import fs from "node:fs";
import sharp from "sharp";

fs.mkdirSync("public/expressions", { recursive: true });
fs.mkdirSync("public/rewards", { recursive: true });

if (fs.existsSync("public/emoticons"))
  for (const name of ["normal", "happy", "sad", "amazed", "thinking"]) {
    await sharp("public/emoticons/" + name + ".png")
      .resize(360, 360, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile("public/expressions/" + name + ".webp");
  }
for (let index = 1; index <= 10; index++) {
  await sharp("public/new-rewards/" + index + ".png")
    .resize(400, 400, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile("public/rewards/" + index + ".webp");
}
