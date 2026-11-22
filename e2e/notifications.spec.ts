import { expect, test, type Page } from "@playwright/test";

/**
 * C30. Live notifications from the MSW real-time mock.
 *
 * With `VITE_MSW=true` the mock pushes a sample notification over the
 * notifications WebSocket on an interval. These specs assert the toast and the
 * navbar badge update without `page.reload()`, and that events emitted while
 * the socket was down are backfilled after it reconnects.
 *
 * @see https://github.com/amina69/PetAd-Frontend/issues/625
 */

type MockControls = {
  emit: (overrides?: { title?: string; message?: string }) => unknown;
  pause: () => void;
  resume: () => void;
  dropConnections: () => void;
};

declare global {
  interface Window {
    __petadMockNotifications?: MockControls;
  }
}

/** Matches the message of any sample event the mock stream emits. */
const LIVE_EVENT_MESSAGE =
  /is waiting for your review|has been funded|was raised on one|completed successfully|expires in 7 days|ends in 2 days/;

const badge = (page: Page) => page.getByTestId("notification-unread-count");

async function readBadge(page: Page): Promise<number> {
  await expect(badge(page)).toBeVisible({ timeout: 15_000 });
  return Number(await badge(page).textContent());
}

test.describe("Real-time notifications (MSW)", () => {
  test("a pushed notification shows a toast and bumps the badge without a reload", async ({
    page,
  }) => {
    // Speed the stream up for the test; the real default is 15s.
    await page.addInitScript(() => {
      localStorage.setItem("petad:msw:notify-interval-ms", "1500");
    });

    await page.goto("/home");
    const before = await readBadge(page);
    // Survives only as long as the document does, so it proves no reload.
    await page.evaluate(() => {
      (window as Window & { __sameDocument?: boolean }).__sameDocument = true;
    });

    // No manual trigger: the stream emits on its own.
    await expect(page.getByText(LIVE_EVENT_MESSAGE).first()).toBeVisible({ timeout: 10_000 });
    await expect
      .poll(() => readBadge(page), { timeout: 10_000 })
      .toBeGreaterThan(before);
    expect(
      await page.evaluate(
        () => (window as Window & { __sameDocument?: boolean }).__sameDocument,
      ),
    ).toBe(true);
  });

  test("events missed while disconnected are backfilled after reconnect", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("petad:msw:notify-paused", "true");
    });

    await page.goto("/home");
    const before = await readBadge(page);
    await page.waitForFunction(() => Boolean(window.__petadMockNotifications));

    await page.evaluate(() => {
      const controls = window.__petadMockNotifications!;
      controls.dropConnections();
      controls.emit({ title: "Missed while offline", message: "Backfilled event" });
    });

    // The client reconnects with backoff and refetches; no reload involved.
    await expect
      .poll(() => readBadge(page), { timeout: 15_000 })
      .toBe(before + 1);
    // It was never delivered live, so no toast for it.
    await expect(page.getByText("Backfilled event")).toHaveCount(0);
  });
});
