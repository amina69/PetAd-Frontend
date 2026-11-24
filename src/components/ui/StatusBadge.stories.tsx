import { useEffect, useState } from "react";
import { http, HttpResponse } from "msw";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusBadge } from "./StatusBadge";

const meta = {
  title: "Primitives/StatusBadge",
  component: StatusBadge,
  args: { color: "green", label: "Approved" },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllColors: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <StatusBadge color="gray" label="Draft" />
      <StatusBadge color="blue" label="In review" />
      <StatusBadge color="teal" label="Scheduled" />
      <StatusBadge color="green" label="Approved" />
      <StatusBadge color="amber" label="Pending" />
      <StatusBadge color="red" label="Rejected" />
    </div>
  ),
};

export const WithTooltipAndPulse: Story = {
  args: {
    color: "amber",
    label: "Action needed",
    tooltip: "This item needs your attention.",
    pulse: true,
  },
};

function PetStatusFromApi() {
  const [status, setStatus] = useState<string>();

  useEffect(() => {
    fetch("/api/storybook/pet-status")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load pet status.");
        return response.json() as Promise<{ status: string }>;
      })
      .then((data) => setStatus(data.status));
  }, []);

  if (!status) return <p role="status">Loading pet status...</p>;
  return <StatusBadge color="green" label={`Pet ${status}`} />;
}

export const DataDriven: Story = {
  render: () => <PetStatusFromApi />,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/storybook/pet-status", () =>
          HttpResponse.json({ status: "available for adoption" }),
        ),
      ],
    },
  },
};
