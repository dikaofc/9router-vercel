import React, { useState } from 'react';

function CreditLink({ href, children, colorClass }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all duration-300 active:scale-[0.97] backdrop-blur-md border border-white/20 dark:border-white/10 shadow-sm hover:shadow-md hover:-translate-y-0.5 overflow-hidden ${colorClass}`}
    >
      {/* Liquid Sheen Highlight */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/25 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
      <span className="relative z-10 flex items-center gap-2 truncate">
        {children}
      </span>
    </a>
  );
}

export default function App() {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Dynamic Ambient Background Blur Lights */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/30 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/25 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[160px] pointer-events-none" />

      {/* Main Glass Shell */}
      <main className="w-full max-w-xl mx-auto relative z-10 backdrop-blur-2xl bg-white/[0.04] dark:bg-slate-900/[0.45] border border-white/15 dark:border-white/10 rounded-[32px] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all duration-500">
        
        {/* Header / Hero */}
        <div className="text-center mb-8 relative">
          <div className="relative inline-flex items-center justify-center mb-4">
            {/* Liquid Glow Icon Base */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 blur-lg opacity-60 animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-b from-white/20 to-white/5 backdrop-blur-xl border border-white/30 flex items-center justify-center shadow-inner">
              <svg className="w-8 h-8 text-cyan-400 drop-shadow-[0_2px_8px_rgba(34,211,238,0.5)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300">
            Credits & Acknowledgments
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium tracking-wide">
            Built with passion by the open-source community
          </p>
        </div>

        {/* Card 1: 9Router Original */}
        <section className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-2xl p-5 mb-4 backdrop-blur-xl transition-all duration-300 shadow-sm hover:shadow-cyan-500/5">
          <div className="flex items-center gap-3.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-base text-slate-100 tracking-tight flex items-center gap-2">
                9Router Core
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">Original</span>
              </h2>
              <p className="text-xs text-slate-400">Free AI Router & Token Saver</p>
            </div>
          </div>
          
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
            Original architecture engineered by{' '}
            <a href="https://github.com/decolua/9router" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 hover:underline font-medium transition-colors">
              decolua
            </a>{' '}
            & contributors — features 40+ providers, RTK optimization, and auto-fallback routing logic.
          </p>

          <div className="flex flex-wrap gap-2.5">
            <a
              href="https://github.com/decolua/9router"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-200 border border-white/10 hover:border-white/20 transition-all duration-200 active:scale-95"
            >
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/9router"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-200 border border-white/10 hover:border-white/20 transition-all duration-200 active:scale-95"
            >
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              npm Package
            </a>
          </div>
        </section>

        {/* Card 2: Vercel Patch */}
        <section className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-2xl p-5 mb-6 backdrop-blur-xl transition-all duration-300 shadow-sm hover:shadow-blue-500/5">
          <div className="flex items-center gap-3.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.58-5.84a14.927 14.927 0 015.84 2.58" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-base text-slate-100 tracking-tight">Vercel Deployment Patch</h2>
              <p className="text-xs text-slate-400">
                Created by <span className="text-cyan-400 font-medium">Dika</span> · Zero-config hosting
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
            Optimized for Vercel deployment with zero configuration — integrated in-memory SQLite runtime, HMAC authentication, and automatic environment detection.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <CreditLink href="https://t.me/dikaacode" colorClass="bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border-sky-500/20">
              <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 7.47l-1.97 9.28c-.15.67-.54.83-1.09.52l-3.02-2.22-1.46 1.4c-.16.16-.3.3-.61.3l.22-3.05 5.56-5.02c.24-.22-.05-.33-.37-.14L8.6 13.25l-2.96-.93c-.65-.2-.66-.65.14-.96l11.55-4.46c.54-.2 1.01.13.83.96z"/>
              </svg>
              Telegram
            </CreditLink>

            <CreditLink href="https://www.obitoglory.tech" colorClass="bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border-purple-500/20">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zM2.25 12h19.5M12 2.25a15.3 15.3 0 014 9.75 15.3 15.3 0 01-4 9.75 15.3 15.3 0 01-4-9.75 15.3 15.3 0 014-9.75z" />
              </svg>
              Website
            </CreditLink>

            <CreditLink href="https://saweria.co/dikatech" colorClass="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/20">
              <svg className="w-4 h-4 shrink-0 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              Donate
            </CreditLink>

            <CreditLink href="https://github.com/dikaofc" colorClass="bg-slate-500/10 hover:bg-slate-500/20 text-slate-300 border-slate-500/20">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              GitHub
            </CreditLink>
          </div>
        </section>

        {/* Liquid CTA Card */}
        <section className="relative overflow-hidden rounded-2xl p-6 text-center border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-orange-500/5 to-transparent backdrop-blur-2xl shadow-lg shadow-amber-500/5">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <div className="inline-flex p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 mb-3 text-amber-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 009-9H3a9 9 0 009 9zM12 3v3m-6.364 1.636l2.121 2.121m10.607-2.121l-2.121 2.121" />
              </svg>
            </div>

            <h3 className="font-bold text-lg text-slate-100 tracking-tight">Support the Developer</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 mb-5">
              If this patch saved you time & infrastructure costs, consider supporting the author!
            </p>

            <a
              href="https://saweria.co/dikatech"
              target="_blank"
              rel="noopener noreferrer"
              className="relative inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 transition-all duration-300 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-95"
            >
              <svg className="w-4 h-4 text-slate-950" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 21h18v-2H2v2zm13-5h2a3 3 0 003-3V8h-5v8zm3-10h3a1 1 0 011 1v6a1 1 0 01-1 1h-3V6zM4 16h9V3H4v13z"/>
              </svg>
              Buy Me a Coffee
            </a>
          </div>
        </section>

        {/* Footer info & share button */}
        <footer className="mt-8 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px] font-medium">
          <p>9Router v0.5.55 · Vercel Patch</p>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.75v-6.75" />
            </svg>
            {copied ? 'Copied!' : 'Copy Page Link'}
          </button>
        </footer>

      </main>
    </div>
  );
}

