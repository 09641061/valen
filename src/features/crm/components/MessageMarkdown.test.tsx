import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MessageMarkdown } from "./MessageMarkdown";

describe("MessageMarkdown", () => {
  it("renders real WhatsApp bullet list with bold service name", () => {
    const { container } = render(
      <MessageMarkdown content="- *Corte clásico* — 30 min — PEN 30.00" />,
    );

    const list = container.querySelector("ul");
    expect(list).toBeInTheDocument();
    const item = screen.getByRole("listitem");
    expect(item).toHaveTextContent("Corte clásico — 30 min — PEN 30.00");

    const bold = container.querySelector("strong");
    expect(bold).toHaveTextContent("Corte clásico");
  });

  it("renders Markdown bold, italic, strikethrough, and inline code", () => {
    const { container } = render(
      <MessageMarkdown content="**bold** _italic_ ~strike~ `code`" />,
    );

    expect(container.querySelector("strong")).toHaveTextContent("bold");
    expect(container.querySelector("em")).toHaveTextContent("italic");
    expect(container.querySelector("del")).toHaveTextContent("strike");
    expect(container.querySelector("code")).toHaveTextContent("code");
  });

  it("keeps snake_case identifiers and URLs with underscores literal", () => {
    const { container } = render(
      <MessageMarkdown content="Check foo_bar_baz and https://example.com/a_b_c" />,
    );

    expect(container.querySelector("em")).not.toBeInTheDocument();
    expect(
      screen.getByText("Check foo_bar_baz and https://example.com/a_b_c"),
    ).toBeInTheDocument();
  });

  it("renders numbered lists", () => {
    const { container } = render(
      <MessageMarkdown content={"1. First option\n2. Second option"} />,
    );

    const list = container.querySelector("ol");
    expect(list).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("First option");
    expect(items[1]).toHaveTextContent("Second option");
  });

  it("renders unclosed delimiters as literal text", () => {
    const { container } = render(<MessageMarkdown content="*hola" />);

    expect(container.querySelector("strong")).not.toBeInTheDocument();
    expect(screen.getByText("*hola")).toBeInTheDocument();
  });

  it("escapes raw HTML and script tags safely", () => {
    const { container } = render(
      <MessageMarkdown content="<script>alert(1)</script>" />,
    );

    expect(container.querySelector("script")).not.toBeInTheDocument();
    expect(screen.getByText("<script>alert(1)</script>")).toBeInTheDocument();
  });
});
