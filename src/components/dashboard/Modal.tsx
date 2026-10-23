import { useId, type ReactNode, type RefObject } from "react";
import { LuX } from "react-icons/lu";
import { useModal } from "../../lib/useModal";

type ModalProps = {
  title: string;
  description?: string;
  /** Accessible name of the close (✕) button. */
  closeLabel: string;
  onClose: () => void;
  /** Element focused on open (usually the first field). */
  initialFocus: RefObject<HTMLElement | null>;
  /** For tests: the backdrop has no role to find it by. */
  backdropTestId?: string;
  children: ReactNode;
};

/**
 * Centred dialog over a dimmed page: the sign-in popup and the goal forms.
 * Closes on Escape, the ✕ or a click on the backdrop; focus moves in on
 * open and back out on close (useModal).
 */
export function Modal({
  title,
  description,
  closeLabel,
  onClose,
  initialFocus,
  backdropTestId,
  children,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  useModal(onClose, initialFocus);

  return (
    <div
      data-testid={backdropTestId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-heading/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="relative w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="absolute top-3 right-3 rounded-full p-2 text-body hover:bg-primary-light hover:text-primary"
        >
          <LuX className="size-5" aria-hidden />
        </button>

        <h2
          id={titleId}
          className="pr-8 text-xl leading-tight font-bold text-heading"
        >
          {title}
        </h2>
        {description && (
          <p
            id={descriptionId}
            className="mt-0.5 text-sm leading-snug text-body"
          >
            {description}
          </p>
        )}

        {children}
      </div>
    </div>
  );
}
