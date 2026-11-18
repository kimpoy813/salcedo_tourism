import type { FormEventHandler, ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";

export function StaffEditorForm({
  label,
  onClose,
  onSubmit,
  busy,
  children,
}: {
  label: string;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  busy: boolean;
  children: ReactNode;
}) {
  return (
    <Modal
      label={label}
      className="staff-editor"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form className="bg-white p-5 space-y-4 text-xs" aria-busy={busy} onSubmit={onSubmit}>
        {children}
      </form>
    </Modal>
  );
}
