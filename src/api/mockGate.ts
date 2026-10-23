// When the in-browser mock API is on, requests must wait until its service
// worker is running, or they'd reach the real network. Rendering doesn't
// wait (pages without data, like the landing page, show at once); only
// API calls do, through apiRequest.

let ready: Promise<void> = Promise.resolve();

/** Called once at startup with the mock worker's start-up promise. */
export function setMockReady(starting: Promise<unknown>) {
  // A failed start shouldn't block requests forever; they go to the network.
  ready = starting.then(
    () => undefined,
    () => undefined,
  );
}

/** Resolves when API requests can be sent. */
export const whenMockReady = () => ready;
