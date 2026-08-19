"use client";

import { useState, useEffect } from "react";

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white inline-block" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

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

  useEffect(() => {
    if (retryAfter <= 0) return;
    const id = setInterval(() => setRetryAfter((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [retryAfter]);

  useEffect(() => {
    async function checkAuth() {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(`${window.location.origin}/api/auth/status`, { signal: controller.signal });
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
      } catch {
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
        if (data.mustChangePassword) { setMustChange(true); return; }
        window.location.assign("/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "Invalid password");
        if (data.resetHint) setResetHint(data.resetHint);
        if (data.retryAfter) setRetryAfter(Number(data.retryAfter));
      }
    } catch {
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
      if (res.ok) { window.location.assign("/dashboard"); }
      else { const data = await res.json(); setError(data.error || "Failed"); }
    } catch {
      setError("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const isSsoEnabled = ["sso", "oidc", "saml", "both"].includes(authMode);
  const activeSsoType = ssoType || (authMode === "saml" ? "saml" : "oidc");
  const samlAvailable = isSsoEnabled && activeSsoType === "saml" && samlConfigured;
  const oidcAvailable = isSsoEnabled && activeSsoType === "oidc" && oidcConfigured;
  const ssoAvailable = samlAvailable || oidcAvailable;
  const passwordAvailable = authMode === "password" || authMode === "both" || !ssoAvailable;

  if (hasPassword === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c1018]">
        <div className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400">
          <Spinner /> Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c1018] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo + Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-3">
            <span className="material-symbols-outlined text-white text-[22px]">hub</span>
          </div>
          <h1 className="text-xl font-bold text-white">9Router</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {samlAvailable ? "SAML 2.0 SSO" : oidcAvailable ? "OIDC Login" : "Enter password to continue"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#141a26] border border-white/10 rounded-xl p-5">
          {mustChange ? (
            <form onSubmit={handleSetNewPassword} className="space-y-3">
              <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                Set a new password before continuing.
              </p>
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required autoFocus
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {error && <p className="text-xs text-rose-400">{error}</p>}
              <button
                type="submit"
                disabled={loading || !newPassword}
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Spinner /> : "Set Password"}
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              {/* SSO Buttons */}
              {samlAvailable && (
                <button onClick={() => { window.location.href = "/api/auth/saml/start"; }}
                  className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium border border-white/10 transition-colors">
                  {samlLoginLabel}
                </button>
              )}
              {oidcAvailable && (
                <button onClick={() => { window.location.href = "/api/auth/oidc/start"; }}
                  className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium border border-white/10 transition-colors">
                  {oidcLoginLabel}
                </button>
              )}
              {ssoAvailable && passwordAvailable && (
                <div className="flex items-center gap-2 text-[11px] text-slate-600">
                  <div className="flex-1 h-px bg-white/10" />
                  <span>OR</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
              )}

              {/* Password Form */}
              {passwordAvailable && (
                <form onSubmit={handleLogin} className="space-y-3">
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required autoFocus={!oidcAvailable}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />

                  {error && <p className="text-xs text-rose-400">{error}</p>}

                  {retryAfter > 0 && (
                    <p className="text-xs text-rose-400">Locked. Retry in {retryAfter}s.</p>
                  )}

                  {resetHint && (
                    <p className="text-xs text-slate-500">
                      Forgot? Run <code className="text-slate-400">9router</code> → Settings → Reset Password
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || retryAfter > 0}
                    className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Spinner /> : retryAfter > 0 ? `Wait ${retryAfter}s` : "Login"}
                  </button>
                </form>
              )}

              {!passwordAvailable && error && (
                <p className="text-xs text-rose-400 text-center">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-[11px] text-slate-600 space-x-1">
          <a href="https://t.me/dikaacode" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">@dikaacode</a>
          <span>·</span>
          <a href="https://www.obitoglory.tech" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">obitoglory.tech</a>
          <span>·</span>
          <a href="https://saweria.co/dikatech" target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 transition-colors">Donate ☕</a>
        </div>
      </div>
    </div>
  );
}
