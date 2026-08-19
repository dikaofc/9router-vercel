"use client";

import { useState } from "react";

const Win98Button = ({ children, onClick, href, primary }) => (
  <a
    href={href}
    onClick={onClick}
    target={href ? "_blank" : undefined}
    rel={href ? "noopener noreferrer" : undefined}
    className={`inline-block px-3 py-1 text-xs font-[Tahoma,sans-serif] cursor-pointer select-none
      border border-t-white border-l-white border-b-[#808080] border-r-[#808080]
      bg-[#c0c0c0] text-black active:border-t-[#808080] active:border-l-[#808080] active:border-b-white active:border-r-white
      ${primary ? "font-bold" : ""}`}
  >
    {children}
  </a>
);

const Win98Card = ({ title, children }) => (
  <div className="border border-t-white border-l-white border-b-[#808080] border-r-[#808080] bg-[#c0c0c0] p-0">
    <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-0.5 text-white text-xs font-bold font-[Tahoma,sans-serif] flex items-center">
      {title}
    </div>
    <div className="p-3">{children}</div>
  </div>
);

export default function CreditsPage() {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#008080] flex items-start justify-center p-4 sm:p-8 font-[Tahoma,sans-serif]">
      <div className="w-full max-w-lg">
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1 flex items-center justify-between text-white text-xs font-bold">
          <span>📋 Credits</span>
          <div className="flex gap-0.5">
            <span className="w-4 h-3 bg-[#c0c0c0] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] text-black text-[8px] leading-none flex items-center justify-center cursor-default">_</span>
            <span className="w-4 h-3 bg-[#c0c0c0] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] text-black text-[8px] leading-none flex items-center justify-center cursor-default">□</span>
            <span className="w-4 h-3 bg-[#c0c0c0] border border-t-[#808080] border-l-[#808080] border-b-white border-r-white text-black text-[8px] leading-none flex items-center justify-center cursor-default font-bold">×</span>
          </div>
        </div>

        <div className="bg-[#c0c0c0] border border-t-[#c0c0c0] border-l-[#c0c0c0] border-b-[#808080] border-r-[#808080] p-3 space-y-3">
          {/* 9Router */}
          <Win98Card title="9Router v0.5.55">
            <p className="text-xs text-black leading-relaxed mb-2">
              Original project by <b>decolua</b> &amp; contributors — 40+ AI providers,
              RTK token saver, auto-fallback routing.
            </p>
            <div className="flex gap-1 flex-wrap">
              <Win98Button href="https://github.com/decolua/9router">GitHub</Win98Button>
              <Win98Button href="https://www.npmjs.com/package/9router">npm</Win98Button>
            </div>
          </Win98Card>

          {/* Vercel Patch */}
          <Win98Card title="Vercel Deployment Patch">
            <p className="text-xs text-black leading-relaxed mb-2">
              Free hosting on Vercel — in-memory SQLite, HMAC auth,
              zero config. Created by <b>Dika</b>.
            </p>
            <div className="flex gap-1 flex-wrap">
              <Win98Button href="https://t.me/dikaacode">Telegram</Win98Button>
              <Win98Button href="https://www.obitoglory.tech">Website</Win98Button>
              <Win98Button href="https://saweria.co/dikatech">Donate ☕</Win98Button>
              <Win98Button href="https://github.com/dikaofc">GitHub</Win98Button>
            </div>
          </Win98Card>

          {/* Donate */}
          <Win98Card title="Support">
            <p className="text-xs text-black leading-relaxed mb-2">
              If this patch saved you money, buy a coffee! ☕
            </p>
            <div className="flex gap-1">
              <Win98Button href="https://saweria.co/dikatech" primary>
                ☕ Buy Me a Coffee
              </Win98Button>
              <Win98Button onClick={handleShare}>
                {copied ? "✓ Copied!" : "📎 Copy Link"}
              </Win98Button>
            </div>
          </Win98Card>

          {/* Status Bar */}
          <div className="border border-t-[#808080] border-l-[#808080] border-b-white border-r-white bg-[#c0c0c0] px-2 py-0.5 text-[10px] text-black flex justify-between">
            <span>9Router v0.5.55 · Vercel Patch</span>
            <span>Made with ❤️</span>
          </div>
        </div>
      </div>
    </div>
  );
}
