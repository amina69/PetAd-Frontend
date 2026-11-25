import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormInput } from "./formInput";

const meta = {
  title: "Primitives/FormInput",
  component: FormInput,
  args: {
    id: "email",
    label: "Email address",
    type: "email",
    placeholder: "you@example.com",
  },
} satisfies Meta<typeof FormInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Required: Story = {
  args: { required: true },
};

export const WithError: Story = {
  args: {
    error: "Enter a valid email address.",
    value: "invalid-email",
  },
};

export const Disabled: Story = {
  args: { disabled: true, value: "you@example.com" },
};
