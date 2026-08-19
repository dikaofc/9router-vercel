"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
const COMBINED_WEB_ITEM = { id: "web", label: "Web", icon: "travel_explore", href: "/dashboard/media-providers/web" };

const navItems = [
  { href: "/dashboard/endpoint", label: "Endpoint", icon: "api" },
  { href: "/dashboard/providers", label: "Providers", icon: "dns" },
  { href: "/dashboard/combos", label: "Combo", icon: "layers" },
  { href: "/dashboard/usage", label: "Usage", icon: "bar_chart" },
  { href: "/dashboard/quota", label: "Quota", icon: "data_usage" },
  { href: "/dashboard/token-saver", label: "Saver", icon: "savings" },
  { href: "/dashboard/cli-tools", label: "CLI", icon: "terminal" },
];

const systemItems = [
  { href: "/dashboard/proxy-pools", label: "Proxy", icon: "lan" },
  { href: "/dashboard/skills", label: "Skills", icon: "extension" },
];

const debugItems = [
  { href: "/dashboard/console-log", label: "Log", icon: "terminal" },
  { href: "/dashboard/translator", label: "Translate", icon: "translate" },
];

export default function Sidebar({ onClose }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const [dropdown, setDropdown] = useState(null);
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [enableTranslator, setEnableTranslator] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const lastScroll = useRef(0);
  const { copied, copy } = useCopyToClipboard(2000);

  // Auto-hide: hide on scroll down, show on scroll up
  const handleScroll = useCallback(() => {
    const el = document.querySelector("[data-scroll-container]");
    if (!el) return;
    const y = el.scrollTop;
    if (y > 80) {
      setVisible(y < lastScroll.current);
    } else {
      setVisible(true);
    }
    lastScroll.current = y;
  }, []);

  useEffect(() => {
    const el = document.querySelector("[data-scroll-container]");
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

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

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdown) return;
    const handler = () => setDropdown(null);
    document.addEventListener("click", handler, { once: true });
    return () => document.removeEventListener("click", handler);
  }, [dropdown]);

  const handleTabClick = (e, href) => {
    e.preventDefault();
    onClose?.();
    setDropdown(null);
    window.location.href = href;
  };

  return (
    <>
      {/* Floating Tab Bar */}
      <div
        className={cn(
          "fixed top-3 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out",
          visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-xl bg-surface/90 backdrop-blur-xl border border-border shadow-lg shadow-black/5">
          {/* Logo */}
          <Link href="/dashboard" onClick={(e) => handleTabClick(e, "/dashboard")} className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-surface-2 transition-colors shrink-0">
            <span className="material-symbols-outlined text-[16px] text-primary">hub</span>
            <span className="text-xs font-semibold text-text-main hidden sm:inline">{APP_CONFIG.name}</span>
          </Link>

          <div className="w-px h-4 bg-border mx-0.5" />

          {/* Main Nav - scrollable */}
          <div className="flex items-center gap-0.5 overflow-x-auto max-w-[50vw] sm:max-w-none scrollbar-none">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleTabClick(e, item.href)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all shrink-0",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-text-muted hover:bg-surface-2 hover:text-text-main"
                )}
              >
                <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            ))}

            {/* More dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdown(dropdown === "more" ? null : "more");
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-text-muted hover:bg-surface-2 hover:text-text-main transition-all"
              >
                <span className="material-symbols-outlined text-[14px]">more_horiz</span>
              </button>
              {dropdown === "more" && (
                <div className="absolute top-full right-0 mt-1 w-44 rounded-xl bg-surface/95 backdrop-blur-xl border border-border shadow-xl p-1 animate-in fade-in slide-in-from-top-1">
                  <p className="px-2 py-1 text-[10px] font-semibold text-text-muted/60 uppercase tracking-wider">System</p>
                  {systemItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={(e) => handleTabClick(e, item.href)}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all",
                        isActive(item.href) ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-surface-2 hover:text-text-main"
                      )}
                    >
                      <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                  {debugItems.map((item) => {
                    if (item.href === "/dashboard/translator" && !enableTranslator) return null;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={(e) => handleTabClick(e, item.href)}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all",
                          isActive(item.href) ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-surface-2 hover:text-text-main"
                        )}
                      >
                        <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
                        {item.label}
                      </Link>
                    );
                  })}
                  <div className="w-full h-px bg-border my-1" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowRemoteModal(true); setDropdown(null); }}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-text-muted hover:bg-surface-2 hover:text-text-main w-full transition-all"
                  >
                    <span className="material-symbols-outlined text-[15px]">computer</span>
                    9Remote
                  </button>
                  <a
                    href="https://9english.net/"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setDropdown(null)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-text-muted hover:bg-surface-2 hover:text-text-main transition-all"
                  >
                    <span className="material-symbols-outlined text-[15px]">translate</span>
                    9English
                  </a>
                  <div className="w-full h-px bg-border my-1" />
                  <Link
                    href="/dashboard/profile"
                    onClick={(e) => handleTabClick(e, "/dashboard/profile")}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all",
                      isActive("/dashboard/profile") ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-surface-2 hover:text-text-main"
                    )}
                  >
                    <span className="material-symbols-outlined text-[15px]">settings</span>
                    Settings
                  </Link>
                  <Link
                    href="/dashboard/credits"
                    onClick={(e) => handleTabClick(e, "/dashboard/credits")}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all",
                      isActive("/dashboard/credits") ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-surface-2 hover:text-text-main"
                    )}
                  >
                    <span className="material-symbols-outlined text-[15px]">favorite</span>
                    Credits
                  </Link>
                  <div className="w-full h-px bg-border my-1" />
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setDropdown(null);
                      try {
                        const res = await fetch("/api/auth/logout", { method: "POST" });
                        if (res.ok) window.location.assign("/login");
                      } catch {}
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 w-full transition-all"
                  >
                    <span className="material-symbols-outlined text-[15px]">logout</span>
                    Logout
                  </button>
                </div>
              )}
            </div>

            <div className="w-px h-4 bg-border mx-0.5" />
            <ThemeToggle />
          </div>
        </div>
      </div>

      <NineRemotePromoModal isOpen={showRemoteModal} onClose={() => setShowRemoteModal(false)} />
      <ConfirmModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onConfirm={() => { setShowUpdateModal(false); }}
        title="Update 9Router"
        message={`Show install command for v${updateInfo?.latestVersion || ""}?`}
        confirmText="Show Command"
        cancelText="Cancel"
        variant="primary"
      />
    </>
  );
}

Sidebar.propTypes = {
  onClose: PropTypes.func,
};
