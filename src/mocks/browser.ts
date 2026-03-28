import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// Browser MSW worker — started in main.tsx when VITE_MSW=true.
export const worker = setupWorker(...handlers);

