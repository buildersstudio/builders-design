"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function Unlock() {
  const next = useSearchParams().get("next") ?? "/";
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await fetch("/api/unlock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: pw }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) location.href = next.startsWith("/") ? next : "/";
    else setErr(j.error ?? "Could not unlock");
  };
  return (
    <main className="unlock">
      <form className="unlock-card" onSubmit={submit}>
        <img src="/brand/spark-black.svg" alt="" width={22} height={22} />
        <h1>Private ventures</h1>
        <p>Some ventures on Builders Design are private. One password opens all of them on this browser.</p>
        <input type="password" autoFocus placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} aria-label="Password" />
        {err && <span className="unlock-err">{err}</span>}
        <button disabled={busy || !pw}>{busy ? "Checking" : "Unlock"}</button>
        <a href="/">Back to all ventures</a>
      </form>
    </main>
  );
}

export default function Page() {
  return <Suspense><Unlock /></Suspense>;
}
