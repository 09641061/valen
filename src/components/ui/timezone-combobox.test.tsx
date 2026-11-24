import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { TimePicker } from "./time-picker";
import { TimezoneCombobox } from "./timezone-combobox";

function ControlledTimezone({
  initial = "UTC",
  onSelect,
}: {
  initial?: string;
  onSelect?: (tz: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <TimezoneCombobox
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onSelect?.(next);
      }}
    />
  );
}

function ControlledTimePicker({
  initial = "09:00",
  onChange,
}: {
  initial?: string;
  onChange?: (val: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <TimePicker
      aria-label="Opening time"
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

describe("TimezoneCombobox", () => {
  it("renders current value, filters timezones, selects a match, and closes popover", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ControlledTimezone initial="UTC" onSelect={onSelect} />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent("UTC");

    await user.click(trigger);

    const searchInput = await screen.findByLabelText("Search timezone");
    await user.type(searchInput, "Madrid");

    const madridOption = await screen.findByRole("button", {
      name: /Europe\/Madrid/,
    });
    await user.click(madridOption);

    expect(onSelect).toHaveBeenCalledWith("Europe/Madrid");
    await waitFor(() => {
      expect(screen.queryByLabelText("Search timezone")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("combobox")).toHaveTextContent("Europe/Madrid");
  });

  it("shows empty message when no timezone matches the query", async () => {
    const user = userEvent.setup();
    render(<ControlledTimezone initial="UTC" />);

    await user.click(screen.getByRole("combobox"));
    await user.type(
      await screen.findByLabelText("Search timezone"),
      "Atlantis",
    );

    expect(screen.getByText("No timezones found.")).toBeInTheDocument();
  });
});

describe("TimePicker", () => {
  it("normalizes typed time like 9:30 to 09:30 on blur", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledTimePicker initial="08:00" onChange={onChange} />);

    const input = screen.getByLabelText("Opening time");
    await user.clear(input);
    await user.type(input, "9:30");
    await user.tab();

    expect(onChange).toHaveBeenLastCalledWith("09:30");
    expect(input).toHaveValue("09:30");
  });

  it("opens clock popover and picks hour and minute", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledTimePicker initial="09:00" onChange={onChange} />);

    await user.click(
      screen.getByRole("button", { name: "Opening time picker" }),
    );

    await user.click(await screen.findByRole("button", { name: "14" }));
    expect(onChange).toHaveBeenCalledWith("14:00");

    await user.click(screen.getByRole("button", { name: "30" }));
    expect(onChange).toHaveBeenCalledWith("14:30");

    await waitFor(() => {
      expect(screen.queryByText("Hour")).not.toBeInTheDocument();
    });
  });
});
