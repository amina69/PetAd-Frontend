import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Avatar, getAvatarInitials } from "../Avatar";
import { Badge } from "../Badge";
import { Chip } from "../Chip";
import { Card, CardBody, CardFooter, CardHeader, CardMedia } from "../Card";
import { StatusBadge } from "../StatusBadge";

describe("Avatar", () => {
  it("computes initials from multi-word, single-word, and empty names", () => {
    expect(getAvatarInitials("Amina Sheriff")).toBe("AS");
    expect(getAvatarInitials("Dr. Jane Mary Doe")).toBe("DD");
    expect(getAvatarInitials("Buddy")).toBe("BU");
    expect(getAvatarInitials("A")).toBe("A");
    expect(getAvatarInitials("   ")).toBe("?");
    expect(getAvatarInitials(undefined)).toBe("?");
  });

  it("renders initials immediately when src is absent", () => {
    render(<Avatar name="Amina Sheriff" size="lg" />);

    const avatar = screen.getByRole("img", { name: "Amina Sheriff" });
    expect(avatar).toHaveTextContent("AS");
    expect(avatar).toHaveAttribute("data-size", "lg");
    expect(avatar).toHaveAttribute("data-fallback", "true");
    expect(avatar.style.width).toBe("48px");
    expect(avatar.style.height).toBe("48px");
  });

  it("falls back to initials when an image fails to load without layout shift", () => {
    const { container } = render(
      <Avatar src="https://example.invalid/broken.png" name="Luna Cat" size="md" />,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.width).toBe("40px");
    expect(wrapper.style.height).toBe("40px");
    expect(wrapper).toHaveAttribute("data-fallback", "false");

    const img = screen.getByRole("img", { name: "Luna Cat" });
    expect(img.tagName).toBe("IMG");
    expect(img).toHaveAttribute("width", "40");
    expect(img).toHaveAttribute("height", "40");

    fireEvent.error(img);

    expect(container.querySelector("img")).toBeNull();
    expect(wrapper).toHaveAttribute("data-fallback", "true");
    expect(wrapper).toHaveTextContent("LC");
    // Exact same container dimensions before and after error -> zero layout shift.
    expect(wrapper.style.width).toBe("40px");
    expect(wrapper.style.height).toBe("40px");
  });

  it("resets fallback state when src changes to a new image URL", () => {
    const { rerender } = render(
      <Avatar src="https://example.invalid/broken-1.png" name="Milo Dog" />,
    );

    fireEvent.error(screen.getByRole("img", { name: "Milo Dog" }));
    expect(screen.getByRole("img", { name: "Milo Dog" })).toHaveTextContent("MD");

    rerender(<Avatar src="https://example.invalid/valid-2.png" name="Milo Dog" />);
    const nextImg = screen.getByRole("img", { name: "Milo Dog" });
    expect(nextImg.tagName).toBe("IMG");
    expect(nextImg).toHaveAttribute("src", "https://example.invalid/valid-2.png");
  });
});

describe("Badge", () => {
  it("renders tone, size, icon, and pulse variants", () => {
    render(
      <Badge tone="teal" size="sm" pulse icon={<span data-testid="badge-icon">*</span>}>
        Verified
      </Badge>,
    );

    const text = screen.getByText("Verified");
    expect(text.className).toContain("status-badge");
    expect(text.className).toContain("status-badge--teal");
    expect(text.className).toContain("status-badge--pulse");
    expect(screen.getByTestId("badge-icon")).toBeInTheDocument();
  });

  it("powers StatusBadge with identical semantics", () => {
    render(<StatusBadge color="green" label="Approved" tooltip="Request approved" />);
    const pill = screen.getByText("Approved").closest(".status-badge");
    expect(pill).toHaveClass("status-badge--green");
    expect(screen.getByText("Request approved")).toBeInTheDocument();
  });
});

describe("Chip", () => {
  it("renders a removable chip with a default accessible remove label", () => {
    const onRemove = vi.fn();
    render(<Chip onRemove={onRemove}>Dogs</Chip>);

    const removeBtn = screen.getByRole("button", { name: "Remove Dogs" });
    fireEvent.click(removeBtn);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("supports custom removeLabel, selection toggle, and disabled state", () => {
    const onClick = vi.fn();
    const onRemove = vi.fn();
    const { rerender } = render(
      <Chip tone="blue" selected onClick={onClick} onRemove={onRemove} removeLabel="Clear filter">
        Vaccinated
      </Chip>,
    );

    const toggleBtn = screen.getByRole("button", { name: "Vaccinated" });
    expect(toggleBtn).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(toggleBtn);
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Clear filter" }));
    expect(onRemove).toHaveBeenCalledTimes(1);

    rerender(
      <Chip disabled onClick={onClick} onRemove={onRemove} removeLabel="Clear filter">
        Vaccinated
      </Chip>,
    );
    expect(screen.getByRole("button", { name: "Vaccinated" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Clear filter" })).toBeDisabled();
  });
});

describe("Card", () => {
  it("renders header, media, body, and footer slots via compound and named exports", () => {
    const { container } = render(
      <Card as="article" variant="elevated" interactive>
        <Card.Header>
          <h2>Bella</h2>
        </Card.Header>
        <Card.Media>
          <img src="/bella.jpg" alt="Bella" />
        </Card.Media>
        <Card.Body>
          <p>Friendly golden retriever</p>
        </Card.Body>
        <Card.Footer>
          <span>2 years old</span>
        </Card.Footer>
      </Card>,
    );

    const article = container.querySelector("article[data-slot='card']");
    expect(article).toBeTruthy();
    expect(article?.querySelector("[data-slot='card-header']")).toHaveTextContent("Bella");
    expect(article?.querySelector("[data-slot='card-media'] img")).toHaveAttribute(
      "src",
      "/bella.jpg",
    );
    expect(article?.querySelector("[data-slot='card-body']")).toHaveTextContent(
      "Friendly golden retriever",
    );
    expect(article?.querySelector("[data-slot='card-footer']")).toHaveTextContent("2 years old");
  });

  it("supports standalone named slot exports", () => {
    render(
      <Card variant="subtle">
        <CardHeader>Header</CardHeader>
        <CardMedia>Media</CardMedia>
        <CardBody>Body</CardBody>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );

    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Media")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });
});
