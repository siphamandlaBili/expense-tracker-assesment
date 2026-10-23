import { screen, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { formatDayLong } from "../lib/format";

/** Opens a <Select> (role combobox) and clicks the named option. */
export async function chooseOption(
  user: UserEvent,
  combobox: HTMLElement,
  option: string | RegExp,
) {
  await user.click(combobox);
  await user.click(screen.getByRole("option", { name: option }));
}

/** Shows the month containing `isoDate` in a date picker, then clicks it. */
async function clickDay(user: UserEvent, picker: HTMLElement, isoDate: string) {
  const name = formatDayLong(isoDate);
  for (let step = 0; step < 120; step++) {
    const day = within(picker).queryByRole("button", { name });
    if (day) {
      await user.click(day);
      return;
    }
    // Any day in view tells us which way to go.
    const shown = within(picker)
      .getAllByRole("button", { name: /\d{4}$/ })[0]
      .getAttribute("data-day") as string;
    await user.click(
      within(picker).getByRole("button", {
        name: isoDate < shown ? "Previous month" : "Next month",
      }),
    );
  }
  throw new Error(`Couldn't find ${isoDate} in the date picker`);
}

/**
 * Sets a <DateRangeFields> pair (the group element) to a range. Picks To
 * first, so a new end is never blocked by the current start being later.
 */
export async function pickDateRange(
  user: UserEvent,
  fields: HTMLElement,
  startDate: string,
  endDate: string,
) {
  await user.click(within(fields).getByRole("button", { name: /^To:/ }));
  await clickDay(user, endDialog(), endDate);
  // With no start yet, the start calendar opens by itself.
  if (!screen.queryByRole("dialog", { name: "Choose a start date" })) {
    await user.click(within(fields).getByRole("button", { name: /^From:/ }));
  }
  await clickDay(user, startDialog(), startDate);
}

export const startDialog = () =>
  screen.getByRole("dialog", { name: "Choose a start date" });
export const endDialog = () =>
  screen.getByRole("dialog", { name: "Choose an end date" });

export { clickDay };
