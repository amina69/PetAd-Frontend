import { cleanup } from "@testing-library/react";

// cleanup DOM after each test
// @ts-ignore
afterEach(() => {
  cleanup();
});