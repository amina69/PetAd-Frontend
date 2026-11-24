import { http, HttpResponse } from "msw";

/**
 * In-memory language preference used by the dev MSW worker and unit tests.
 * Mirrors `GET/PATCH /api/users/me/preferences`.
 */
let language: string | null = null;

export const preferencesHandlers = [
  http.get("*/api/users/me/preferences", () =>
    HttpResponse.json({ language }),
  ),
  http.patch("*/api/users/me/preferences", async ({ request }) => {
    const body = (await request.json()) as { language?: unknown };
    language = typeof body.language === "string" ? body.language : null;
    return HttpResponse.json({ language });
  }),
];

/** Test helper: restore the initial "no preference stored" state. */
export function resetMockLanguagePreference() {
  language = null;
}
