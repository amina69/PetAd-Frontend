import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { EscrowProgressStepper } from "../EscrowProgressStepper";
import { EscrowStatusBadge } from "../EscrowStatusBadge";
import { ESCROW_STATUSES } from "../types";

describe("EscrowStatusBadge", () => {
  it.each(ESCROW_STATUSES)("matches snapshot for %s", (status) => {
    const { asFragment } = render(<EscrowStatusBadge status={status} />);

    expect(asFragment()).toMatchSnapshot();
  });
});

describe("EscrowProgressStepper", () => {
  it.each(ESCROW_STATUSES)("matches snapshot for %s", (status) => {
    const { asFragment } = render(<EscrowProgressStepper status={status} />);

    expect(asFragment()).toMatchSnapshot();
  });
});
