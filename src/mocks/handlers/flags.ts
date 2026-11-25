import { http, HttpResponse } from "msw";

export const flagHandlers = [
  http.get("/api/flags", () => HttpResponse.json({})),
];
