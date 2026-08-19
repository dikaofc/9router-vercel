"use client";

import { Card } from "@/shared/components";

export default function CreditsPage() {
  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">
      {/* Hero */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
          <span className="material-symbols-outlined text-[40px] text-primary">favorite</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Credits</h1>
        <p className="text-text-muted text-sm">
          Built with love by the open source community
        </p>
      </div>

      {/* Original Project */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 shrink-0">
            <span className="material-symbols-outlined text-[24px] text-green-500">code</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base mb-1">9Router</h3>
            <p className="text-sm text-text-muted mb-3">
              Free AI Router & Token Saver — the original project by{" "}
              <a
                href="https://github.com/decolua/9router"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                decolua
              </a>
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://github.com/decolua/9router"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-2/80 text-xs font-medium transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                GitHub
              </a>
              <a
                href="https://www.npmjs.com/package/9router"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-2/80 text-xs font-medium transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                npm
              </a>
            </div>
          </div>
        </div>
      </Card>

      {/* Vercel Patch Developer */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 shrink-0">
            <span className="material-symbols-outlined text-[24px] text-blue-500">deploy</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base mb-1">Vercel Deployment Patch</h3>
            <p className="text-sm text-text-muted mb-1">
              In-memory SQLite adapter, HMAC auth, direct in-process model testing, and zero-config Vercel deployment
            </p>
            <p className="text-sm text-text-muted mb-3">
              by{" "}
              <span className="font-semibold text-primary">Dika</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://t.me/dikaacode"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#26A5E4]/10 hover:bg-[#26A5E4]/20 text-[#26A5E4] text-xs font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 7.47l-1.97 9.28c-.15.67-.54.83-1.09.52l-3.02-2.22-1.46 1.4c-.16.16-.3.3-.61.3l.22-3.05 5.56-5.02c.24-.22-.05-.33-.37-.14L8.6 13.25l-2.96-.93c-.65-.2-.66-.65.14-.96l11.55-4.46c.54-.2 1.01.13.83.96l-.05.17z"/>
                </svg>
                Telegram
              </a>
              <a
                href="https://www.obitoglory.tech"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 text-xs font-medium transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">language</span>
                Website
              </a>
              <a
                href="https://saweria.co/dikatech"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 text-xs font-medium transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">favorite</span>
                Donate
              </a>
              <a
                href="https://github.com/dikaofc"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-2/80 text-xs font-medium transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                GitHub
              </a>
            </div>
          </div>
        </div>
      </Card>

      {/* Support */}
      <Card>
        <div className="text-center py-4">
          <span className="material-symbols-outlined text-4xl text-primary mb-3 block">volunteer_activism</span>
          <h3 className="font-semibold mb-2">Support the Developer</h3>
          <p className="text-sm text-text-muted mb-4 max-w-md mx-auto">
            If this Vercel patch saved you money on hosting, consider buying a coffee! ☕
          </p>
          <a
            href="https://saweria.co/dikatech"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold text-sm shadow-lg shadow-yellow-500/25 transition-all hover:shadow-yellow-500/40 hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-[18px]">coffee</span>
            Buy Me a Coffee
          </a>
        </div>
      </Card>

      {/* Footer */}
      <div className="text-center text-xs text-text-muted pb-8">
        <p>
          9Router v0.5.55 · Vercel Patch · Made with ❤️
        </p>
      </div>
    </div>
  );
}
