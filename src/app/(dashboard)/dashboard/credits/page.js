"use client";

import Link from "next/link";

function CreditLink({ href, icon, label, color }) {
  const colorClasses = {
    telegram: "bg-[#26A5E4]/10 hover:bg-[#26A5E4]/20 text-[#26A5E4] border-[#26A5E4]/20",
    website: "bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/20",
    donate: "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20",
    github: "bg-white/5 hover:bg-white/10 text-text-muted border-white/10",
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${colorClasses[color] || colorClasses.github}`}
    >
      {icon}
      <span>{label}</span>
      <span className="material-symbols-outlined text-[14px] ml-auto opacity-50">open_in_new</span>
    </a>
  );
}

function TelegramIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 7.47l-1.97 9.28c-.15.67-.54.83-1.09.52l-3.02-2.22-1.46 1.4c-.16.16-.3.3-.61.3l.22-3.05 5.56-5.02c.24-.22-.05-.33-.37-.14L8.6 13.25l-2.96-.93c-.65-.2-.66-.65.14-.96l11.55-4.46c.54-.2 1.01.13.83.96z"/>
    </svg>
  );
}

export default function CreditsPage() {
  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      {/* Hero Section */}
      <div className="text-center mb-10">
        <div className="relative inline-block mb-5">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-xl shadow-primary/25">
            <span className="material-symbols-outlined text-[32px] text-white">favorite</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-1.5">Credits</h1>
        <p className="text-text-muted text-sm">Built with love by the open source community</p>
      </div>

      {/* 9Router Original */}
      <div className="bg-surface border border-border rounded-2xl p-5 mb-4 hover:border-border/80 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-500/10">
            <span className="material-symbols-outlined text-[20px] text-green-500">code</span>
          </div>
          <div>
            <h3 className="font-semibold text-[15px]">9Router</h3>
            <p className="text-xs text-text-muted">Free AI Router & Token Saver</p>
          </div>
        </div>
        <p className="text-sm text-text-muted mb-4 leading-relaxed">
          The original project by{" "}
          <a href="https://github.com/decolua/9router" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
            decolua
          </a>
          {" "}& friends — 40+ providers, 100+ models, RTK token saver, auto-fallback routing.
        </p>
        <div className="flex gap-2">
          <a href="https://github.com/decolua/9router" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-text-muted border border-white/10 transition-all">
            <span className="material-symbols-outlined text-[13px]">open_in_new</span> GitHub
          </a>
          <a href="https://www.npmjs.com/package/9router" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-text-muted border border-white/10 transition-all">
            <span className="material-symbols-outlined text-[13px]">open_in_new</span> npm
          </a>
        </div>
      </div>

      {/* Vercel Patch */}
      <div className="bg-surface border border-border rounded-2xl p-5 mb-4 hover:border-border/80 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500/10">
            <span className="material-symbols-outlined text-[20px] text-blue-500">deploy</span>
          </div>
          <div>
            <h3 className="font-semibold text-[15px]">Vercel Deployment Patch</h3>
            <p className="text-xs text-text-muted">Free hosting on Vercel · Zero config</p>
          </div>
        </div>
        <p className="text-sm text-text-muted mb-1 leading-relaxed">
          In-memory SQLite, HMAC cookie auth, direct in-process model testing, auto-detect Vercel environment — deploy 9Router to Vercel for free.
        </p>
        <p className="text-sm mb-4">
          by <span className="font-semibold text-primary">Dika</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <CreditLink href="https://t.me/dikaacode" color="telegram" label="Telegram"
            icon={<TelegramIcon />} />
          <CreditLink href="https://www.obitoglory.tech" color="website" label="Website"
            icon={<span className="material-symbols-outlined text-[16px]">language</span>} />
          <CreditLink href="https://saweria.co/dikatech" color="donate" label="Donate ☕"
            icon={<span className="material-symbols-outlined text-[16px]">favorite</span>} />
          <CreditLink href="https://github.com/dikaofc" color="github" label="GitHub"
            icon={<span className="material-symbols-outlined text-[16px]">open_in_new</span>} />
        </div>
      </div>

      {/* Donate CTA */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6 text-center">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
        <div className="relative">
          <span className="material-symbols-outlined text-[36px] text-primary mb-3 block">volunteer_activism</span>
          <h3 className="font-semibold text-lg mb-1.5">Support the Developer</h3>
          <p className="text-sm text-text-muted mb-5 max-w-sm mx-auto">
            If this patch saved you money on hosting, buy a coffee! ☕
          </p>
          <a href="https://saweria.co/dikatech" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 transition-all duration-200 hover:shadow-amber-500/40 hover:scale-[1.03] active:scale-[0.98]">
            <span className="material-symbols-outlined text-[18px]">coffee</span>
            Buy Me a Coffee
          </a>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-[11px] text-text-muted/60 mt-8 pb-4">
        9Router v0.5.55 · Vercel Patch · Made with ❤️
      </p>
    </div>
  );
}
