import { useState } from "react";
import { Modal } from "../../components/ui/Modal.jsx";
import { Btn } from "../../components/ui/Btn.jsx";
import { Field, FIELD } from "../../components/ui/Field.jsx";
import { CATEGORIES, SOCIETIES, toLocalInput } from "@collabsphere/shared";

export function EditEventModal({ ev, onSave, onClose }) {
  const [f, setF] = useState({
    title: ev.title,
    venue: ev.venue,
    dateLocal: toLocalInput(ev.date),
    xpReward: ev.xpReward,
    society: ev.society,
    category: ev.category
  });
  const [err, setErr] = useState("");
  const set = (k, v) => {
    setF((x) => ({ ...x, [k]: v }));
    setErr("");
  };
  const submit = async () => {
    const e = await onSave(ev.id, f);
    if (e) setErr(e);
    else onClose();
  };
  return (
    <Modal
      open
      wide
      title={`Edit ${ev.id}`}
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" icon="check" onClick={submit}>
            Save changes
          </Btn>
        </>
      }
    >
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Title" className="sm:col-span-2">
          <input autoFocus value={f.title} onChange={(e) => set("title", e.target.value)} maxLength={80} className={FIELD} />
        </Field>
        <Field label="Venue" className="sm:col-span-2">
          <input value={f.venue} onChange={(e) => set("venue", e.target.value)} maxLength={80} className={FIELD} />
        </Field>
        <Field label="Date and time">
          <input type="datetime-local" value={f.dateLocal} onChange={(e) => set("dateLocal", e.target.value)} className={FIELD} />
        </Field>
        <Field label="XP per host house">
          <input
            type="number"
            min="10"
            max="100"
            step="5"
            value={f.xpReward}
            onChange={(e) => set("xpReward", e.target.value)}
            className={FIELD}
          />
        </Field>
        <Field label="Type">
          <select value={f.category} onChange={(e) => set("category", e.target.value)} className={FIELD}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Society">
          <select value={f.society} onChange={(e) => set("society", e.target.value)} className={FIELD}>
            {SOCIETIES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>
      {ev.coHostHouse && (
        <p className="text-xs text-pritx mt-3">
          Changing the date or venue sends this event back to the other host house for approval.
        </p>
      )}
      {err && (
        <div role="alert" className="shake text-xs text-bad mt-3">
          {err}
        </div>
      )}
    </Modal>
  );
}
