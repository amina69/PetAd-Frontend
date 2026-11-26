import { describe, it, expect, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDocumentMeta } from "../useDocumentMeta";

describe("useDocumentMeta", () => {
  const originalTitle = document.title;

  afterEach(() => {
    document.title = originalTitle;
    // Remove any injected tags
    document
      .querySelectorAll("meta[property^='og:'], meta[name^='twitter:'], meta[name='description'], link[rel='canonical']")
      .forEach((el) => el.remove());
  });

  it("sets document.title", () => {
    renderHook(() =>
      useDocumentMeta({ title: "Luna — German Shepherd | PetAd" }),
    );
    expect(document.title).toBe("Luna — German Shepherd | PetAd");
  });

  it("restores document.title on unmount", () => {
    const prev = "Original Title";
    document.title = prev;
    const { unmount } = renderHook(() =>
      useDocumentMeta({ title: "New Title" }),
    );
    expect(document.title).toBe("New Title");
    unmount();
    expect(document.title).toBe(prev);
  });

  it("sets og:title meta tag", () => {
    renderHook(() =>
      useDocumentMeta({ title: "Max for Adoption | PetAd" }),
    );
    const el = document.querySelector<HTMLMetaElement>("meta[property='og:title']");
    expect(el?.getAttribute("content")).toBe("Max for Adoption | PetAd");
  });

  it("sets og:type to 'website' by default", () => {
    renderHook(() => useDocumentMeta({ title: "PetAd" }));
    const el = document.querySelector<HTMLMetaElement>("meta[property='og:type']");
    expect(el?.getAttribute("content")).toBe("website");
  });

  it("sets og:type to the provided value", () => {
    renderHook(() => useDocumentMeta({ title: "PetAd", ogType: "article" }));
    const el = document.querySelector<HTMLMetaElement>("meta[property='og:type']");
    expect(el?.getAttribute("content")).toBe("article");
  });

  it("sets description meta when provided", () => {
    renderHook(() =>
      useDocumentMeta({ title: "PetAd", description: "Find your perfect pet." }),
    );
    const el = document.querySelector<HTMLMetaElement>("meta[name='description']");
    expect(el?.getAttribute("content")).toBe("Find your perfect pet.");
  });

  it("sets twitter:card to summary_large_image", () => {
    renderHook(() => useDocumentMeta({ title: "PetAd" }));
    const el = document.querySelector<HTMLMetaElement>("meta[name='twitter:card']");
    expect(el?.getAttribute("content")).toBe("summary_large_image");
  });

  it("sets og:image and twitter:image when ogImage is provided", () => {
    renderHook(() =>
      useDocumentMeta({ title: "PetAd", ogImage: "https://cdn.petad.com/luna.jpg" }),
    );
    const ogImage = document.querySelector<HTMLMetaElement>("meta[property='og:image']");
    const twitterImage = document.querySelector<HTMLMetaElement>("meta[name='twitter:image']");
    expect(ogImage?.getAttribute("content")).toBe("https://cdn.petad.com/luna.jpg");
    expect(twitterImage?.getAttribute("content")).toBe("https://cdn.petad.com/luna.jpg");
  });

  it("sets canonical link when canonical is provided", () => {
    renderHook(() =>
      useDocumentMeta({ title: "PetAd", canonical: "https://petad.com/listings/1" }),
    );
    const el = document.querySelector<HTMLLinkElement>("link[rel='canonical']");
    expect(el?.getAttribute("href")).toBe("https://petad.com/listings/1");
  });

  it("does not set og:image when ogImage is omitted", () => {
    renderHook(() => useDocumentMeta({ title: "PetAd" }));
    expect(document.querySelector("meta[property='og:image']")).toBeNull();
  });
});
