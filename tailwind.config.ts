/**
 * Colour tokens for PetAd.
 *
 * Tailwind v4 applies colours from `src/index.css` (@theme). This file is the
 * token module the contrast tests and design notes point at. Keep it aligned
 * with `src/lib/colorTokens.ts`.
 */
export {
  WHITE,
  onWhiteTextTokens,
  statusColorTokens,
  yellowBadgeTokens,
} from "./src/lib/colorTokens";

import { statusColorTokens } from "./src/lib/colorTokens";

const config = {
  theme: {
    extend: {
      colors: {
        status: statusColorTokens,
      },
    },
  },
};

export default config;
