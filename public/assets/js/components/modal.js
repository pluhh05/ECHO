/**
 * ECHO UI Component — Modal Dialog Controller
 * Accessible <dialog> management with focus trapping and restore
 */
const Modal = (function () {
  let lastActiveElement = null;

  function open(dialogId) {
    const dialog = document.getElementById(dialogId);
    if (!dialog) return;

    lastActiveElement = document.activeElement;

    // Use native showModal for proper backdrop & top-layer behavior
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }

    // Auto-focus first input or close button
    const focusable = dialog.querySelector('input:not([type="hidden"]), button:not(.btn-close), [tabindex="0"]');
    if (focusable) {
      focusable.focus();
    }

    dialog.addEventListener('cancel', handleCancel);
  }

  function close(dialogId) {
    const dialog = document.getElementById(dialogId);
    if (!dialog) return;

    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }

    dialog.removeEventListener('cancel', handleCancel);

    // Restore focus
    if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      lastActiveElement.focus();
    }
  }

  function handleCancel(e) {
    // Native cancel event triggered on Escape
    if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      lastActiveElement.focus();
    }
  }

  // Setup click-on-backdrop to close
  function setupBackdropClicks() {
    document.querySelectorAll('dialog.modal-dialog').forEach(dialog => {
      dialog.addEventListener('click', (e) => {
        const rect = dialog.getBoundingClientRect();
        const isInDialog = (
          rect.top <= e.clientY &&
          e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX &&
          e.clientX <= rect.left + rect.width
        );
        if (!isInDialog) {
          close(dialog.id);
        }
      });
    });
  }

  return {
    open,
    close,
    setupBackdropClicks
  };
})();

