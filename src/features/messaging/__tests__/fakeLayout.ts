/**
 * jsdom has no layout engine. This installs a deterministic fake so scroll
 * behaviour can be asserted: every child of an element is ROW px tall,
 * `scrollHeight` is the sum, `clientHeight` is VIEWPORT, and `scrollTop` is a
 * plain settable number.
 */
export const ROW = 100;
export const VIEWPORT = 300;

const scrollTops = new WeakMap<Element, number>();

export function installFakeLayout(): () => void {
  const proto = HTMLElement.prototype;
  const originals = {
    offsetTop: Object.getOwnPropertyDescriptor(proto, "offsetTop"),
    scrollHeight: Object.getOwnPropertyDescriptor(Element.prototype, "scrollHeight"),
    clientHeight: Object.getOwnPropertyDescriptor(Element.prototype, "clientHeight"),
    scrollTop: Object.getOwnPropertyDescriptor(Element.prototype, "scrollTop"),
  };

  Object.defineProperty(proto, "offsetTop", {
    configurable: true,
    get(this: HTMLElement) {
      return this.parentElement ? Array.from(this.parentElement.children).indexOf(this) * ROW : 0;
    },
  });
  Object.defineProperty(Element.prototype, "scrollHeight", {
    configurable: true,
    get(this: Element) {
      return this.getAttribute("role") === "log" ? this.children.length * ROW : 0;
    },
  });
  Object.defineProperty(Element.prototype, "clientHeight", {
    configurable: true,
    get(this: Element) {
      return this.getAttribute("role") === "log" ? VIEWPORT : 0;
    },
  });
  Object.defineProperty(Element.prototype, "scrollTop", {
    configurable: true,
    get(this: Element) {
      return scrollTops.get(this) ?? 0;
    },
    set(this: Element, value: number) {
      scrollTops.set(this, value);
    },
  });

  return () => {
    for (const [name, target] of [
      ["offsetTop", proto],
      ["scrollHeight", Element.prototype],
      ["clientHeight", Element.prototype],
      ["scrollTop", Element.prototype],
    ] as const) {
      const original = originals[name];
      if (original) Object.defineProperty(target, name, original);
      else delete (target as unknown as Record<string, unknown>)[name];
    }
  };
}
