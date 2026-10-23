import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Transaction } from "../../api/schemas";
import { renderWithProviders } from "../../test/render";
import { TransactionDrawer } from "./TransactionDrawer";

const transaction: Transaction = {
  id: "txn_123456",
  date: "2024-09-16T14:30:00Z",
  merchant: "Pick n Pay",
  category: "Groceries",
  amount: 245.8,
  description: "Weekly groceries",
  paymentMethod: "Credit Card",
  icon: "shopping-cart",
  categoryColor: "#FF6B6B",
};

// jsdom has no layout, so content height is unknown and the sheet falls back
// to 50% of the 768px viewport for its lowest snap point; the top is 92%.
const HALF = 384;
const FULL = 0.92 * 768;

let clock = 0;

function renderDrawer() {
  const onClose = vi.fn();
  renderWithProviders(
    <TransactionDrawer transaction={transaction} onClose={onClose} />,
  );
  const sheet = screen.getByRole("dialog", { name: "Transaction details" });
  const title = screen.getByRole("heading", { name: "Transaction details" });
  return { onClose, sheet, title };
}

/** Drags from `fromY` to `toY` in steps spaced `msPerStep` apart. */
function drag(
  target: HTMLElement,
  fromY: number,
  toY: number,
  { steps = 5, msPerStep = 50 } = {},
) {
  fireEvent.pointerDown(target, { pointerId: 1, button: 0, clientY: fromY });
  for (let step = 1; step <= steps; step++) {
    clock += msPerStep;
    fireEvent.pointerMove(target, {
      pointerId: 1,
      clientY: fromY + ((toY - fromY) * step) / steps,
    });
  }
  fireEvent.pointerUp(target, { pointerId: 1, clientY: toY });
}

const heightOf = (sheet: HTMLElement) => parseFloat(sheet.style.height);

beforeEach(() => {
  clock = 0;
  vi.spyOn(performance, "now").mockImplementation(() => clock);
});

describe("TransactionDrawer bottom sheet (phones)", () => {
  it("opens at the half-height snap point", () => {
    const { sheet } = renderDrawer();

    expect(heightOf(sheet)).toBe(HALF);
  });

  it("expands and collapses with the handle button", () => {
    const { sheet } = renderDrawer();

    fireEvent.click(screen.getByRole("button", { name: "Expand details" }));
    expect(heightOf(sheet)).toBeCloseTo(FULL);

    fireEvent.click(screen.getByRole("button", { name: "Collapse details" }));
    expect(heightOf(sheet)).toBe(HALF);
  });

  it("follows the pointer while dragging", () => {
    const { sheet, title } = renderDrawer();

    fireEvent.pointerDown(title, { pointerId: 1, button: 0, clientY: 400 });
    clock += 50;
    fireEvent.pointerMove(title, { pointerId: 1, clientY: 300 });

    expect(heightOf(sheet)).toBe(HALF + 100);
  });

  it("settles on the nearest snap point when released", () => {
    const { sheet, title, onClose } = renderDrawer();

    // Slow drag up most of the way: settles fully open.
    drag(title, 400, 120);
    expect(heightOf(sheet)).toBeCloseTo(FULL);

    // Slow drag down a little: settles back at half.
    drag(title, 120, 330);
    expect(heightOf(sheet)).toBe(HALF);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("follows a quick flick past the nearest snap point", () => {
    const { sheet, title } = renderDrawer();

    // Only 60px up, but fast: carries on to fully open.
    drag(title, 400, 340, { steps: 3, msPerStep: 10 });

    expect(heightOf(sheet)).toBeCloseTo(FULL);
  });

  it("closes when pulled down past the lowest snap point", () => {
    const { title, onClose } = renderDrawer();

    drag(title, 400, 750);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("treats a tap as a tap, not a drag", () => {
    const { sheet, onClose } = renderDrawer();
    const close = screen.getByRole("button", {
      name: /close transaction details/i,
    });

    fireEvent.pointerDown(close, { pointerId: 1, button: 0, clientY: 400 });
    fireEvent.pointerMove(close, { pointerId: 1, clientY: 402 });
    fireEvent.pointerUp(close, { pointerId: 1, clientY: 402 });
    fireEvent.click(close);

    expect(heightOf(sheet)).toBe(HALF);
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe("TransactionDrawer side panel (md and up)", () => {
  it("is not resizable and has no handle", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("min-width"),
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    const { sheet, title } = renderDrawer();

    expect(sheet).not.toHaveAttribute(
      "style",
      expect.stringContaining("height"),
    );
    drag(title, 400, 100);
    expect(sheet).not.toHaveAttribute(
      "style",
      expect.stringContaining("height"),
    );
  });
});
