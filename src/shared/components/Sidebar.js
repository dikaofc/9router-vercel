"use client";

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/utils/cn";
import { APP_CONFIG } from "@/shared/constants/config";
import { MEDIA_PROVIDER_KINDS } from "@/shared/constants/providers";
import { useCopyToClipboard } from "@/shared/hooks/useCopyToClipboard";
import ThemeToggle from "./ThemeToggle";
import { ConfirmModal } from "./Modal";
import NineRemotePromoModal from "./NineRemotePromoModal";

const VISIBLE_MEDIA_KINDS = ["embedding", "image", "video", "tts", "stt"];
const COMBINED_WEB_ITEM = { id: "web", label: "Web Fetch & Search", icon: "travel_explore", href: "/dashboard/media-providers/web" };

const navItems = [
  { href: "/dashboard/endpoint", label: "Endpoint & Key", icon: "api" },
  { href: "/dashboard/providers", label: "Providers", icon: "dns" },
  { href: "/dashboard/combos", label: "Combo & Vision Adapter", icon: "layers" },
  { href: "/dashboard/usage", label: "Usage", icon: "bar_chart" },
  { href: "/dashboard/quota", label: "Quota Tracker", icon: "data_usage" },
  { href: "/dashboard/token-saver", label: "Token Saver", icon: "savings" },
  { href: "/dashboard/cli-tools", label: "CLI Tools", icon: "terminal" },
];

const systemItems = [
  { href: "/dashboard/proxy-pools", label: "Proxy Pools", icon: "lan" },
  { href: "/dashboard/skills", label: "Skills", icon: "extension" },
];

const debugItems = [
  { href: "/dashboard/console-log", label: "Console Log", icon: "terminal" },
  { href: "/dashboard/translator", label: "Translator", icon: "translate" },
];

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();
  const [mediaOpen, setMediaOpen] = useState(false);
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [enableTranslator, setEnableTranslator] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [shutdownCountdown, setShutdownCountdown] = useState(0);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { copied, copy } = useCopyToClipboard(2000);

  const INSTALL_CMD = "npm i -g 9router@latest";

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => { if (d.enableTranslator) setEnableTranslator(true); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/version")
      .then((r) => r.json())
      .then((d) => { if (d.hasUpdate) setUpdateInfo(d); })
      .catch(() => {});
  }, []);

  const isActive = (href) => {
    if (href === "/dashboard/endpoint") return pathname === "/dashboard" || pathname.startsWith("/dashboard/endpoint");
    return pathname.startsWith(href);
  };

  const handleUpdate = () => {
    setShowUpdateModal(false);
    setIsUpdating(true);
  };

  const handleCopyAndShutdown = async () => {
    try { await navigator.clipboard.writeText(INSTALL_CMD); } catch { /* */ }
    copy(INSTALL_CMD);
    let remaining = 10;
    setShutdownCountdown(remaining);
    const timer = setInterval(() => {
      remaining -= 1;
      setShutdownCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        fetch("/api/version/shutdown", { method: "POST" }).catch(() => {});
        setIsDisconnected(true);
      }
    }, 1000);
  };

  const handleCancelUpdate = () => {
    setIsUpdating(false);
    setShutdownCountdown(0);
  };

  const NavLink = ({ item, onClick }) => (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-xl transition-all",
        isActive(item.href)
          ? "bg-primary/10 text-primary font-medium"
          : "text-text-muted hover:bg-surface-2 hover:text-text-main"
      )}
    >
      <span className={cn("material-symbols-outlined text-[18px]", isActive(item.href) ? "fill-1" : "")}>
        {item.icon}
      </span>
      <span className="text-sm">{item.label}</span>
    </Link>
  );

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sheet Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-[70] w-[280px] bg-surface border-r border-border flex flex-col transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-white text-[18px]">hub</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-text-main leading-tight">{APP_CONFIG.name}</h1>
              <span className="text-[10px] text-text-muted">v{APP_CONFIG.version}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-2 transition-colors">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Update Banner */}
        {updateInfo && (
          <div className="mx-3 mb-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
            <span className="text-[11px] font-semibold text-green-600 dark:text-green-400">
              ↑ v{updateInfo.latestVersion} available
            </span>
            <button onClick={() => setShowUpdateModal(true)} className="mt-1 w-full py-1 rounded bg-green-600 hover:bg-green-700 text-white text-[11px] font-semibold transition-colors">
              Update
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 custom-scrollbar">
          {/* Main nav */}
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} onClick={onClose} />
          ))}

          <div className="pt-3 mt-2 space-y-0.5">
            <p className="px-3 text-[10px] font-semibold text-text-muted/60 uppercase tracking-wider mb-1">System</p>

            {/* Media Providers */}
            <button
              onClick={() => setMediaOpen((v) => !v)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all",
                pathname.startsWith("/dashboard/media-providers")
                  ? "bg-primary/10 text-primary"
                  : "text-text-muted hover:bg-surface-2 hover:text-text-main"
              )}
            >
              <span className="material-symbols-outlined text-[18px]">perm_media</span>
              <span className="text-sm flex-1 text-left">Media Providers</span>
              <span className="material-symbols-outlined text-[14px] transition-transform" style={{ transform: mediaOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                expand_more
              </span>
            </button>
            {mediaOpen && (
              <div className="pl-4">
                {MEDIA_PROVIDER_KINDS.filter((k) => VISIBLE_MEDIA_KINDS.includes(k.id)).map((kind) => (
                  <Link
                    key={kind.id}
                    href={`/dashboard/media-providers/${kind.id}`}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-4 py-1.5 rounded-lg transition-all text-sm",
                      pathname.startsWith(`/dashboard/media-providers/${kind.id}`)
                        ? "bg-primary/10 text-primary"
                        : "text-text-muted hover:bg-surface-2 hover:text-text-main"
                    )}
                  >
                    <span className="material-symbols-outlined text-[16px]">{kind.icon}</span>
                    {kind.label}
                  </Link>
                ))}
                <Link
                  href={COMBINED_WEB_ITEM.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-1.5 rounded-lg transition-all text-sm",
                    pathname.startsWith(COMBINED_WEB_ITEM.href)
                      ? "bg-primary/10 text-primary"
                      : "text-text-muted hover:bg-surface-2 hover:text-text-main"
                  )}
                >
                  <span className="material-symbols-outlined text-[16px]">{COMBINED_WEB_ITEM.icon}</span>
                  {COMBINED_WEB_ITEM.label}
                </Link>
              </div>
            )}

            {systemItems.map((item) => (
              <NavLink key={item.href} item={item} onClick={onClose} />
            ))}

            {debugItems.map((item) => {
              const show = item.href !== "/dashboard/translator" || enableTranslator;
              return show ? <NavLink key={item.href} item={item} onClick={onClose} /> : null;
            })}

            {/* 9Remote */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowRemoteModal(true); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-text-muted hover:bg-surface-2 hover:text-text-main"
            >
              <span className="material-symbols-outlined text-[18px]">computer</span>
              <span className="text-sm">9Remote</span>
            </button>

            {/* 9English */}
            <a
              href="https://9english.net/"
              target="_blank"
              rel="noreferrer"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-text-muted hover:bg-surface-2 hover:text-text-main"
            >
              <span className="material-symbols-outlined text-[18px]">translate</span>
              <span className="text-sm">9English</span>
            </a>

            <div className="w-full h-px bg-border my-1" />

            {/* Settings */}
            <NavLink item={{ href: "/dashboard/profile", label: "Settings", icon: "settings" }} onClick={onClose} />

            {/* Credits */}
            <NavLink item={{ href: "/dashboard/credits", label: "Credits", icon: "favorite" }} onClick={onClose} />
          </div>
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-border flex items-center justify-between">
          <ThemeToggle />
          <button
            onClick={async () => {
              try {
                const res = await fetch("/api/auth/logout", { method: "POST" });
                if (res.ok) window.location.assign("/login");
              } catch { /* */ }
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-text-muted hover:bg-rose-500/10 hover:text-rose-400 transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">logout</span>
            Logout
          </button>
        </div>
      </div>

      {/* Modals */}
      <NineRemotePromoModal isOpen={showRemoteModal} onClose={() => setShowRemoteModal(false)} />
      <ConfirmModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onConfirm={handleUpdate}
        title="Update 9Router"
        message={`Show install command for v${updateInfo?.latestVersion || ""}?`}
        confirmText="Show Command"
        cancelText="Cancel"
        variant="primary"
      />

      {/* Update Panel / Disconnected Overlay */}
      {(isDisconnected || isUpdating) && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          {isUpdating ? (
            <div className="w-full max-w-lg rounded-xl bg-neutral-900/95 border border-white/10 p-6 text-white">
              <h2 className="text-lg font-semibold mb-2">Update 9Router{updateInfo?.latestVersion ? ` to v${updateInfo.latestVersion}` : ""}</h2>
              <p className="text-xs text-white/60 mb-3">
                {isDisconnected ? "Server stopped. Paste the command to install." : shutdownCountdown > 0 ? `Command copied. Server stops in ${shutdownCountdown}s...` : "Click Copy & Shutdown."}
              </p>
              <code className="block text-xs font-mono text-amber-400 bg-white/5 p-2 rounded mb-3 break-all">{INSTALL_CMD}</code>
              {isDisconnected ? (
                <button onClick={() => globalThis.location.reload()} className="w-full py-2 rounded bg-white/10 text-white text-sm font-medium">Reload</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleCancelUpdate} disabled={shutdownCountdown > 0} className="px-4 py-2 rounded bg-white/10 text-white text-sm disabled:opacity-50">Cancel</button>
                  <button onClick={handleCopyAndShutdown} disabled={shutdownCountdown > 0} className="flex-1 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50">
                    {copied ? "Copied!" : shutdownCountdown > 0 ? `Shutting down in ${shutdownCountdown}s` : "Copy & Shutdown"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-red-500 text-[24px]">power_off</span>
              </div>
              <h2 className="text-lg font-semibold text-white mb-1">Disconnected</h2>
              <p className="text-sm text-white/60 mb-4">Server has stopped.</p>
              <button onClick={() => globalThis.location.reload()} className="px-4 py-2 rounded bg-white/10 text-white text-sm font-medium">Reload</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

Sidebar.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
