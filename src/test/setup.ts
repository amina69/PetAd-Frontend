import { cleanup } from "@testing-library/react";

// cleanup DOM after each test
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
afterEach(() => {
  cleanup();
});