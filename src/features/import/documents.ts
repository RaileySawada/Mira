export interface ImportedCard {
  question: string;
  answer: string;
}
export function parseCsv(text: string): ImportedCard[] {
  if (text.length > 1000000)
    throw new Error("Choose a document smaller than 1 MB.");
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (quoted) throw new Error("CSV has an unfinished quoted field.");
  row.push(field);
  if (row.some((v) => v.trim())) rows.push(row);
  if (
    rows[0]?.[0]?.trim().toLowerCase() === "question" &&
    rows[0]?.[1]?.trim().toLowerCase() === "answer"
  )
    rows.shift();
  if (!rows.length || rows.length > 1000)
    throw new Error("CSV needs 1–1,000 question/answer rows.");
  return rows.map((r, index) => {
    if (r.length !== 2 || r.some((v) => !v.trim() || v.length > 5000))
      throw new Error("Check question/answer row " + (index + 1) + ".");
    return { question: r[0].trim(), answer: r[1].trim() };
  });
}
export function extractDocument(
  name: string,
  text: string,
): { text: string; cards: ImportedCard[] } {
  if (text.length > 1000000 || text.includes("\0"))
    throw new Error("Choose a text document smaller than 1 MB.");
  if (/\.csv$/i.test(name))
    return { text, cards: parseCsv(text.replace(/^\uFEFF/, "")) };
  if (!/\.(txt|md|markdown)$/i.test(name))
    throw new Error("Use TXT, Markdown or CSV. Export PDFs as text first.");
  return {
    text: text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n"),
    cards: [],
  };
}
