import type { Meta, StoryObj } from "@storybook/react-vite";
import { SubmitButton } from "./submitButton";

const meta = {
  title: "Primitives/SubmitButton",
  component: SubmitButton,
  args: { label: "Save changes" },
} satisfies Meta<typeof SubmitButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: { isLoading: true, loadingLabel: "Saving..." },
};

export const Disabled: Story = {
  args: { disabled: true },
};
