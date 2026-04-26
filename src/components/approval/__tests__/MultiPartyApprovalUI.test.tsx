import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MultiPartyApprovalUI } from "../MultiPartyApprovalUI";
import type { ApprovalDecision } from "../../../types/adoption";

describe("MultiPartyApprovalUI", () => {
  const mockRequired = ["Shelter", "Admin", "Veterinary Inspector"];
  
  const mockGiven: ApprovalDecision[] = [
    {
      id: "dec-1",
      approverName: "Happy Paws Shelter",
      approverRole: "Shelter",
      status: "APPROVED",
      timestamp: new Date().toISOString(),
    },
    {
      id: "dec-2",
      approverName: "Dr. Smith",
      approverRole: "Veterinary Inspector",
      status: "REJECTED",
      timestamp: new Date().toISOString(),
    }
  ];

  const mockPending = ["Admin"];

  it("renders all required roles", () => {
    render(
      <MultiPartyApprovalUI 
        required={mockRequired} 
        given={mockGiven} 
        pending={mockPending} 
      />
    );

    expect(screen.getByText("Shelter")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Veterinary Inspector")).toBeInTheDocument();
  });

  it("renders the 'Approved' state correctly", () => {
    render(
      <MultiPartyApprovalUI 
        required={mockRequired} 
        given={mockGiven} 
        pending={mockPending} 
      />
    );

    const shelterRow = screen.getByLabelText("Approval status for Shelter");
    expect(shelterRow).toHaveTextContent("Approved");
    expect(shelterRow).toHaveTextContent("Happy Paws Shelter");
  });

  it("renders the 'Rejected' state correctly", () => {
    render(
      <MultiPartyApprovalUI 
        required={mockRequired} 
        given={mockGiven} 
        pending={mockPending} 
      />
    );

    const vetRow = screen.getByLabelText("Approval status for Veterinary Inspector");
    expect(vetRow).toHaveTextContent("Rejected");
    expect(vetRow).toHaveTextContent("Dr. Smith");
  });

  it("renders the 'Pending' state correctly", () => {
    render(
      <MultiPartyApprovalUI 
        required={mockRequired} 
        given={mockGiven} 
        pending={mockPending} 
      />
    );

    const adminRow = screen.getByLabelText("Approval status for Admin");
    expect(adminRow).toHaveTextContent("Pending");
    expect(adminRow).toHaveTextContent("Awaiting decision");
  });

  it("has correct accessibility attributes", () => {
    render(
      <MultiPartyApprovalUI 
        required={mockRequired} 
        given={mockGiven} 
        pending={mockPending} 
      />
    );

    mockRequired.forEach(role => {
      expect(screen.getByLabelText(`Approval status for ${role}`)).toBeInTheDocument();
    });
  });
});
