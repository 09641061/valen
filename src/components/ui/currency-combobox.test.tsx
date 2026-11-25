import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { CurrencyCombobox } from "./currency-combobox";

function ControlledCurrency({
  initial = "USD",
  onSelect,
}: {
  initial?: string;
  onSelect?: (currency: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <CurrencyCombobox
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onSelect?.(next);
      }}
    />
  );
}

describe("CurrencyCombobox", () => {
  it("renders current value, searches PEN, selects a match, and closes popover", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ControlledCurrency initial="USD" onSelect={onSelect} />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent("USD");

    await user.click(trigger);

    const searchInput = await screen.findByLabelText("Search currency");
    await user.type(searchInput, "PEN");

    const penOption = await screen.findByRole("button", {
      name: /PEN · Peruvian Sol/,
    });
    await user.click(penOption);

    expect(onSelect).toHaveBeenCalledWith("PEN");
    await waitFor(() => {
      expect(
        screen.queryByLabelText("Search currency"),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByRole("combobox")).toHaveTextContent("PEN · Peruvian Sol");
  });

  it("shows empty message when no currency matches the query", async () => {
    const user = userEvent.setup();
    render(<ControlledCurrency initial="USD" />);

    await user.click(screen.getByRole("combobox"));
    await user.type(
      await screen.findByLabelText("Search currency"),
      "XYZ_NOT_REAL",
    );

    expect(screen.getByText("No currencies found.")).toBeInTheDocument();
  });
});
