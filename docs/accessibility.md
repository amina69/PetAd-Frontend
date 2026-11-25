# Accessibility testing

Run these checks from the repository root before opening a pull request:

```bash
npm ci
npm run lint
npm test
npm run build
npm run e2e
npm run build-storybook
npm run test:pwa
```

`npm run lint` catches invalid JSX and common accessibility mistakes enforced by
the configured ESLint rules. The unit and end-to-end suites cover component
behavior and keyboard flows; the production build confirms that the checked
routes compile as shipped.

The Storybook primitives are checked with the a11y addon and include 375px,
768px, and 1280px viewport presets. `npm run test:pwa` builds and previews the
production app before verifying authenticated API responses never enter Cache
Storage.

Run `npm run storybook` to start the interactive component workbench locally.

## Manual keyboard and screen-reader checklist

Copy this checklist into the pull request description and record the routes and
components exercised:

```text
Routes/components tested:
- [ ] Route or component: ______________________________

Keyboard
- [ ] Every interactive control is reachable with Tab.
- [ ] Shift+Tab moves focus backwards in the expected order.
- [ ] Enter or Space activates buttons, links, and custom controls.
- [ ] Escape closes dismissible dialogs, menus, and popovers.
- [ ] Focus is visible at every step.
- [ ] Opening a dialog moves focus into it and closing it returns focus to the trigger.
- [ ] Focus cannot escape an open modal or menu.

Screen reader
- [ ] Every form control has a useful accessible name and label.
- [ ] Headings and landmarks describe the page structure.
- [ ] Dialogs announce their title and modal state.
- [ ] Validation errors and asynchronous updates are announced without stealing focus.
- [ ] Decorative icons are hidden from the accessibility tree.

Visual and input checks
- [ ] Text, controls, and focus indicators remain readable at the supported contrast.
- [ ] The flow remains usable at 200% zoom.
- [ ] No information depends on color alone.

Screen reader/browser used: ___________________________
Result and follow-up notes: ___________________________
```

When a check fails, include the route, the focused element or announcement
that failed, reproduction steps, and a screenshot or screen recording when it
helps explain the problem.
