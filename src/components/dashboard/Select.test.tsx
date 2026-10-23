import { screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "../../test/axe";
import { renderWithProviders } from "../../test/render";
import { Select } from "./Select";

const OPTIONS = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "blueberry", label: "Blueberry" },
  { value: "cherry", label: "Cherry" },
];

function Fruit() {
  const [value, setValue] = useState("banana");
  return (
    <>
      <Select
        label="Fruit"
        value={value}
        options={OPTIONS}
        onChange={setValue}
      />
      <button type="button">Elsewhere</button>
    </>
  );
}

const combobox = () => screen.getByRole("combobox", { name: "Fruit" });

describe("Select", () => {
  it("shows the selected option and opens a listbox on click", async () => {
    const { user } = renderWithProviders(<Fruit />);

    expect(combobox()).toHaveTextContent("Banana");
    expect(combobox()).toHaveAttribute("aria-expanded", "false");

    await user.click(combobox());

    expect(combobox()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("option", { name: "Banana" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("chooses an option with the mouse", async () => {
    const { user } = renderWithProviders(<Fruit />);

    await user.click(combobox());
    await user.click(screen.getByRole("option", { name: "Cherry" }));

    expect(combobox()).toHaveTextContent("Cherry");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("works from the keyboard", async () => {
    const { user } = renderWithProviders(<Fruit />);
    combobox().focus();

    await user.keyboard("{ArrowDown}");
    const activeOption = () =>
      screen.getByRole("option", {
        name: OPTIONS.find((_, index) =>
          combobox()
            .getAttribute("aria-activedescendant")
            ?.endsWith(`option-${index}`),
        )?.label,
      });
    expect(activeOption()).toHaveTextContent("Banana");

    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(activeOption()).toHaveTextContent("Cherry");

    await user.keyboard("{Home}");
    expect(activeOption()).toHaveTextContent("Apple");

    await user.keyboard("{Enter}");
    expect(combobox()).toHaveTextContent("Apple");
    expect(combobox()).toHaveFocus();
  });

  it("closes on Escape without changing the value", async () => {
    const { user } = renderWithProviders(<Fruit />);
    combobox().focus();

    await user.keyboard("{ArrowDown}{ArrowDown}{Escape}");

    expect(combobox()).toHaveAttribute("aria-expanded", "false");
    expect(combobox()).toHaveTextContent("Banana");
  });

  it("jumps to options by their first letter", async () => {
    const { user } = renderWithProviders(<Fruit />);
    combobox().focus();

    // Closed: typing selects the next match straight away.
    await user.keyboard("b");
    expect(combobox()).toHaveTextContent("Blueberry");
    await user.keyboard("c");
    expect(combobox()).toHaveTextContent("Cherry");
  });

  it("closes when clicking elsewhere", async () => {
    const { user } = renderWithProviders(<Fruit />);

    await user.click(combobox());
    await user.click(screen.getByRole("button", { name: "Elsewhere" }));

    expect(combobox()).toHaveAttribute("aria-expanded", "false");
  });

  it("has no detectable accessibility violations while open", async () => {
    const { user, container } = renderWithProviders(<Fruit />);
    await user.click(combobox());

    await expectNoA11yViolations(container);
  });
});
