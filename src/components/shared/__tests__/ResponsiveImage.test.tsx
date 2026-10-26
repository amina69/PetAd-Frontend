import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResponsiveImage } from "../ResponsiveImage";

describe("ResponsiveImage", () => {
  it("lazy-loads with explicit dimensions by default", () => {
    render(<ResponsiveImage src="/a.jpg" alt="Rex" width={400} height={300} />);
    const img = screen.getByAltText("Rex");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("width", "400");
    expect(img).toHaveAttribute("height", "300");
  });

  it("loads eagerly with high priority when `priority` is set", () => {
    render(<ResponsiveImage src="/a.jpg" alt="Rex" width={400} height={300} priority />);
    const img = screen.getByAltText("Rex");
    expect(img).toHaveAttribute("loading", "eager");
    expect(img).toHaveAttribute("fetchpriority", "high");
  });

  it("passes srcSet and sizes through", () => {
    render(
      <ResponsiveImage
        src="/a.jpg"
        alt="Rex"
        width={400}
        height={300}
        srcSet="/a-400.jpg 400w, /a-800.jpg 800w"
        sizes="50vw"
      />,
    );
    const img = screen.getByAltText("Rex");
    expect(img).toHaveAttribute("srcset", "/a-400.jpg 400w, /a-800.jpg 800w");
    expect(img).toHaveAttribute("sizes", "50vw");
  });

  it("shows a placeholder until loaded, then reveals the image", () => {
    render(<ResponsiveImage src="/a.jpg" alt="Rex" width={400} height={300} />);
    const img = screen.getByAltText("Rex");
    expect(img).toHaveAttribute("data-loaded", "false");
    fireEvent.load(img);
    expect(img).toHaveAttribute("data-loaded", "true");
  });

  it("falls back to the provided image on error and drops srcset", () => {
    render(
      <ResponsiveImage
        src="/broken.jpg"
        alt="Rex"
        width={400}
        height={300}
        srcSet="/broken.jpg 400w"
        fallbackSrc="/fallback.png"
      />,
    );
    const img = screen.getByAltText("Rex");
    fireEvent.error(img);
    expect(img).toHaveAttribute("src", "/fallback.png");
    expect(img).not.toHaveAttribute("srcset");
    expect(img).toHaveAttribute("data-loaded", "true");
  });

  it("resets state when src changes", () => {
    const { rerender } = render(<ResponsiveImage src="/a.jpg" alt="Rex" width={4} height={3} />);
    fireEvent.error(screen.getByAltText("Rex"));
    rerender(<ResponsiveImage src="/b.jpg" alt="Rex" width={4} height={3} />);
    expect(screen.getByAltText("Rex")).toHaveAttribute("src", "/b.jpg");
  });
});
