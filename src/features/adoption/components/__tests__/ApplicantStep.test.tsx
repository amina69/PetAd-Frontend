import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApplicantStep } from '../ApplicantStep';
import { CURRENT_USER_STORAGE_KEY } from '../../../../hooks/useCurrentUser';

describe('ApplicantStep', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('prefills the applicant details and keeps the fields editable', async () => {
    localStorage.setItem(
      CURRENT_USER_STORAGE_KEY,
      JSON.stringify({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+2348012345678',
      }),
    );

    const user = userEvent.setup();
    render(<ApplicantStep />);

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const phoneInput = screen.getByLabelText('Phone (E.164)');

    expect(nameInput).toHaveValue('Jane Doe');
    expect(emailInput).toHaveValue('jane@example.com');
    expect(phoneInput).toHaveValue('+2348012345678');

    expect(nameInput).not.toBeDisabled();
    expect(emailInput).not.toBeDisabled();
    expect(phoneInput).not.toBeDisabled();
    expect(nameInput).not.toHaveAttribute('readonly');

    await user.clear(nameInput);
    await user.type(nameInput, 'Janet Doe');

    expect(nameInput).toHaveValue('Janet Doe');
    expect(emailInput).toHaveValue('jane@example.com');
  });

  it('does not show an email error before the field is blurred', async () => {
    const user = userEvent.setup();
    render(<ApplicantStep />);

    const emailInput = screen.getByLabelText('Email');
    await user.type(emailInput, 'not-an-email');

    expect(screen.queryByText('Invalid email address')).toBeNull();

    await user.tab();

    expect(await screen.findByText('Invalid email address')).toBeInTheDocument();
  });

  it('shows the README phone message after the field is blurred', async () => {
    const user = userEvent.setup();
    render(<ApplicantStep />);

    const phoneInput = screen.getByLabelText('Phone (E.164)');
    await user.type(phoneInput, '01234567890');

    expect(screen.queryByText('Invalid phone number')).toBeNull();

    await user.tab();

    expect(await screen.findByText('Invalid phone number')).toBeInTheDocument();
  });

  it('clears the inline error once the value becomes valid', async () => {
    const user = userEvent.setup();
    render(<ApplicantStep />);

    const emailInput = screen.getByLabelText('Email');
    await user.type(emailInput, 'not-an-email');
    await user.tab();

    expect(await screen.findByText('Invalid email address')).toBeInTheDocument();

    await user.clear(emailInput);
    await user.type(emailInput, 'jane@example.com');

    expect(screen.queryByText('Invalid email address')).toBeNull();
  });

  it('marks every field as validated when the form is submitted', async () => {
    const user = userEvent.setup();
    render(<ApplicantStep />);

    await user.click(screen.getByRole('button', { name: /submit application/i }));

    expect(await screen.findByText('Name must be at least 2 characters')).toBeInTheDocument();
    expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    expect(screen.getByText('Invalid phone number')).toBeInTheDocument();
    expect(screen.getByText('Please provide more details')).toBeInTheDocument();
  });

  it('submits the validated values and does not submit an invalid form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ApplicantStep onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Full Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /submit application/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText('Invalid email address')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Email'));
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Phone (E.164)'), '+2348012345678');
    await user.type(screen.getByLabelText('Reason for adoption'), 'B'.repeat(50));
    await user.click(screen.getByRole('button', { name: /submit application/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+2348012345678',
      reason: 'B'.repeat(50),
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Application submitted successfully!',
    );
  });
});
