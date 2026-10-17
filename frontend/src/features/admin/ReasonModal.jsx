import { useState } from "react";
import { Modal } from "../../components/ui/Modal.jsx";
import { Btn } from "../../components/ui/Btn.jsx";
import { Field, FIELD } from "../../components/ui/Field.jsx";

// Reject / cancel both require a written reason, which is kept in the audit trail.
export function ReasonModal({ title, intro, confirmLabel, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const submit = () => {
    if (reason.trim().length < 4) {
      setErr("Write a short reason (at least 4 characters) so the other house knows why.");
      return;
    }
    onConfirm(reason.trim());
    onClose();
  };
  return (
    <Modal
      open
      title={title}
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Keep as is</Btn>
          <Btn variant="danger" onClick={submit}>
            {confirmLabel}
          </Btn>
        </>
      }
    >
      <p className="text-sm text-mu mb-3">{intro}</p>
      <Field label="Reason">
        <textarea
          autoFocus
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setErr("");
          }}
          rows={3}
          maxLength={200}
          className={`${FIELD} h-auto py-2 resize-none`}
          placeholder="e.g. Venue clashes with our house exam week"
        />
      </Field>
      {err && (
        <div role="alert" className="shake text-xs text-bad mt-2">
          {err}
        </div>
      )}
    </Modal>
  );
}
