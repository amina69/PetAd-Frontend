import { fireEvent, render, screen } from "@testing-library/react";
import { AdminStatusOverrideModal } from "../components/modals/AdminStatusOverrideModal";

describe("AdminStatusOverrideModal", () => {
  test("submit button is disabled initially", () => {
    render(
      <AdminStatusOverrideModal
        isOpen={true}
        onClose={() => {}}
        adoptionId="123"
        currentStatus="PENDING"
        onSubmit={() => {}}
      />
    );

    const submitButton = screen.getByText("Submit") as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);
  });

  test("shows blockchain warning for COMPLETED status", () => {
    render(
      <AdminStatusOverrideModal
        isOpen={true}
        onClose={() => {}}
        adoptionId="123"
        currentStatus="PENDING"
        onSubmit={() => {}}
      />
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "COMPLETED" } });

    const warning = screen.queryByText("Requires on-chain confirmation");
    expect(warning).not.toBeNull();
  });
});