import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PagePlaceholder } from "./page-placeholder";

describe("PagePlaceholder", () => {
  it("presents the route name as the page heading", () => {
    render(<PagePlaceholder title="Agenda" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Agenda" }),
    ).toBeInTheDocument();
  });
});
