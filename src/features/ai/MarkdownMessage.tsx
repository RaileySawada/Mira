import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownMessage({ content }: { content: string }) {
  return <div className="chat-markdown"><Markdown remarkPlugins={[remarkGfm]} skipHtml disallowedElements={["img"]}>{content}</Markdown></div>;
}
