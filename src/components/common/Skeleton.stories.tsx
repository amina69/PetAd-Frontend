import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "./Skeleton";

const meta = {
  title: "Primitives/Skeleton",
  component: Skeleton,
  args: { width: "100%", height: 16 },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextLine: Story = {};

export const CardLoadingState: Story = {
  render: () => (
    <div className="flex max-w-sm gap-4 rounded-xl border border-gray-200 p-4">
      <Skeleton width={64} height={64} className="shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-3">
        <Skeleton width="70%" height={18} />
        <Skeleton width="100%" height={12} />
        <Skeleton width="85%" height={12} />
      </div>
    </div>
  ),
};
