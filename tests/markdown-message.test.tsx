import { render, screen } from "@testing-library/react";
import { MarkdownMessage } from "../src/features/ai/MarkdownMessage";

test("renders readable Markdown blocks and tables", () => {
  const { container } = render(<MarkdownMessage content={'## Cells\n\n**Important** and *useful*.\n\n- Nucleus\n- Membrane\n\n1. Read\n2. Review\n\n> Remember this\n\n~~~js\nconst cell = 1;\n~~~\n\n| Part | Job |\n| --- | --- |\n| Nucleus | Control |\n\n[Learn](https://example.com)'} />);
  expect(screen.getByRole("heading", { name: "Cells" })).toBeVisible();
  expect(container.querySelector("strong")).toHaveTextContent("Important");
  expect(container.querySelector("em")).toHaveTextContent("useful");
  expect(screen.getAllByRole("list")).toHaveLength(2);
  expect(container.querySelector("blockquote")).toHaveTextContent("Remember this");
  expect(container.querySelector("pre code")).toHaveTextContent("const cell = 1;");
  expect(screen.getByRole("table")).toBeVisible();
  expect(screen.getByRole("link", { name: "Learn" })).toHaveAttribute("href", "https://example.com");
});

test("does not render raw HTML, remote images, or unsafe links", () => {
  const { container } = render(<MarkdownMessage content={'<script>alert(1)</script>\n\n<img src="x" onerror="alert(1)">\n\n![tracking](https://example.com/image.png)\n\n[unsafe](javascript:alert%281%29)'} />);
  expect(container.querySelector("script, img")).toBeNull();
  expect(screen.getByText("unsafe")).not.toHaveAttribute("href", expect.stringContaining("javascript:"));
});
