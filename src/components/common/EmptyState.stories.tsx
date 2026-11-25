import { PawPrint } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmptyState } from "./EmptyState";

const meta = {
  title: "Primitives/EmptyState",
  component: EmptyState,
  args: {
    title: "No pets found",
    description: "Try changing your filters to see available pets.",
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithIconAndAction: Story = {
  args: {
    icon: <PawPrint aria-hidden="true" />,
    title: "No listings yet",
    description: "Create a listing to help a pet find a home.",
    action: (
      <button
        type="button"
        className="rounded-md bg-[#d4431f] px-4 py-2 font-semibold text-white"
      >
        Create listing
      </button>
    ),
  },
};
