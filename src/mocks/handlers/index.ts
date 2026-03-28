import { escrowHandlers } from "./escrow";
import { statusHandlers } from "./status";
import { approvalHandlers } from "./approval";
import { disputeHandlers } from "./dispute";
import { notifyHandlers } from "./notify";
import { filesHandlers } from "./files";
import { adoptionHandlers } from "./adoption";

/**
 * All MSW request handlers, combined from every domain module.
 * Import this array into `browser.ts` and `server.ts`.
 */
export const handlers = [
	...escrowHandlers,
	...statusHandlers,
	...approvalHandlers,
	...disputeHandlers,
	...notifyHandlers,
	...filesHandlers,
	...adoptionHandlers,
];
