import { render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { describe, expect, it, vi } from "vitest";
import { lazyPage } from "./lazyPage";

const Page = () => <h1>Loaded page</h1>;
const renderInSuspense = (Component: () => React.ReactNode) =>
  render(
    <Suspense fallback={<p>Loading page</p>}>
      <Component />
    </Suspense>,
  );

describe("lazyPage", () => {
  it("shows the fallback while the chunk loads, then the page", async () => {
    const LazyPage = lazyPage(() => Promise.resolve(Page));
    renderInSuspense(LazyPage);

    expect(screen.getByText("Loading page")).toBeInTheDocument();
    expect(await screen.findByRole("heading")).toHaveTextContent("Loaded page");
  });

  it("renders at once after preload, loading the chunk only once", async () => {
    const load = vi.fn(() => Promise.resolve(Page));
    const LazyPage = lazyPage(load);
    await Promise.all([LazyPage.preload(), LazyPage.preload()]);
    renderInSuspense(LazyPage);

    expect(screen.getByRole("heading")).toHaveTextContent("Loaded page");
    expect(load).toHaveBeenCalledOnce();
  });
});
