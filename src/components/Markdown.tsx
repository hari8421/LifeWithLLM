import type { ReactNode } from "react";

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  // Very small inline parser: code, bold, links.
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("`")) {
      parts.push(
        <code key={key++} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        parts.push(
          <a
            key={key++}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-2"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        parts.push(token);
      }
    }
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function Markdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let ordered = false;
  let key = 0;

  const flushList = () => {
    if (list.length === 0) return;
    const items = list.map((item, i) => (
      <li key={i}>{renderInline(item)}</li>
    ));
    blocks.push(
      ordered ? (
        <ol key={key++}>{items}</ol>
      ) : (
        <ul key={key++}>{items}</ul>
      )
    );
    list = [];
  };

  for (const line of lines) {
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flushList();
      const Tag = (`h${heading[1].length}` as "h1" | "h2" | "h3");
      blocks.push(<Tag key={key++}>{renderInline(heading[2])}</Tag>);
      continue;
    }
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      flushList();
      ordered = false;
      list.push(bullet[1]);
      continue;
    }
    const num = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (num) {
      flushList();
      ordered = true;
      list.push(num[1]);
      continue;
    }
    if (line.trim() === "") {
      flushList();
      continue;
    }
    if (line.trim().startsWith("```")) {
      flushList();
      continue;
    }
    flushList();
    blocks.push(<p key={key++}>{renderInline(line)}</p>);
  }
  flushList();

  return <div className="prose-assistant text-sm">{blocks}</div>;
}
