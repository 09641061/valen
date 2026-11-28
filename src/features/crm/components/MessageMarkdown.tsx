import { Fragment } from "react";
import {
  parseMessageBlocks,
  type InlineNode,
} from "../message-markdown-parser";

interface MessageMarkdownProps {
  content: string;
}

function renderInlines(nodes: InlineNode[], keyPrefix: string) {
  return nodes.map((node, idx) => {
    const key = `${keyPrefix}-${idx}`;
    switch (node.type) {
      case "bold":
        return (
          <strong key={key} className="font-semibold">
            {node.value}
          </strong>
        );
      case "italic":
        return (
          <em key={key} className="italic">
            {node.value}
          </em>
        );
      case "strike":
        return (
          <del key={key} className="line-through">
            {node.value}
          </del>
        );
      case "code":
        return (
          <code
            key={key}
            className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.85em] dark:bg-white/10"
          >
            {node.value}
          </code>
        );
      case "text":
        return <Fragment key={key}>{node.value}</Fragment>;
    }
  });
}

export function MessageMarkdown({ content }: MessageMarkdownProps) {
  const blocks = parseMessageBlocks(content);

  return (
    <div className="space-y-1.5 break-words">
      {blocks.map((block, blockIdx) => {
        if (block.type === "bullet-list") {
          return (
            <ul
              key={`b-${blockIdx}`}
              className="list-disc space-y-0.5 pl-4"
            >
              {block.items.map((item, itemIdx) => (
                <li key={`b-${blockIdx}-i-${itemIdx}`}>
                  {renderInlines(item, `b-${blockIdx}-i-${itemIdx}`)}
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "numbered-list") {
          return (
            <ol
              key={`b-${blockIdx}`}
              className="list-decimal space-y-0.5 pl-4"
            >
              {block.items.map((item, itemIdx) => (
                <li key={`b-${blockIdx}-i-${itemIdx}`}>
                  {renderInlines(item, `b-${blockIdx}-i-${itemIdx}`)}
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={`b-${blockIdx}`} className="whitespace-pre-wrap break-words">
            {block.lines.map((line, lineIdx) => (
              <Fragment key={`b-${blockIdx}-l-${lineIdx}`}>
                {lineIdx > 0 ? <br /> : null}
                {renderInlines(line, `b-${blockIdx}-l-${lineIdx}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
