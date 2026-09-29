import { useEffect, useId, useRef } from 'react';

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  isConfirming,
  error,
  onConfirm,
  onCancel,
}) {
  const titleId = useId();
  const messageId = useId();
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const confirmButtonRef = useRef(null);
  const openerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    openerRef.current = document.activeElement;
    cancelButtonRef.current?.focus();

    return () => {
      const opener = openerRef.current;

      if (opener instanceof HTMLElement && opener.isConnected) {
        opener.focus();
      }

      openerRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isConfirming) {
      dialogRef.current?.focus();
    }
  }, [isConfirming, isOpen]);

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();

      if (!isConfirming) {
        onCancel();
      }

      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const actions = [cancelButtonRef.current, confirmButtonRef.current].filter(
      (action) => action && !action.disabled,
    );

    if (actions.length === 0) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }

    const firstAction = actions[0];
    const lastAction = actions[actions.length - 1];

    if (event.shiftKey && document.activeElement === firstAction) {
      event.preventDefault();
      lastAction.focus();
    } else if (!event.shiftKey && document.activeElement === lastAction) {
      event.preventDefault();
      firstAction.focus();
    } else if (!actions.includes(document.activeElement)) {
      event.preventDefault();
      firstAction.focus();
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="confirm-dialog__backdrop">
      <section
        aria-describedby={messageId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="confirm-dialog"
        onKeyDown={handleKeyDown}
        ref={dialogRef}
        role="dialog"
        tabIndex="-1"
      >
        <h2 id={titleId}>{title}</h2>
        <p id={messageId}>{message}</p>

        {error ? (
          <div className="confirm-dialog__error" role="alert">
            {error}
          </div>
        ) : null}

        <div className="confirm-dialog__actions">
          <button
            className="button"
            disabled={isConfirming}
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className="button button--danger"
            disabled={isConfirming}
            onClick={onConfirm}
            ref={confirmButtonRef}
            type="button"
          >
            {isConfirming ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmDialog;
