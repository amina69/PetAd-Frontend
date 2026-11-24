import { expect, test } from "@playwright/test";

test("authenticated API responses are never stored in Cache Storage", async ({
  page,
}) => {
  await page.route("**/api/private-data", async (route) => {
    expect(route.request().headers().authorization).toBe(
      "Bearer pwa-cache-test-token",
    );
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ private: true }),
    });
  });

  await page.goto("/");
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  const response = await page.evaluate(async () => {
    const result = await fetch("/api/private-data", {
      headers: { Authorization: "Bearer pwa-cache-test-token" },
    });
    return {
      status: result.status,
      body: (await result.json()) as { private: boolean },
    };
  });

  expect(response).toEqual({ status: 200, body: { private: true } });

  const cachedPaths = await page.evaluate(async () => {
    const cacheNames = await caches.keys();
    const requests = await Promise.all(
      cacheNames.map(async (name) => (await caches.open(name)).keys()),
    );
    return requests.flat().map((request) => new URL(request.url).pathname);
  });

  expect(cachedPaths).not.toContain("/api/private-data");
});
