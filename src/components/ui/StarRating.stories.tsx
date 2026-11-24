import { useState } from "react";
import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { StarRating } from "./StarRating";

const meta = {
  title: "Primitives/StarRating",
  component: StarRating,
  args: { rating: 3, size: "md", onRatingChange: () => {} },
} satisfies Meta<typeof StarRating>;

export default meta;
type Story = StoryObj<typeof meta>;

function InteractiveRating(props: ComponentProps<typeof StarRating>) {
  const [rating, setRating] = useState(props.rating);
  return <StarRating {...props} rating={rating} onRatingChange={setRating} />;
}

export const Interactive: Story = {
  args: { rating: 3, size: "md", onRatingChange: () => {} },
  render: (args) => <InteractiveRating {...args} />,
};

export const AllSizes: Story = {
  args: { rating: 3, size: "md", onRatingChange: () => {} },
  render: (args) => (
    <div className="flex flex-col items-start gap-4">
      <StarRating {...args} rating={4} size="sm" onRatingChange={() => {}} />
      <StarRating {...args} rating={4} size="md" onRatingChange={() => {}} />
      <StarRating {...args} rating={4} size="lg" onRatingChange={() => {}} />
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, rating: 4, onRatingChange: () => {} },
};
