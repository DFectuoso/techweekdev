"use client";

import { useEffect, useRef } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function Dialog({ open, onClose, children, title }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    if (open) {
      el.showModal();
    } else {
      el.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="backdrop:bg-black/50 rounded-lg border border-border bg-card p-0 shadow-lg max-w-md w-full"
    >
      <div className="p-6">
        {title && (
          <h2 className="text-lg font-semibold mb-4">{title}</h2>
        )}
        {children}
      </div>
    </dialog>
  );
}
