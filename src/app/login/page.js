"use client";

import React, { useState, useEffect } from "react";

// --- Sub-components for Iconography (Cleaner than Emojis / Native Feel) ---
const RouterLogo = () => (
  <svg className="w-10 h-10 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="14" width="20" height="8" rx="2" />
    <path d="M6 18h.01" />
    <path d="M10 18h.01" />
    <path d="M15 10a4 4 0 0 1 4 4" />
    <path d="M17 7a8 8 0 0 1 5 7" />
    <path d="M9 10a4 4 0 0 0-4 4" />
    <path d="M7 7a8 8 0 0 0-5 7" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const ShieldAlertIcon = () => (
  <svg className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetHint, setResetHint] = useState("");
  const [retryAfter, setRetryAfter] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasPassword, setHasPassword] = useState(null);
  const [authMode, setAuthMode] = useState("password");
  const [ssoType, setSsoType] = useState("oidc");
  const [oidcConfigured, setOidcConfigured] = useState(false);
  const [oidcLoginLabel, setOidcLoginLabel] = useState("Sign in with OIDC");
  const [samlConfigured, setSamlConfigured] = useState(false);
  const [samlLoginLabel, setSamlLoginLabel] = useState("Sign in with SAML SSO");
  const [mustChange, setMustChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Countdown for rate-limit
  useEffect(() => {
    if (retryAfter <= 0) return;
    const id = setInterval(() => setRetryAfter((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [retryAfter]);

  useEffect(() => {
    async function checkAuth() {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

      try {
        const res = await fetch(`${baseUrl}/api/auth/status`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.authenticated === true || data.requireLogin === false) {
            window.location.assign("/dashboard");
            return;
          }
          setHasPassword(!!data.hasPassword);
          setAuthMode(data.authMode || "password");
          setSsoType(data.ssoType || "oidc");
          setOidcConfigured(data.oidcConfigured === true);
          setOidcLoginLabel(data.oidcLoginLabel || "Sign in with OIDC");
          setSamlConfigured(data.samlConfigured === true);
          setSamlLoginLabel(data.samlLoginLabel || "Sign in with SAML SSO");
        } else {
          setHasPassword(true);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        setHasPassword(true);
      }
    }
    checkAuth();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResetHint("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.mustChangePassword) {
          setMustChange(true);
          return;
        }
        window.location.assign("/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "Invalid password");
        if (data.resetHint) setResetHint(data.resetHint);
        if (data.retryAfter) setRetryAfter(Number(data.retryAfter));
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: password, newPassword }),
      });
      if (res.ok) {
        window.location.assign("/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to set password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOidcLogin = () => {
    window.location.href = "/api/auth/oidc/start";
  };

  const handleSamlLogin = () => {
    window.location.href = "/api/auth/saml/start";
  };

  const isSsoEnabled = ["sso", "oidc", "saml", "both"].includes(authMode);
  const activeSsoType = ssoType || (authMode === "saml" ? "saml" : "oidc");

  const samlAvailable = isSsoEnabled && activeSsoType === "saml" && samlConfigured;
  const oidcAvailable = isSsoEnabled && activeSsoType === "oidc" && oidcConfigured;
  const ssoAvailable = samlAvailable || oidcAvailable;

  const passwordAvailable = authMode === "password" || authMode === "both" || !ssoAvailable;

  // Initial Loader - Liquid Glass Pill
  if (hasPassword === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <div className="flex items-center gap-3 px-6 py-3.5 rounded-full bg-white/10 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/20 shadow-2xl animate-pulse">
          <Spinner />
          <span className="text-sm font-medium tracking-wide text-white/80">Checking authentication...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0d14] text-slate-100 p-4 sm:p-6 relative overflow-hidden font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Background Ambient Liquid Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/25 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '10s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Grid Pattern overlay with low opacity */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.15] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" 
        aria-hidden="true" 
      />

      <div className="relative z-10 w-full max-w-md transition-all duration-500 ease-out">
        
        {/* Header Section */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="mb-4 p-3.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] ring-1 ring-white/10 group hover:scale-105 transition-transform duration-300">
            <RouterLogo />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm mb-1.5">
            9Router
          </h1>
          <p className="text-sm text-slate-300/80 max-w-xs leading-relaxed font-normal">
            {samlAvailable
              ? "Sign in with SAML 2.0 Single Sign-On"
              : oidcAvailable
              ? "Sign in with your OIDC provider to access dashboard"
              : "Enter your password to access the gateway control panel"}
          </p>
        </div>

        {/* Liquid Glass Card */}
        <div className="relative group">
          {/* Subtle outer glow border */}
          <div className="absolute -inset-0.5 bg-gradient-to-b from-white/20 via-white/5 to-transparent rounded-[28px] blur-sm opacity-75 group-hover:opacity-100 transition duration-500" />

          <div className="relative rounded-[26px] bg-white/[0.07] backdrop-blur-2xl border border-white/15 p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-black/5">
            
            {mustChange ? (
              <form onSubmit={handleSetNewPassword} className="flex flex-col gap-5">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
                  <ShieldAlertIcon />
                  <span>Set a new strong password before accessing the dashboard remotely.</span>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300/90 ml-1">
                    New Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      autoFocus
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-white/15 text-white placeholder-slate-400/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/80 transition-all text-sm backdrop-blur-md"
                    />
                  </div>
                  {error && <p className="text-xs text-rose-400 mt-1 ml-1">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading || !newPassword}
                  className="w-full mt-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-sm font-semibold shadow-[0_4px_20px_rgba(79,70,229,0.4)] border border-indigo-400/30 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
                >
                  {loading ? <Spinner /> : "Set password"}
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-5">
                {/* SSO Buttons */}
                {samlAvailable && (
                  <button
                    type="button"
                    onClick={handleSamlLogin}
                    className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white text-sm font-semibold border border-white/20 shadow-lg backdrop-blur-md transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {samlLoginLabel}
                  </button>
                )}

                {oidcAvailable && (
                  <button
                    type="button"
                    onClick={handleOidcLogin}
                    className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white text-sm font-semibold border border-white/20 shadow-lg backdrop-blur-md transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {oidcLoginLabel}
                  </button>
                )}

                {ssoAvailable && passwordAvailable && (
                  <div className="relative my-1 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <span className="relative px-3 text-[11px] font-medium tracking-wider text-slate-400 uppercase bg-[#0c1018]/80 backdrop-blur-xl rounded-full border border-white/5">
                      OR
                    </span>
                  </div>
                )}

                {/* Password Form */}
                {passwordAvailable ? (
                  <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    {isSsoEnabled && !ssoAvailable && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
                        <ShieldAlertIcon />
                        <span>
                          {activeSsoType === "saml" ? "SAML SSO" : "OIDC"} login is enabled, but configuration is incomplete. Password login is active for recovery.
                        </span>
                      </div>
                    )}

                    {authMode === "both" && ssoAvailable && (
                      <p className="text-xs text-slate-300/70 text-center font-normal">
                        Password and {activeSsoType === "saml" ? "SAML SSO" : "OIDC"} authentication are both enabled.
                      </p>
                    )}

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300/90 flex items-center gap-1.5">
                          <LockIcon /> Password
                        </label>
                      </div>

                      <div className="relative">
                        <input
                          type="password"
                          placeholder="Enter password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoFocus={!oidcAvailable}
                          className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-white/15 text-white placeholder-slate-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/80 transition-all text-sm backdrop-blur-md"
                        />
                      </div>

                      {error && (
                        <p className="text-xs text-rose-400 font-medium mt-1 ml-1 flex items-center gap-1">
                          {error}
                        </p>
                      )}

                      {retryAfter > 0 && (
                        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs mt-1">
                          Locked out. Retry in <span className="font-mono font-bold text-white">{retryAfter}s</span>.
                        </div>
                      )}

                      {resetHint && (
                        <p className="text-xs text-slate-300/70 leading-relaxed mt-1 ml-1">
                          Forgot password? Run <code className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-[11px]">9router</code> CLI on host → <b>Settings</b> → <b>Reset Password</b>.
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading || retryAfter > 0}
                      className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.98] text-white text-sm font-semibold shadow-[0_4px_25px_rgba(79,70,229,0.35)] border border-indigo-400/30 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
                    >
                      {loading ? (
                        <Spinner />
                      ) : retryAfter > 0 ? (
                        `Wait ${retryAfter}s`
                      ) : (
                        "Login"
                      )}
                    </button>

                    <div className="pt-2 border-t border-white/5 text-center flex flex-col gap-1.5">
                      <p className="text-xs text-slate-400">
                        Default password: <code className="bg-white/10 px-1.5 py-0.5 rounded text-indigo-200 font-mono text-[11px]">123456</code>
                      </p>
                      {hasPassword === false && (
                        <p className="text-[11px] text-amber-300/90 font-medium">
                          Security note: No password set. You will be prompted on remote access.
                        </p>
                      )}
                    </div>
                  </form>
                ) : (
                  error && <p className="text-xs text-rose-400 text-center font-medium">{error}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Credit - Clean Minimal Glass Pill */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] backdrop-blur-md border border-white/10 text-[11px] text-slate-400 shadow-sm">
            <span>Vercel Patch by</span>
            <a 
              href="https://t.me/dikaacode" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-indigo-300 hover:text-indigo-200 font-medium transition-colors underline decoration-indigo-400/30 underline-offset-2"
            >
              @dikaacode
            </a>
            <span className="text-white/20">•</span>
            <a 
              href="https://www.obitoglory.tech" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-indigo-300 hover:text-indigo-200 font-medium transition-colors underline decoration-indigo-400/30 underline-offset-2"
            >
              obitoglory.tech
            </a>
            <span className="text-white/20">•</span>
            <a 
              href="https://saweria.co/dikatech" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              Donate ☕
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}

