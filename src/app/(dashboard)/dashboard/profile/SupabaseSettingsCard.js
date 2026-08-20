"use client";

import { useState } from "react";
import { Card, Button } from "@/shared/components";
import { parseEnvBlock } from "@/lib/db/parseEnv";

export default function SupabaseSettingsCard() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setStatus({ type: "", message: "" });
    try {
      const parsed = parseEnvBlock(text);
      const count = Object.keys(parsed).length;
      if (!count) {
        setStatus({ type: "error", message: "No KEY=value lines found." });
        return;
      }
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ type: "error", message: data.error || "Save failed" });
        return;
      }
      setStatus({
        type: "success",
        message: `Saved ${count} key(s). DB now persists to Supabase (takes effect on next restart / cold start).`,
      });
    } catch (e) {
      setStatus({ type: "error", message: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="Supabase (Database Persistence)" subtitle="Paste your Supabase env block once — no hardcoding.">
      <p className="text-sm text-text-muted mb-3">
        Stores the SQLite DB in Supabase Storage so your connections, API keys, combos and
        settings survive Vercel cold starts. For guaranteed cold-start persistence also set{" "}
        <code>NEXT_PUBLIC_DIKA_SUPABASE_URL</code> + a Supabase key in your Vercel project env.
      </p>
      <p className="text-xs text-amber-500 mb-3">
        ⚠️ Secrets you paste (including <code>service_role</code>) are saved in this app&apos;s
        DB (Supabase Storage, encrypted at rest) and used server-side only.
        <code>service_role</code> grants full DB access &amp; bypasses RLS — prefer a key scoped
        to Storage writes. If these creds were ever shared in chat, rotate them now.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'DIKA_SUPABASE_ANON_KEY="eyJ..."\nNEXT_PUBLIC_DIKA_SUPABASE_URL="https://xxxx.supabase.co"\nDIKA_SUPABASE_SERVICE_ROLE_KEY="eyJ..."'}
        className="w-full h-48 font-mono text-xs p-3 rounded border border-border bg-input text-text-main"
      />
      <div className="flex items-center gap-3 mt-3">
        <Button onClick={save} loading={loading} icon="save">
          Save
        </Button>
        {status.message && (
          <span
            className={`text-sm ${
              status.type === "error" ? "text-red-500" : "text-green-500"
            }`}
          >
            {status.message}
          </span>
        )}
      </div>
    </Card>
  );
}
