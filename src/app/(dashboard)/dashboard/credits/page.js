"use client";

import React, { useState } from "react";
import { Card, Button } from "@/shared/components";

export default function App() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("about");

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const tabs = [
    { id: "about", label: "Core Package", icon: "terminal" },
    { id: "vercel", label: "Vercel Patch", icon: "verified_user" },
    { id: "support", label: "Support & Info", icon: "info" },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
          <span className="material-symbols-outlined text-brand-500">volunteer_activism</span>
          Credits &amp; About
        </h1>
        <p className="text-sm text-text-muted mt-1">
          About 9Router and this Vercel deployment patch.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                active
                  ? "border-brand-500 text-brand-500"
                  : "border-transparent text-text-muted hover:text-text-main"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === "about" && (
        <Card>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-brand-500/10 text-brand-500 shrink-0">
              <span className="material-symbols-outlined text-[28px]">memory</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-text-main">9Router v0.5.55</h2>
              <p className="text-sm text-text-muted mt-1 leading-relaxed">
                Universal AI Router built by <b>decolua</b> &amp; community contributors. Supports 40+ LLM
                providers with automatic fallback routing and RTK token optimization.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            <div className="rounded-xl border border-border-subtle bg-surface-2 p-3">
              <p className="text-xs text-text-muted">Maintainer</p>
              <p className="text-sm font-medium text-text-main mt-0.5">decolua</p>
            </div>
            <div className="rounded-xl border border-border-subtle bg-surface-2 p-3">
              <p className="text-xs text-text-muted">Providers</p>
              <p className="text-sm font-medium text-text-main mt-0.5">40+ Endpoints</p>
            </div>
            <div className="rounded-xl border border-border-subtle bg-surface-2 p-3">
              <p className="text-xs text-text-muted">Optimization</p>
              <p className="text-sm font-medium text-text-main mt-0.5">RTK Token Saver</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            <Button
              variant="outline"
              icon="code"
              onClick={() => window.open("https://github.com/decolua/9router", "_blank")}
            >
              GitHub Repo
            </Button>
            <Button
              variant="outline"
              icon="inventory_2"
              onClick={() => window.open("https://www.npmjs.com/package/9router", "_blank")}
            >
              npm Registry
            </Button>
          </div>
        </Card>
      )}

      {activeTab === "vercel" && (
        <Card>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-brand-500/10 text-brand-500 shrink-0">
              <span className="material-symbols-outlined text-[28px]">language</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-text-main">Vercel Deployment Patch</h2>
              <p className="text-sm text-text-muted mt-1 leading-relaxed">
                Zero-config deployment layer for Vercel free tier. Features in-memory SQLite integration and
                HMAC signature authentication. Engineered by <b>Dika</b>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <Button variant="outline" icon="send" fullWidth onClick={() => window.open("https://t.me/dikaacode", "_blank")}>
              Telegram
            </Button>
            <Button variant="outline" icon="language" fullWidth onClick={() => window.open("https://www.obitoglory.tech", "_blank")}>
              Website
            </Button>
            <Button variant="outline" icon="code" fullWidth onClick={() => window.open("https://github.com/dikaofc", "_blank")}>
              GitHub
            </Button>
            <Button variant="outline" icon="local_cafe" fullWidth onClick={() => window.open("https://saweria.co/dikatech", "_blank")}>
              Donate
            </Button>
          </div>
        </Card>
      )}

      {activeTab === "support" && (
        <Card>
          <p className="text-sm text-text-muted leading-relaxed">
            If this deployment patch reduced your server costs or simplified your workflow, consider supporting
            the developer or sharing this page with other devs.
          </p>

          <div className="flex items-center justify-between gap-3 mt-4 rounded-xl border border-border-subtle bg-surface-2 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-500/10 text-brand-500">
                <span className="material-symbols-outlined text-[20px]">local_cafe</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-main">Buy Me a Coffee</p>
                <p className="text-xs text-text-muted">Support via Saweria</p>
              </div>
            </div>
            <Button icon="open_in_new" onClick={() => window.open("https://saweria.co/dikatech", "_blank")}>
              Donate
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3 mt-3">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <span className="material-symbols-outlined text-[18px] text-red-500">favorite</span>
              Made for open source community
            </div>
            <Button
              variant="outline"
              icon={copied ? "check" : "content_copy"}
              onClick={handleShare}
            >
              {copied ? "Link Copied!" : "Copy Page URL"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
