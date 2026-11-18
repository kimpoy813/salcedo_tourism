import { X } from "lucide-react";

/** Mutation feedback is visible and announced, including inside an editor dialog. */
export function StaffNotice({
  notice,
  dismiss,
}: {
  notice: { text: string; tone: "ok" | "err" } | null;
  dismiss: () => void;
}) {
  if (!notice) return null;
  return (
    <div
      className={`staff-feedback ${notice.tone}`}
      role={notice.tone === "err" ? "alert" : "status"}
    >
      <span>{notice.text}</span>
      <button type="button" onClick={dismiss} aria-label="Dismiss message">
        <X size={16} />
      </button>
    </div>
  );
}
