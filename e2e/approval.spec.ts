import { expect, test } from "@playwright/test";

/**
 * Approval flow E2E.
 *
 * Covers four scenarios against the mocked approval API:
 *  1. Approve a pending request (200)
 *  2. Reject with a short reason — blocked by validation (< 20 chars)
 *  3. Reject with a valid reason (≥ 20 chars) — 200
 *  4. Approve an already-decided request — 409 Conflict
 *
 * MSW is enabled for the E2E web server (VITE_MSW=true). We intercept the
 * approval mutation endpoints with page.route() so no real backend is needed.
 */
test.describe("Approval flow E2E", () => {
  const APPROVE_URL = "**/api/approvals/*/approve";
  const REJECT_URL = "**/api/approvals/*/reject";

  test("approve a pending request", async ({ page }) => {
    let approveBody: string | undefined;

    await page.route(APPROVE_URL, async (route) => {
      approveBody = route.request().postData();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "app-1",
          status: "APPROVED",
          approverName: "Dr. Sarah Lee",
          approverRole: "Veterinary Inspector",
          timestamp: "2026-01-01T00:00:00.000Z",
        }),
      });
    });

    await page.goto("/admin/approvals");

    const res = await page.evaluate(async () => {
      const r = await fetch("/api/approvals/app-1/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return { status: r.status, body: await r.json() };
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("APPROVED");
    expect(approveBody).toBeNull();
  });

  test("reject with a short reason is blocked", async ({ page }) => {
    await page.route(REJECT_URL, async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Please provide at least 20 characters explaining the rejection",
        }),
      });
    });

    await page.goto("/admin/approvals");

    const res = await page.evaluate(async () => {
      const r = await fetch("/api/approvals/app-1/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "too short" }),
      });
      return { status: r.status, body: await r.json().catch(() => null) };
    });

    expect(res.status).toBe(400);
    expect(res.body?.message).toContain("20 characters");
  });

  test("reject with a valid reason succeeds", async ({ page }) => {
    const validReason =
      "The applicant did not provide the required vaccination records in time.";
    let rejectBody: string | undefined;

    await page.route(REJECT_URL, async (route) => {
      rejectBody = route.request().postData();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "app-1",
          status: "REJECTED",
          reason: validReason,
          approverName: "Mark Evans",
          approverRole: "Welfare Officer",
          timestamp: "2026-01-02T00:00:00.000Z",
        }),
      });
    });

    await page.goto("/admin/approvals");

    const res = await page.evaluate(async (reason) => {
      const r = await fetch("/api/approvals/app-1/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      return { status: r.status, body: await r.json() };
    }, validReason);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("REJECTED");
    expect(res.body.reason).toBe(validReason);
    expect(rejectBody).toContain(validReason);
  });

  test("approving an already-decided request returns 409 conflict", async ({
    page,
  }) => {
    await page.route(APPROVE_URL, async (route) => {
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Conflict: approval request has already been decided",
          code: "APPROVAL_ALREADY_DECIDED",
        }),
      });
    });

    await page.goto("/admin/approvals");

    const res = await page.evaluate(async () => {
      const r = await fetch("/api/approvals/app-2/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return { status: r.status, body: await r.json().catch(() => null) };
    });

    expect(res.status).toBe(409);
    expect(res.body?.code).toBe("APPROVAL_ALREADY_DECIDED");
  });
});
