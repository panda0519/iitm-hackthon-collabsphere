import { useEffect, useState } from "react";
import { Modal } from "../../components/ui/Modal.jsx";
import { Btn } from "../../components/ui/Btn.jsx";
import { Field, FIELD } from "../../components/ui/Field.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { checkAdminPassword, ADMIN_MAX_TRIES, ADMIN_COOLDOWN_S, DEMO_ADMIN_HINT } from "@collabsphere/shared";
import { apiEnabled, client } from "../../services/client.js";

// Survives closing and reopening the password box, so the cool-down cannot be reset by
// closing the dialog.
const gateGuard = { fails: 0, until: 0 };

export function AdminGate({ onUnlock, onClose }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");
  const [until, setUntil] = useState(gateGuard.until);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (until <= Date.now()) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [until]);
  const wait = Math.max(0, Math.ceil((until - now) / 1000));

  const submit = async () => {
    if (!pw || wait > 0 || busy) return;
    let ok = false;
    if (apiEnabled()) {
      // The browser only asks the server to verify; it never checks a hash itself.
      setBusy(true);
      setMsg("");
      try {
        await client.adminUnlock(pw);
        ok = true;
      } catch (e) {
        if (!e || e.status !== 401) setMsg(e && e.message ? e.message : "Could not reach the server.");
      } finally {
        setBusy(false);
      }
    } else {
      ok = checkAdminPassword(pw);
    }
    if (ok) {
      gateGuard.fails = 0;
      gateGuard.until = 0;
      onUnlock();
      return;
    }
    gateGuard.fails += 1;
    setPw("");
    if (gateGuard.fails >= ADMIN_MAX_TRIES) {
      gateGuard.fails = 0;
      gateGuard.until = Date.now() + ADMIN_COOLDOWN_S * 1000;
      setUntil(gateGuard.until);
      setMsg("");
    } else {
      const left = ADMIN_MAX_TRIES - gateGuard.fails;
      setMsg(`Incorrect password. ${left} ${left === 1 ? "try" : "tries"} left.`);
    }
  };

  return (
    <Modal
      open
      title="Admin access"
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" icon="lock" onClick={submit} disabled={!pw || wait > 0 || busy}>
            {busy ? "Checking\u2026" : "Unlock"}
          </Btn>
        </>
      }
    >
      <div className="flex items-start gap-3 mb-4">
        <span className="w-10 h-10 rounded-xl btn-flame flex items-center justify-center shrink-0">
          <Icon name="lock" />
        </span>
        <p className="text-sm text-mu">
          The Admin console can approve events, award XP and export data, so it is limited to house secretaries. Enter
          the admin password to continue.
        </p>
      </div>
      <Field label="Admin password">
        <div className="relative">
          <input
            autoFocus
            type={show ? "text" : "password"}
            value={pw}
            placeholder="Enter password"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => {
              setPw(e.target.value);
              setMsg("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            className={`${FIELD} pr-16`}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2 rounded-md text-[11px] font-semibold text-mu hover:text-tx"
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>
      </Field>
      {DEMO_ADMIN_HINT && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-pri/30 bg-pri/10 px-3 py-2 text-xs text-mu">
          <Icon name="bell" className="w-3.5 h-3.5 text-pritx shrink-0" />
          <span>
            Demo hint: the password is <span className="font-semibold text-tx select-all">{DEMO_ADMIN_HINT}</span>
          </span>
        </div>
      )}
      {(wait > 0 || msg) && (
        <div role="alert" className="shake text-xs text-bad mt-2">
          {wait > 0 ? `Too many wrong attempts. Try again in ${wait}s.` : msg}
        </div>
      )}
    </Modal>
  );
}
