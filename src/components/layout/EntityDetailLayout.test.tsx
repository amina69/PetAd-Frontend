import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EntityDetailLayout } from "./EntityDetailLayout";

describe("EntityDetailLayout", () => {
    const baseProps = {
        title: "Adoption Case #287",
        statusBadge: <span>Open</span>,
        tabs: [
            { label: "Overview", content: <div>Overview content</div> },
            { label: "Timeline", content: <div>Timeline content</div> },
        ],
    };

    it("renders the header title and status badge", () => {
        render(<EntityDetailLayout {...baseProps} />);

        expect(screen.getByText("Adoption Case #287")).toBeInTheDocument();
        expect(screen.getByText("Open")).toBeInTheDocument();
    });

    it("renders first tab content by default", () => {
        render(<EntityDetailLayout {...baseProps} />);

        expect(screen.getByText("Overview content")).toBeInTheDocument();
        expect(screen.queryByText("Timeline content")).not.toBeInTheDocument();
    });

    it("switches content when a different tab is clicked", () => {
        render(<EntityDetailLayout {...baseProps} />);

        fireEvent.click(screen.getByRole("button", { name: "Timeline" }));

        expect(screen.getByText("Timeline content")).toBeInTheDocument();
        expect(screen.queryByText("Overview content")).not.toBeInTheDocument();
    });

    it("renders side panel and applies responsive grid classes", () => {
        render(
            <EntityDetailLayout
                {...baseProps}
                sidePanel={<div>Side details</div>}
            />,
        );

        expect(screen.getByText("Side details")).toBeInTheDocument();
        const gridContainer = screen.getByTestId("entity-detail-grid");
        expect(gridContainer.className).toContain("lg:grid-cols-3");
    });

    it("calls onBack when back button is clicked", () => {
        const onBack = vi.fn();
        render(<EntityDetailLayout {...baseProps} onBack={onBack} />);

        fireEvent.click(screen.getByRole("button", { name: "Go back" }));
        expect(onBack).toHaveBeenCalledTimes(1);
    });
});