import { useState } from "react";
import { Modal } from "../../components/ui/Modal.jsx";
import { Btn } from "../../components/ui/Btn.jsx";
import { Field, FIELD } from "../../components/ui/Field.jsx";
import { HOUSES } from "@collabsphere/shared";

export function AnnouncementModal({ onSave, onClose }) {
  const [f, setF] = useState({ title: "", body: "", audience: "All", pinned: false });
  const [err, setErr] = useState("");
  const set = (k, v) => {
    setF((x) => ({ ...x, [k]: v }));
    setErr("");
  };
  const submit = () => {
    if (f.title.trim().length < 3) return setErr("Add a title of at least 3 characters.");
    if (f.body.trim().length < 8) return setErr("Write a message of at least 8 characters.");
    onSave(f);
    onClose();
  };
  return (
    <Modal
      open
      title="New announcement"
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" icon="megaphone" onClick={submit}>
            Post
          </Btn>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Title">
          <input autoFocus value={f.title} onChange={(e) => set("title", e.target.value)} maxLength={70} className={FIELD} />
        </Field>
        <Field label="Message">
          <textarea
            value={f.body}
            onChange={(e) => set("body", e.target.value)}
            rows={4}
            maxLength={300}
            className={`${FIELD} h-auto py-2 resize-none`}
          />
        </Field>
        <Field label="Audience">
          <select value={f.audience} onChange={(e) => set("audience", e.target.value)} className={FIELD}>
            <option value="All">All houses</option>
            {HOUSES.map((h) => (
              <option key={h} value={h}>
                {h} only
              </option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm text-tx">
          <input
            type="checkbox"
            checked={f.pinned}
            onChange={(e) => set("pinned", e.target.checked)}
            className="accent-[rgb(var(--pri))]"
          />
          Pin to the top of the dashboard
        </label>
      </div>
      {err && (
        <div role="alert" className="shake text-xs text-bad mt-3">
          {err}
        </div>
      )}
    </Modal>
  );
}
