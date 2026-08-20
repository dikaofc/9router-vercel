"use client";

import { useState, useEffect } from "react";
import { Card, Button } from "@/shared/components";
import { parseEnvBlock } from "@/lib/db/parseEnv";

function driverLabel(driver) {
  switch (driver) {
    case "vercel-supabase": return "Supabase (cloud, permanent)";
    case "vercel-kv": return "Vercel KV";
    case "vercel-in-memory": return "Vercel in-memory (ephemeral)";
    case "mongo": return "MongoDB";
    default: return driver || "local sqlite";
  }
}

function EnvVarRow({ name, hint, value, onStatus }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value || "");
      setCopied(true);
      onStatus({ type: "success", message: `Copied ${name} — tempel di Vercel.` });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onStatus({ type: "error", message: "Gagal menyalin. Salin manual dari blok paste di atas." });
    }
  }
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <code className="flex-1 break-all font-mono text-[11px] text-text-main">{name}</code>
        <Button type="button" variant="outline" size="sm" icon={copied ? "check" : "content_copy"} onClick={copy}>
          Copy
        </Button>
      </div>
      {hint && <p className="text-[11px] text-text-muted">{hint}</p>}
    </div>
  );
}

export default function SupabaseSettingsCard() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [persistence, setPersistence] = useState(null);
  const [hasSupabaseEnv, setHasSupabaseEnv] = useState(false);
  const [copyStatus, setCopyStatus] = useState({ type: "", message: "" });
  const [envValues, setEnvValues] = useState({});

  async function reloadStatus() {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data?.persistence) {
        setPersistence(data.persistence);
        setHasSupabaseEnv(data.persistence.supabaseConfigured === true);
      }
    } catch {}
  }

  // Extract keys for the Copy buttons from what the user pastes (without storing them in state longer than needed).
  function extractEnvValues() {
    const parsed = parseEnvBlock(text);
    const out = {};
    for (const key of ["NEXT_PUBLIC_DIKA_SUPABASE_URL", "DIKA_SUPABASE_SERVICE_ROLE_KEY", "DIKA_SUPABASE_ANON_KEY"]) {
      if (parsed[key]) out[key] = parsed[key];
    }
    return out;
  }

  useEffect(() => {
    reloadStatus();
  }, []);

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
      setEnvValues(extractEnvValues());
      await reloadStatus();
      setStatus({
        type: "success",
        message: `Saved ${count} key(s). Cek status di atas — kalau merah, write ke Supabase gagal.`,
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
      <div className="text-sm mb-3 p-3 rounded-lg border border-border bg-bg flex flex-col gap-1">
        <p className="text-text-muted">Storage backend aktif:</p>
        <p className="font-medium">{persistence ? driverLabel(persistence.driver) : "memuat…"}</p>
        {persistence?.driver === "vercel-supabase" && persistence.supabaseWriteOk === true && (
          <p className="text-xs text-green-500">✓ Supabase aktif — DB dipersist permanen (survive cold start).</p>
        )}
        {persistence?.driver === "vercel-supabase" && persistence.supabaseWriteOk === false && (
          <p className="text-xs text-red-500">
            ✗ Write ke Supabase GAGAL: {persistence.supabaseError || "unknown"} — data hanya di memory, hilang saat cold start.
          </p>
        )}
        {persistence?.driver === "vercel-supabase" && persistence.supabaseWriteOk == null && (
          <p className="text-xs text-amber-500">Mengecek write Supabase…</p>
        )}
        {persistence?.driver === "vercel-in-memory" && (
          <p className="text-xs text-red-500">
            ✗ Vercel in-memory (ephemeral) — config HILANG tiap cold start/deploy. Set env Supabase (lihat bawah).
          </p>
        )}
        {persistence?.driver === "vercel-kv" && (
          <p className="text-xs text-green-500">✓ Vercel KV aktif — DB dipersist via KV.</p>
        )}
        {!persistence?.supabaseConfigured && persistence?.driver !== "vercel-supabase" && (
          <p className="text-xs text-amber-500 font-semibold">
            ⚠️ Supabase BELUM aktif di cold start. Set NEXT_PUBLIC_DIKA_SUPABASE_URL + DIKA_SUPABASE_SERVICE_ROLE_KEY di Vercel project env, kalau tidak config HILANG setiap cold start.
          </p>
        )}
      </div>
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

      <div className="mt-4 p-3 rounded-lg border border-border bg-bg flex flex-col gap-2 text-xs sm:text-sm">
        <p className="font-semibold text-text-main">Agar permanen di Vercel (wajib sekali saja)</p>
        <p className="text-text-muted">
          Paste di atas hanya mempengaruhi instance yang sedang hidup. Agar config bertahan di tiap
          cold start / redeploy, pasang 2 variabel ini di{" "}
          <span className="text-text-main">Vercel → Your Project → Settings → Environment Variables</span>:
          gunakan tombol Copy di bawah, tempel di value, lalu <b>Redeploy</b>.
        </p>
        <div className="flex flex-col gap-1.5">
          <EnvVarRow
            name="NEXT_PUBLIC_DIKA_SUPABASE_URL"
            hint="https://xxxx.supabase.co (bukan rahasia, public aman)"
            value={envValues.NEXT_PUBLIC_DIKA_SUPABASE_URL}
            onStatus={setCopyStatus}
          />
          <EnvVarRow
            name="DIKA_SUPABASE_SERVICE_ROLE_KEY"
            hint="Paling aman. Kalau tidak punya, gunakan DIKA_SUPABASE_ANON_KEY sebagai pengganti."
            value={envValues.DIKA_SUPABASE_SERVICE_ROLE_KEY || envValues.DIKA_SUPABASE_ANON_KEY}
            onStatus={setCopyStatus}
          />
        </div>
        {copyStatus.message && (
          <p className={`text-xs ${copyStatus.type === "error" ? "text-red-500" : "text-green-500"}`}>{copyStatus.message}</p>
        )}
      </div>
    </Card>
  );
}