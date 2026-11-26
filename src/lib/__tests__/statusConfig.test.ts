import { describe, expect, it } from "vitest";

import {
  APPROVAL_STATUS_ALIASES,
  DISPUTE_STATUS_ALIASES,
  getStatusMeta,
  resolveStatusKey,
  STATUS_COLOR_CLASSES,
  STATUS_CONFIG,
  UNKNOWN_STATUS_META,
  type StatusColorToken,
  type StatusDomain,
  type StatusKey,
} from "../statusConfig";
import { APPROVAL_STATUS_CODES } from "../../types/approval";
import { ADOPTION_STATUSES, CUSTODY_STATUSES } from "../../types/adoption";
import {
  DISPUTE_ESCROW_STATUSES,
  DISPUTE_SLA_STATUSES,
  DISPUTE_STATUS_CODES,
} from "../../types/dispute";
import {
  ESCROW_LIFECYCLE_STATUSES,
  ESCROW_RECORD_STATUSES,
  ESCROW_STATUSES,
} from "../../types/escrow";
import { CUSTODY_STATUSES as CUSTODY_REQUEST_STATUSES } from "../../features/custody/types/custody";

/**
 * Every status of every domain, listed at runtime so the map can be verified
 * to be exhaustive. The compile-time equivalent is the
 * `satisfies Record<StatusKey, StatusMeta>` annotation on `STATUS_CONFIG`.
 */
const DOMAIN_STATUSES: Record<StatusDomain, readonly string[]> = {
  approval: APPROVAL_STATUS_CODES,
  adoption: ADOPTION_STATUSES,
  custody: [...CUSTODY_STATUSES, ...CUSTODY_REQUEST_STATUSES],
  dispute: DISPUTE_STATUS_CODES,
  escrow: [
    ...ESCROW_STATUSES,
    ...ESCROW_LIFECYCLE_STATUSES,
    ...ESCROW_RECORD_STATUSES,
    ...DISPUTE_ESCROW_STATUSES,
  ],
  sla: DISPUTE_SLA_STATUSES,
};

const ALL_KEYS = Object.keys(STATUS_CONFIG) as StatusKey[];

describe("STATUS_CONFIG", () => {
  it("has an entry for every status of every domain", () => {
    for (const [domain, statuses] of Object.entries(DOMAIN_STATUSES)) {
      for (const status of statuses) {
        const key = `${domain}:${status}` as StatusKey;
        expect(ALL_KEYS, `missing entry for ${key}`).toContain(key);
      }
    }
  });

  it("does not contain entries for unknown statuses", () => {
    const expectedKeys = new Set(
      Object.entries(DOMAIN_STATUSES).flatMap(([domain, statuses]) =>
        statuses.map((status) => `${domain}:${status}`),
      ),
    );

    expect([...ALL_KEYS].sort()).toEqual([...expectedKeys].sort());
  });

  it("gives every status a label, description, colour token and icon", () => {
    for (const [key, meta] of Object.entries(STATUS_CONFIG)) {
      expect(meta.label, key).toBeTruthy();
      expect(meta.description, key).toBeTruthy();
      expect(Object.keys(STATUS_COLOR_CLASSES)).toContain(meta.color);
      expect(meta.icon, key).toBeTruthy();
    }
  });

  it("keeps the same status visually identical across domains", () => {
    const completedAdoption = getStatusMeta("adoption", "COMPLETED");
    const completedCustody = getStatusMeta("custody", "COMPLETED");

    expect(completedAdoption.label).toBe(completedCustody.label);
    expect(completedAdoption.color).toBe(completedCustody.color);
    expect(completedAdoption.icon).toBe(completedCustody.icon);
  });

  it("uses the same colour for every disputed status", () => {
    const colors = [
      getStatusMeta("adoption", "DISPUTED").color,
      getStatusMeta("custody", "DISPUTED").color,
      getStatusMeta("escrow", "DISPUTED").color,
    ];

    expect(new Set(colors).size).toBe(1);
  });

  it("only pulses the statuses that need attention", () => {
    const pulsing = ALL_KEYS.filter(
      (key) => "pulse" in STATUS_CONFIG[key] && STATUS_CONFIG[key].pulse,
    );

    expect(pulsing).toEqual(["dispute:SLA_BREACHED", "sla:BREACHED"]);
  });
});

describe("getStatusMeta", () => {
  it("resolves a configured status", () => {
    const meta = getStatusMeta("adoption", "COMPLETED");

    expect(meta.label).toBe("Completed");
    expect(meta.color).toBe("green");
  });

  it("falls back to the unknown status meta", () => {
    expect(getStatusMeta("adoption", "NOPE")).toBe(UNKNOWN_STATUS_META);
    expect(getStatusMeta("nope" as StatusDomain, "NOPE")).toBe(UNKNOWN_STATUS_META);
  });

  it("resolves the legacy lowercase codes to the same entry", () => {
    for (const [legacy, canonical] of Object.entries(APPROVAL_STATUS_ALIASES)) {
      expect(getStatusMeta("approval", legacy)).toEqual(
        getStatusMeta("approval", canonical),
      );
    }

    for (const [legacy, canonical] of Object.entries(DISPUTE_STATUS_ALIASES)) {
      expect(getStatusMeta("dispute", legacy)).toEqual(
        getStatusMeta("dispute", canonical),
      );
    }
  });
});

describe("resolveStatusKey", () => {
  it("returns the direct key for a known status", () => {
    expect(resolveStatusKey("custody", "ACTIVE")).toBe("custody:ACTIVE");
  });

  it("returns the aliased key for a legacy status", () => {
    expect(resolveStatusKey("approval", "pending")).toBe("approval:PENDING");
    expect(resolveStatusKey("dispute", "under_review")).toBe(
      "dispute:UNDER_REVIEW",
    );
  });

  it("returns null for an unknown status", () => {
    expect(resolveStatusKey("adoption", "WHATEVER")).toBeNull();
  });
});

describe("STATUS_COLOR_CLASSES", () => {
  it("covers every colour token", () => {
    const tokens: StatusColorToken[] = [
      "gray",
      "blue",
      "teal",
      "green",
      "amber",
      "red",
    ];

    expect(Object.keys(STATUS_COLOR_CLASSES).sort()).toEqual(
      [...tokens].sort(),
    );
  });
});
