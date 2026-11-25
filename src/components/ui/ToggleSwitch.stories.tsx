import { useState } from "react";
import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ToggleSwitch } from "./ToggleSwitch";

const meta = {
  title: "Primitives/ToggleSwitch",
  component: ToggleSwitch,
  args: {
    label: "Email notifications",
    checked: false,
    onChange: () => {},
  },
} satisfies Meta<typeof ToggleSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

function InteractiveToggle(props: ComponentProps<typeof ToggleSwitch>) {
  const [checked, setChecked] = useState(props.checked);
  return <ToggleSwitch {...props} checked={checked} onChange={setChecked} />;
}

export const Off: Story = {
  args: { label: "Email notifications", checked: false, onChange: () => {} },
  render: (args) => <InteractiveToggle {...args} />,
};

export const On: Story = {
  args: { checked: true, onChange: () => {} },
  render: (args) => <InteractiveToggle {...args} />,
};

export const Disabled: Story = {
  args: { checked: true, disabled: true, onChange: () => {} },
};
