export type InlineNode =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "strike"; value: string }
  | { type: "code"; value: string };

export type BlockNode =
  | { type: "paragraph"; lines: InlineNode[][] }
  | { type: "bullet-list"; items: InlineNode[][] }
  | { type: "numbered-list"; items: InlineNode[][] };

interface InlineRule {
  delimiter: string;
  type: Exclude<InlineNode["type"], "text">;
  disallowEdgeSpaces: boolean;
  requireWordBoundary: boolean;
}

const INLINE_RULES: InlineRule[] = [
  { delimiter: "`", type: "code", disallowEdgeSpaces: false, requireWordBoundary: false },
  { delimiter: "**", type: "bold", disallowEdgeSpaces: true, requireWordBoundary: false },
  { delimiter: "*", type: "bold", disallowEdgeSpaces: true, requireWordBoundary: false },
  { delimiter: "_", type: "italic", disallowEdgeSpaces: true, requireWordBoundary: true },
  { delimiter: "~", type: "strike", disallowEdgeSpaces: true, requireWordBoundary: false },
];

const NUMBERED_ITEM_PREFIX = /^\d+\. /;

function isWordChar(ch: string | undefined): boolean {
  return ch !== undefined && /[A-Za-z0-9]/.test(ch);
}

function hasValidBoundaries(
  text: string,
  openIndex: number,
  closeIndex: number,
  rule: InlineRule,
): boolean {
  const len = rule.delimiter.length;
  if (rule.disallowEdgeSpaces) {
    if (text[openIndex + len] === " " || text[closeIndex - 1] === " ") {
      return false;
    }
  }
  if (rule.requireWordBoundary) {
    if (isWordChar(text[openIndex - 1]) || isWordChar(text[closeIndex + len])) {
      return false;
    }
  }
  return true;
}

function matchRule(
  text: string,
  index: number,
  rule: InlineRule,
): { node: InlineNode; nextIndex: number } | null {
  const len = rule.delimiter.length;
  if (!text.startsWith(rule.delimiter, index)) return null;

  const contentStart = index + len;
  if (contentStart >= text.length) return null;
  if (len === 1 && text[contentStart] === rule.delimiter) return null;

  const closeIndex = text.indexOf(rule.delimiter, contentStart);
  if (closeIndex <= contentStart) return null;
  if (!hasValidBoundaries(text, index, closeIndex, rule)) return null;

  return {
    node: { type: rule.type, value: text.slice(contentStart, closeIndex) },
    nextIndex: closeIndex + len,
  };
}

function matchAnyInline(
  text: string,
  index: number,
): { node: InlineNode; nextIndex: number } | null {
  for (const rule of INLINE_RULES) {
    const matched = matchRule(text, index, rule);
    if (matched) return matched;
  }
  return null;
}

export function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let buffer = "";
  let i = 0;

  while (i < text.length) {
    const matched = matchAnyInline(text, i);
    if (matched) {
      if (buffer.length > 0) {
        nodes.push({ type: "text", value: buffer });
        buffer = "";
      }
      nodes.push(matched.node);
      i = matched.nextIndex;
      continue;
    }
    buffer += text[i];
    i += 1;
  }

  if (buffer.length > 0) {
    nodes.push({ type: "text", value: buffer });
  }
  return nodes;
}

function appendListItem(
  blocks: BlockNode[],
  type: "bullet-list" | "numbered-list",
  itemText: string,
): void {
  const item = parseInline(itemText);
  const last = blocks[blocks.length - 1];
  if (last && last.type === type) {
    last.items.push(item);
  } else {
    blocks.push({ type, items: [item] });
  }
}

function appendParagraphLine(blocks: BlockNode[], line: string): void {
  const parsedLine = parseInline(line);
  const last = blocks[blocks.length - 1];
  if (last && last.type === "paragraph" && last.lines.length > 0) {
    last.lines.push(parsedLine);
  } else {
    blocks.push({ type: "paragraph", lines: [parsedLine] });
  }
}

export function parseMessageBlocks(content: string): BlockNode[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: BlockNode[] = [];

  for (const line of lines) {
    if (line.trim() === "") {
      blocks.push({ type: "paragraph", lines: [] });
      continue;
    }

    const trimmed = line.trimStart();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      appendListItem(blocks, "bullet-list", trimmed.slice(2));
      continue;
    }

    const numbered = NUMBERED_ITEM_PREFIX.exec(trimmed);
    if (numbered) {
      appendListItem(blocks, "numbered-list", trimmed.slice(numbered[0].length));
      continue;
    }

    appendParagraphLine(blocks, line);
  }

  return blocks.filter(
    (block) => block.type !== "paragraph" || block.lines.length > 0,
  );
}
