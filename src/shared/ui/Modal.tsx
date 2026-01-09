import React, { type ReactNode, forwardRef, useEffect } from "react";

import { cn } from "@/shared/lib/variants";

// Modal Props
export interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
  overlayClassName?: string;
  contentClassName?: string;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

// Modal Parts Props
export interface ModalOverlayProps {
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
  closeOnOverlayClick?: boolean;
}

export interface ModalContentProps {
  children: ReactNode;
  className?: string;
}

export interface ModalHeaderProps {
  children: ReactNode;
  className?: string;
}

export interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

// Modal Overlay Component
export const ModalOverlay = ({
  isOpen,
  onClose,
  className,
  closeOnOverlayClick = true,
}: ModalOverlayProps) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/50",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      onClick={handleOverlayClick}
    />
  );
};

// Modal Content Component
export const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] bg-white rounded-lg shadow-xl duration-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          className,
        )}
        data-modal-content
        {...props}
      >
        {children}
      </div>
    );
  },
);

ModalContent.displayName = "ModalContent";

// Modal Header Component
export const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-1.5 p-6 pb-4 text-center sm:text-left border-b border-gray-200",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);

ModalHeader.displayName = "ModalHeader";

// Modal Body Component
export const ModalBody = forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "p-6 text-sm text-gray-700 leading-relaxed overflow-y-auto",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);

ModalBody.displayName = "ModalBody";

// Modal Footer Component
export const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-4 pt-2",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);

ModalFooter.displayName = "ModalFooter";

// Main Modal Component
export const Modal = ({
  isOpen,
  onClose,
  children,
  overlayClassName,
  contentClassName,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalProps) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape) {
        const activeElement = document.activeElement;
        const isInputElement =
          activeElement?.tagName === "INPUT" ||
          activeElement?.tagName === "TEXTAREA" ||
          activeElement?.tagName === "SELECT" ||
          activeElement?.getAttribute("contenteditable") === "true";

        const modalContent = document.querySelector("[data-modal-content]");
        const isInsideModal = modalContent?.contains(activeElement);

        if (!isInputElement || !isInsideModal) {
          onClose?.();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  return (
    <>
      <ModalOverlay
        isOpen={isOpen}
        onClose={onClose}
        className={overlayClassName}
        closeOnOverlayClick={closeOnOverlayClick}
      />
      <ModalContent className={contentClassName}>{children}</ModalContent>
    </>
  );
};

Modal.displayName = "Modal";
