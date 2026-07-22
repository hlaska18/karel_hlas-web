import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Unmount React trees rendered by @testing-library between tests so queries
// (e.g. getByText) don't match leftover DOM from a previous test.
afterEach(() => {
  cleanup();
});
