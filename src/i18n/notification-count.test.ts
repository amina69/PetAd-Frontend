import { expect, it } from "vitest";
import { notificationCount } from "./notification-count";

it("formats count messages with ICU plural rules", () => {
  expect(notificationCount("total", 1)).toBe("1 notification");
  expect(notificationCount("total", 3)).toBe("3 notifications");
  expect(notificationCount("unread", 1)).toBe("1 unread");
  expect(notificationCount("unread", 3)).toBe("3 unread");
});
