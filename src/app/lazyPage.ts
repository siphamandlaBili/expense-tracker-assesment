import { createElement, lazy, type ComponentType } from "react";

/**
 * A code-split page. It suspends while its chunk downloads the first time;
 * once `preload()` has finished it renders straight away.
 */
export function lazyPage(load: () => Promise<ComponentType>) {
  let loaded: ComponentType | undefined;
  let loading: Promise<ComponentType> | undefined;

  const preload = () => {
    loading ??= load().then((component) => (loaded = component));
    return loading;
  };
  const Lazy = lazy(() =>
    preload().then((component) => ({ default: component })),
  );

  function LazyPage() {
    return createElement(loaded ?? Lazy);
  }
  return Object.assign(LazyPage, { preload });
}
