import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SplitOutcomeChart } from "../SplitOutcomeChart";
import type { DistributionItem } from "../SplitOutcomeChart";

describe("SplitOutcomeChart", () => {
  const mockDistribution: DistributionItem[] = [
    { recipient: "Shelter", amount: "60.00", percentage: 60 },
    { recipient: "Adopter", amount: "30.00", percentage: 30 },
    { recipient: "Platform", amount: "10.00", percentage: 10 },
  ];

  it("renders the chart container", () => {
    render(<SplitOutcomeChart distribution={mockDistribution} />);
    expect(screen.getByTestId("split-outcome-chart")).toBeInTheDocument();
  });

  it("renders correct number of chart segments", () => {
    render(<SplitOutcomeChart distribution={mockDistribution} />);
    
    expect(screen.getByTestId("chart-segment-shelter")).toBeInTheDocument();
    expect(screen.getByTestId("chart-segment-adopter")).toBeInTheDocument();
    expect(screen.getByTestId("chart-segment-platform")).toBeInTheDocument();
  });

  it("renders legend items with correct labels", () => {
    render(<SplitOutcomeChart distribution={mockDistribution} />);
    
    expect(screen.getByTestId("legend-item-shelter")).toBeInTheDocument();
    expect(screen.getByTestId("legend-item-adopter")).toBeInTheDocument();
    expect(screen.getByTestId("legend-item-platform")).toBeInTheDocument();
    
    expect(screen.getByText(/Shelter: 60.00 USDC \(60%\)/)).toBeInTheDocument();
    expect(screen.getByText(/Adopter: 30.00 USDC \(30%\)/)).toBeInTheDocument();
    expect(screen.getByText(/Platform: 10.00 USDC \(10%\)/)).toBeInTheDocument();
  });

  it("renders correct total amount", () => {
    render(<SplitOutcomeChart distribution={mockDistribution} />);
    
    const totalElement = screen.getByTestId("chart-total");
    expect(totalElement).toHaveTextContent("Total: 100.00 USDC");
  });

  it("renders with correct semantic colors", () => {
    const { container } = render(<SplitOutcomeChart distribution={mockDistribution} />);
    
    const shelterSegment = screen.getByTestId("chart-segment-shelter");
    const adopterSegment = screen.getByTestId("chart-segment-adopter");
    const platformSegment = screen.getByTestId("chart-segment-platform");
    
    // Teal for Shelter (#008080)
    expect(shelterSegment).toHaveStyle("background-color: rgb(0, 128, 128)");
    // Blue for Adopter (#3b82f6)
    expect(adopterSegment).toHaveStyle("background-color: rgb(59, 130, 246)");
    // Gray for Platform (#6b7280)
    expect(platformSegment).toHaveStyle("background-color: rgb(107, 114, 128)");
  });

  it("has correct aria-labels on segments", () => {
    render(<SplitOutcomeChart distribution={mockDistribution} />);
    
    const shelterSegment = screen.getByTestId("chart-segment-shelter");
    expect(shelterSegment).toHaveAttribute("aria-label", "Shelter: 60%, 60.00");
    
    const adopterSegment = screen.getByTestId("chart-segment-adopter");
    expect(adopterSegment).toHaveAttribute("aria-label", "Adopter: 30%, 30.00");
    
    const platformSegment = screen.getByTestId("chart-segment-platform");
    expect(platformSegment).toHaveAttribute("aria-label", "Platform: 10%, 10.00");
  });

  it("renders with flex basis equal to percentage", () => {
    render(<SplitOutcomeChart distribution={mockDistribution} />);
    
    const shelterSegment = screen.getByTestId("chart-segment-shelter");
    expect(shelterSegment).toHaveStyle("flex-basis: 60%");
    
    const adopterSegment = screen.getByTestId("chart-segment-adopter");
    expect(adopterSegment).toHaveStyle("flex-basis: 30%");
    
    const platformSegment = screen.getByTestId("chart-segment-platform");
    expect(platformSegment).toHaveStyle("flex-basis: 10%");
  });

  it("handles custom recipient names", () => {
    const customDistribution: DistributionItem[] = [
      { recipient: "CustomOrg", amount: "50.00", percentage: 50 },
      { recipient: "AnotherOrg", amount: "50.00", percentage: 50 },
    ];
    
    render(<SplitOutcomeChart distribution={customDistribution} />);
    
    expect(screen.getByTestId("chart-segment-customorg")).toBeInTheDocument();
    expect(screen.getByTestId("chart-segment-anotherorg")).toBeInTheDocument();
  });

  it("handles empty distribution", () => {
    render(<SplitOutcomeChart distribution={[]} />);
    
    expect(screen.getByTestId("split-outcome-chart")).toBeInTheDocument();
    expect(screen.getByTestId("chart-total")).toHaveTextContent("Total: 0.00 USDC");
  });

  it("handles zero percentages", () => {
    const zeroDistribution: DistributionItem[] = [
      { recipient: "Shelter", amount: "0.00", percentage: 0 },
      { recipient: "Adopter", amount: "100.00", percentage: 100 },
    ];
    
    render(<SplitOutcomeChart distribution={zeroDistribution} />);
    
    const shelterSegment = screen.getByTestId("chart-segment-shelter");
    expect(shelterSegment).toHaveStyle("flex-basis: 0%");
    expect(shelterSegment).toHaveStyle("min-width: 0");
  });
});