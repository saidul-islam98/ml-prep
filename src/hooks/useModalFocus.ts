import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useModalFocus<T extends HTMLElement>(
  isOpen: boolean,
  /** Called when the user dismisses via Escape or external trigger. */
  onClose: () => void,
): RefObject<T | null> {
  const dialogRef = useRef<T>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  // Keep latest onClose in a ref so callback identity changes never retrigger
  // the effect, and so Escape always calls the most-recent version (which may
  // be a wrapped pauseAndClose rather than the raw prop).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    // Capture the element that had focus before the modal opened.
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const dialog = dialogRef.current;

    // Move focus only on open; never steal it from an active input inside.
    const active = document.activeElement;
    const insideDialog = dialog && active instanceof HTMLElement && dialog.contains(active);
    if (!insideDialog) {
      const focusable = dialog?.querySelectorAll<HTMLElement>(FOCUSABLE);
      (focusable?.[0] ?? dialog)?.focus();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        // Always calls the latest version — FocusModeModal passes pauseAndClose
        // so Escape pauses the timer and flushes notes before closing.
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus only when the modal genuinely closes.
      returnFocusRef.current?.focus();
    };
  }, [isOpen]);

  return dialogRef;
}
