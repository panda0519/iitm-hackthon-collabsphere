import { useState } from "react";
import { Modal } from "../../components/ui/Modal.jsx";
import { Btn } from "../../components/ui/Btn.jsx";
import { Field, FIELD } from "../../components/ui/Field.jsx";
import { HOUSES } from "@collabsphere/shared";

export function AwardModal({ defaultHouse, onSave, onClose }) {
  const [f, setF] = useState({ house: defaultHouse, amount: 20, reason: "" });
  const [err, setErr] = useState("");
  const set = (k, v) => {
    setF((x) => ({ ...x, [k]: v }));
    setErr("");
  };
  const submit = () => {
    if (f.reason.trim().length < 4) return setErr("A reason is required, it goes into the audit log.");
    onSave(f.house, f.amount, f.reason.trim());
    onClose();
  };
  return (
    <Modal
      open
      title="Award bonus XP"
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" icon="gift" onClick={submit}>
            Award +{f.amount} XP
          </Btn>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="House">
          <select value={f.house} onChange={(e) => set("house", e.target.value)} className={FIELD}>
            {HOUSES.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
        </Field>
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-mu">Amount</span>
            <span className="font-display font-bold text-ok text-sm">+{f.amount}</span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={f.amount}
            onChange={(e) => set("amount", Number(e.target.value))}
            className="w-full"
            aria-label="Bonus XP amount"
          />
        </div>
        <Field label="Reason">
          <input
            value={f.reason}
            onChange={(e) => set("reason", e.target.value)}
            maxLength={120}
            className={FIELD}
            placeholder="e.g. Hosted the regional co-working day"
          />
        </Field>
      </div>
      {err && (
        <div role="alert" className="shake text-xs text-bad mt-3">
          {err}
        </div>
      )}
    </Modal>
  );
}
