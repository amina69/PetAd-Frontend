import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormSelect } from "./formSelect";
import type { FormSelectProps } from "./formSelectTypes";

const options = [
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "rabbit", label: "Rabbit" },
];

const meta = {
  title: "Primitives/FormSelect",
  component: FormSelect,
  args: {
    id: "pet-type",
    label: "Pet type",
    options,
    placeholder: "Choose a pet",
  },
} satisfies Meta<typeof FormSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

function ControlledSelect(props: FormSelectProps) {
  const [value, setValue] = useState(props.value ?? "");
  return (
    <FormSelect
      {...props}
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}

export const Default: Story = {
  render: (args) => <ControlledSelect {...args} />,
};

export const Selected: Story = {
  args: { value: "dog" },
  render: (args) => <ControlledSelect {...args} />,
};

export const WithError: Story = {
  args: { error: "Choose a pet type." },
  render: (args) => <ControlledSelect {...args} />,
};

export const Disabled: Story = {
  args: { disabled: true },
};
