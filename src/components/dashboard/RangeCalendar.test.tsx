import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/axe";
import { renderWithProviders } from "../../test/render";
import { RangeCalendar } from "./RangeCalendar";

function renderCalendar(props: { start?: string; end?: string } = {}) {
  const onPick = vi.fn();
  const utils = renderWithProviders(
    <RangeCalendar max="2024-09-16" onPick={onPick} {...props} />,
  );
  return { ...utils, onPick };
}

const day = (name: string) => screen.getByRole("button", { name });
const heading = () => screen.getByRole("heading", { level: 3 });

describe("RangeCalendar", () => {
  it("opens on the start date's month, Monday first", () => {
    renderCalendar({ start: "2024-08-05", end: "2024-08-09" });

    expect(heading()).toHaveTextContent("August 2024");
    expect(
      screen.getAllByRole("columnheader").map((cell) => cell.textContent),
    ).toEqual(["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]);
  });

  it("marks the selected range", () => {
    renderCalendar({ start: "2024-08-05", end: "2024-08-07" });

    const selected = screen
      .getAllByRole("gridcell")
      .filter((cell) => cell.getAttribute("aria-selected") === "true");
    expect(selected.map((cell) => cell.textContent)).toEqual(["5", "6", "7"]);
  });

  it("disables days after the maximum and the next month", () => {
    renderCalendar();

    expect(heading()).toHaveTextContent("September 2024");
    expect(day("17 Sep 2024")).toBeDisabled();
    expect(day("16 Sep 2024")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
  });

  it("reports the day picked", async () => {
    const { user, onPick } = renderCalendar();

    await user.click(day("3 Sep 2024"));

    expect(onPick).toHaveBeenCalledWith("2024-09-03");
  });

  it("moves between months with the buttons", async () => {
    const { user } = renderCalendar();

    await user.click(screen.getByRole("button", { name: "Previous month" }));

    expect(heading()).toHaveTextContent("August 2024");
  });

  it("is one tab stop, navigated with the arrow keys", async () => {
    const { user, onPick } = renderCalendar({ start: "2024-08-14" });

    // Focus starts on the start date.
    expect(day("14 Aug 2024")).toHaveFocus();
    expect(day("15 Aug 2024")).toHaveAttribute("tabindex", "-1");

    await user.keyboard("{ArrowRight}");
    expect(day("15 Aug 2024")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(day("22 Aug 2024")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(day("19 Aug 2024")).toHaveFocus();
    await user.keyboard("{End}");
    expect(day("25 Aug 2024")).toHaveFocus();

    // Crossing into the next month changes the view.
    await user.keyboard("{PageDown}");
    expect(heading()).toHaveTextContent("September 2024");
    expect(day("16 Sep 2024")).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onPick).toHaveBeenCalledWith("2024-09-16");
  });

  it("doesn't move focus past the maximum", async () => {
    const { user } = renderCalendar({ start: "2024-09-16" });

    await user.keyboard("{ArrowRight}");

    expect(day("16 Sep 2024")).toHaveFocus();
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = renderCalendar({
      start: "2024-09-02",
      end: "2024-09-06",
    });

    await expectNoA11yViolations(container);
  });
});
