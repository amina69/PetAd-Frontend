import path from "node:path";
import { assertBundleHasNoMsw, assertProductionMswDisabled } from "./msw-prod-guard.mjs";

assertProductionMswDisabled("production", process.env.VITE_MSW);
assertBundleHasNoMsw(path.resolve(process.cwd(), "dist"));
console.log("Production bundle does not contain MSW.");
