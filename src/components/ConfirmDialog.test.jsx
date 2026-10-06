import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import ConfirmDialog from './ConfirmDialog';

const defaultProps = {
  isOpen: true,
  title: 'Delete item',
  message: 'This action cannot be undone.',
  confirmLabel: 'Delete',
  cancelLabel: 'Cancel',
  isConfirming: false,
  error: '',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

function renderDialog(overrides = {}) {
  const props = {
    ...defaultProps,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };

  render(<ConfirmDialog {...props} />);
  return props;
}

function FocusRestoreHarness({ onCancel }) {
  const [isOpen, setIsOpen] = useState(false);

  function handleCancel() {
    onCancel();
    setIsOpen(false);
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} type="button">
        Open confirmation
      </button>
      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel="Delete"
        error=""
        isConfirming={false}
        isOpen={isOpen}
        message="This action cannot be undone."
        onCancel={handleCancel}
        onConfirm={vi.fn()}
        title="Delete item"
      />
    </>
  );
}

describe('ConfirmDialog', () => {
  it('does not render when closed', () => {
    renderDialog({ isOpen: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('uses the supplied title as its accessible name and displays the message', () => {
    renderDialog();

    const dialog = screen.getByRole('dialog', { name: 'Delete item' });
    expect(dialog).toHaveAccessibleDescription('This action cannot be undone.');
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  });

  it('calls only onConfirm when confirmation is selected', async () => {
    const user = userEvent.setup();
    const { onCancel, onConfirm } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls only onCancel when cancellation is selected', async () => {
    const user = userEvent.setup();
    const { onCancel, onConfirm } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('cancels with Escape when confirmation is not pending', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderDialog();

    await user.keyboard('{Escape}');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables actions and ignores Escape while confirmation is pending', async () => {
    const user = userEvent.setup();
    const { onCancel, onConfirm } = renderDialog({ isConfirming: true });

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Deleting...' })).toBeDisabled();
    expect(screen.getByRole('dialog')).toHaveFocus();

    await user.keyboard('{Escape}');

    expect(onCancel).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('keeps focus on the dialog when no pending action is enabled', async () => {
    const user = userEvent.setup();
    renderDialog({ isConfirming: true });
    const dialog = screen.getByRole('dialog');

    expect(dialog).toHaveFocus();
    await user.tab();
    expect(dialog).toHaveFocus();
    await user.tab({ shift: true });
    expect(dialog).toHaveFocus();
  });

  it('renders an error without closing', () => {
    renderDialog({ error: 'The item could not be deleted.' });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'The item could not be deleted.',
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('traps focus between the dialog actions', async () => {
    const user = userEvent.setup();
    renderDialog();
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    const confirmButton = screen.getByRole('button', { name: 'Delete' });

    expect(cancelButton).toHaveFocus();
    await user.tab({ shift: true });
    expect(confirmButton).toHaveFocus();
    await user.tab();
    expect(cancelButton).toHaveFocus();
  });

  it('returns focus to the opener after closing', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<FocusRestoreHarness onCancel={onCancel} />);
    const opener = screen.getByRole('button', { name: 'Open confirmation' });

    await user.click(opener);
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
