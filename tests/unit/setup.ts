import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Full-suite runs are slower than isolated runs; give findBy* queries headroom
// so tests stay deterministic under load.
configure({ asyncUtilTimeout: 3000 });

afterEach(() => {
  cleanup();
});
