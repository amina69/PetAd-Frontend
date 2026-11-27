/**
 * Shared overlay bookkeeping for floating UI and dialogs.
 *
 * Only the most recently opened layer reacts to Escape, which gives nested
 * dialogs and menus the expected "innermost closes first" behaviour. The same
 * module reference-counts body scroll locking so nested modals do not restore
 * scrolling while an outer modal is still open.
 */

const openLayers: string[] = [];
let scrollLockCount = 0;
let previousBodyOverflow = "";

/** Marks a layer as open. Calling it twice with the same id is a no-op. */
export function registerLayer(id: string): void {
  if (!openLayers.includes(id)) {
    openLayers.push(id);
  }
}

/** Marks a layer as closed. Unknown ids are ignored. */
export function unregisterLayer(id: string): void {
  const index = openLayers.lastIndexOf(id);

  if (index !== -1) {
    openLayers.splice(index, 1);
  }
}

/** True when `id` is the most recently registered, still-open layer. */
export function isTopLayer(id: string): boolean {
  return openLayers[openLayers.length - 1] === id;
}

/** Freezes background scrolling; reference-counted across nested layers. */
export function lockBodyScroll(): void {
  if (typeof document === "undefined") {
    return;
  }

  if (scrollLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }

  scrollLockCount += 1;
}

/** Releases a scroll lock. Restores the previous value when the last layer closes. */
export function unlockBodyScroll(): void {
  if (typeof document === "undefined") {
    return;
  }

  scrollLockCount = Math.max(0, scrollLockCount - 1);

  if (scrollLockCount === 0) {
    document.body.style.overflow = previousBodyOverflow;
  }
}
