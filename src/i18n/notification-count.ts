import { IntlMessageFormat } from "intl-messageformat";
import { localise } from "./index";

const notificationCounts = {
  unread: new IntlMessageFormat("{count, plural, one {# unread} other {# unread}}", "en"),
  total: new IntlMessageFormat("{count, plural, one {# notification} other {# notifications}}", "en"),
};

export function notificationCount(kind: keyof typeof notificationCounts, count: number): string {
  return localise(String(notificationCounts[kind].format({ count })));
}
