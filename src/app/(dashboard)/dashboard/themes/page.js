"use client";

import { useState, useEffect, useCallback, memo, useMemo } from "react";
import { ThemeIcon } from "@/shared/components/ThemeIcons";

const THEMES = [
  { id: "ios-glass", name: "iOS Glass", desc: "Blur, translucent, rounded", style: "glass",
    l: { bg: "#f2f2f7", s: "rgba(255,255,255,0.72)", b: "rgba(0,0,0,0.08)", t: "#1c1c1e", a: "#007aff", sh: "0 2px 16px rgba(0,0,0,0.08)", sb: "rgba(255,255,255,0.8)" },
    d: { bg: "#000", s: "rgba(28,28,30,0.72)", b: "rgba(255,255,255,0.1)", t: "#f2f2f7", a: "#0a84ff", sh: "0 2px 16px rgba(0,0,0,0.4)", sb: "rgba(28,28,30,0.85)" },
    r: "16px", bl: "blur(20px) saturate(180%)", f: "-apple-system, system-ui, sans-serif" },
  { id: "liquid-glass", name: "Liquid Glass", desc: "Frosted glass + liquid", style: "glass",
    l: { bg: "#e0e5ec", s: "rgba(255,255,255,0.45)", b: "rgba(0,0,0,0.12)", t: "#1a1a2e", a: "#6366f1", sh: "0 8px 32px rgba(0,0,0,0.12)", sb: "rgba(255,255,255,0.6)" },
    d: { bg: "#0f172a", s: "rgba(30,41,59,0.6)", b: "rgba(255,255,255,0.1)", t: "#e2e8f0", a: "#818cf8", sh: "0 8px 32px rgba(0,0,0,0.4)", sb: "rgba(15,23,42,0.7)" },
    r: "16px", bl: "blur(20px) saturate(180%)", f: "system-ui, sans-serif" },
  { id: "frost", name: "Frost", desc: "Ice-blue frosted panels", style: "frost",
    l: { bg: "#e0f2fe", s: "rgba(255,255,255,0.6)", b: "rgba(56,189,248,0.35)", t: "#0c4a6e", a: "#0ea5e9", sh: "0 4px 24px rgba(14,165,233,0.12)", sb: "rgba(255,255,255,0.5)" },
    d: { bg: "#0c1929", s: "rgba(15,30,50,0.7)", b: "rgba(56,189,248,0.2)", t: "#bae6fd", a: "#38bdf8", sh: "0 4px 24px rgba(0,0,0,0.4)", sb: "rgba(12,25,41,0.8)" },
    r: "14px", bl: "blur(14px) saturate(160%)", f: "system-ui, sans-serif" },
  { id: "neon-glass", name: "Neon Glass", desc: "Glass + neon glow", style: "glass",
    l: { bg: "#f0f0ff", s: "rgba(255,255,255,0.5)", b: "rgba(139,92,246,0.3)", t: "#1e1b4b", a: "#7c3aed", sh: "0 0 20px rgba(124,58,237,0.15)", sb: "rgba(240,240,255,0.7)" },
    d: { bg: "#0a0a1a", s: "rgba(15,15,35,0.6)", b: "rgba(139,92,246,0.35)", t: "#e2e8f0", a: "#a78bfa", sh: "0 0 24px rgba(139,92,246,0.25)", sb: "rgba(10,10,26,0.8)" },
    r: "14px", bl: "blur(16px) saturate(180%)", f: "system-ui, sans-serif" },
  { id: "tinted-glass", name: "Tinted Glass", desc: "Warm amber frosted", style: "tinted",
    l: { bg: "#fef3c7", s: "rgba(255,255,255,0.5)", b: "rgba(217,119,6,0.25)", t: "#451a03", a: "#d97706", sh: "0 4px 24px rgba(217,119,6,0.12)", sb: "rgba(255,255,255,0.5)" },
    d: { bg: "#1c1005", s: "rgba(45,30,10,0.7)", b: "rgba(217,119,6,0.2)", t: "#fef3c7", a: "#fbbf24", sh: "0 4px 24px rgba(0,0,0,0.4)", sb: "rgba(28,16,5,0.8)" },
    r: "12px", bl: "blur(12px) saturate(150%)", f: "system-ui, sans-serif" },
  { id: "visionos", name: "VisionOS", desc: "Spatial floating panels", style: "visionos",
    l: { bg: "#f5f5f7", s: "rgba(255,255,255,0.8)", b: "rgba(0,0,0,0.06)", t: "#1d1d1f", a: "#1d1d1f", sh: "0 8px 40px rgba(0,0,0,0.1)", sb: "rgba(255,255,255,0.9)" },
    d: { bg: "#000", s: "rgba(29,29,31,0.75)", b: "rgba(255,255,255,0.08)", t: "#f5f5f7", a: "#f5f5f7", sh: "0 8px 40px rgba(0,0,0,0.5)", sb: "rgba(0,0,0,0.85)" },
    r: "24px", bl: "blur(24px) saturate(200%)", f: "-apple-system, system-ui, sans-serif" },
  { id: "neobrutalism", name: "Neobrutalism", desc: "Bold borders, raw aesthetic", style: "brutal",
    l: { bg: "#fef9c3", s: "#fff", b: "#000", t: "#000", a: "#ec4899", sh: "4px 4px 0 #000", sb: "#fef9c3" },
    d: { bg: "#18181b", s: "#27272a", b: "#fafafa", t: "#fafafa", a: "#f472b6", sh: "4px 4px 0 #fafafa", sb: "#18181b" },
    r: "0", bl: "none", f: "'Space Mono', monospace" },
  { id: "brutalist-fast", name: "Brutalist Fast", desc: "HTML-like, ultra fast", style: "brutal",
    l: { bg: "#fff", s: "#fff", b: "#000", t: "#000", a: "#000", sh: "3px 3px 0 #000", sb: "#fff" },
    d: { bg: "#000", s: "#111", b: "#fff", t: "#fff", a: "#fff", sh: "3px 3px 0 #fff", sb: "#000" },
    r: "0", bl: "none", f: "'Courier New', monospace", fast: true },
  { id: "minimalism", name: "Minimalism", desc: "Clean, thin lines, space", style: "minimal",
    l: { bg: "#fff", s: "#fff", b: "#f0f0f0", t: "#111", a: "#111", sh: "none", sb: "#fff" },
    d: { bg: "#0a0a0a", s: "#141414", b: "#262626", t: "#ededed", a: "#ededed", sh: "none", sb: "#0a0a0a" },
    r: "4px", bl: "none", f: "'Inter', system-ui, sans-serif" },
  { id: "swiss", name: "Swiss Minimal", desc: "Grid, strong typography", style: "minimal",
    l: { bg: "#fff", s: "#fff", b: "#d4d4d4", t: "#0a0a0a", a: "#dc2626", sh: "none", sb: "#fff" },
    d: { bg: "#0a0a0a", s: "#171717", b: "#404040", t: "#f5f5f5", a: "#ef4444", sh: "none", sb: "#0a0a0a" },
    r: "0", bl: "none", f: "'Helvetica Neue', Arial, sans-serif" },
  { id: "flat-ui", name: "Flat UI", desc: "No shadows, simple", style: "minimal",
    l: { bg: "#ecf0f1", s: "#fff", b: "#bdc3c7", t: "#2c3e50", a: "#3498db", sh: "none", sb: "#ecf0f1" },
    d: { bg: "#1a1a2e", s: "#16213e", b: "#0f3460", t: "#e8e8e8", a: "#53a8b6", sh: "none", sb: "#1a1a2e" },
    r: "4px", bl: "none", f: "'Segoe UI', system-ui, sans-serif" },
  { id: "classic", name: "Classic", desc: "Blue/gray corporate", style: "classic",
    l: { bg: "#f1f5f9", s: "#fff", b: "#e2e8f0", t: "#0f172a", a: "#2563eb", sh: "0 1px 3px rgba(0,0,0,0.08)", sb: "#f8fafc" },
    d: { bg: "#0f172a", s: "#1e293b", b: "#334155", t: "#f1f5f9", a: "#60a5fa", sh: "0 1px 3px rgba(0,0,0,0.3)", sb: "#0f172a" },
    r: "8px", bl: "none", f: "-apple-system, 'Segoe UI', Roboto, sans-serif" },
  { id: "corporate", name: "Corporate", desc: "Formal navy, structured", style: "classic",
    l: { bg: "#f8fafc", s: "#fff", b: "#cbd5e1", t: "#0f172a", a: "#1e40af", sh: "0 1px 2px rgba(0,0,0,0.06)", sb: "#f1f5f9" },
    d: { bg: "#0c1222", s: "#162032", b: "#2d4a6f", t: "#e2e8f0", a: "#60a5fa", sh: "0 1px 2px rgba(0,0,0,0.3)", sb: "#0c1222" },
    r: "6px", bl: "none", f: "'Segoe UI', system-ui, sans-serif" },
  { id: "enterprise", name: "Enterprise SaaS", desc: "Dashboard, cards", style: "classic",
    l: { bg: "#f1f5f9", s: "#fff", b: "#e2e8f0", t: "#1e293b", a: "#0284c7", sh: "0 1px 3px rgba(0,0,0,0.08)", sb: "#fff" },
    d: { bg: "#0f172a", s: "#1e293b", b: "#334155", t: "#e2e8f0", a: "#38bdf8", sh: "0 1px 3px rgba(0,0,0,0.3)", sb: "#1e293b" },
    r: "8px", bl: "none", f: "'Inter', system-ui, sans-serif" },
  { id: "professional", name: "Professional", desc: "Enterprise gray/blue", style: "pro",
    l: { bg: "#f8fafc", s: "#fff", b: "#cbd5e1", t: "#1e293b", a: "#0284c7", sh: "0 1px 2px rgba(0,0,0,0.05)", sb: "#f1f5f9" },
    d: { bg: "#0f172a", s: "#1e293b", b: "#475569", t: "#e2e8f0", a: "#38bdf8", sh: "0 1px 2px rgba(0,0,0,0.3)", sb: "#0f172a" },
    r: "6px", bl: "none", f: "'Inter', system-ui, sans-serif" },
  { id: "financial", name: "Financial", desc: "Data-focused, trustworthy", style: "pro",
    l: { bg: "#f8fafc", s: "#fff", b: "#d1d5db", t: "#111827", a: "#059669", sh: "0 1px 2px rgba(0,0,0,0.04)", sb: "#fff" },
    d: { bg: "#111827", s: "#1f2937", b: "#374151", t: "#f9fafb", a: "#34d399", sh: "0 1px 2px rgba(0,0,0,0.3)", sb: "#111827" },
    r: "4px", bl: "none", f: "'Inter', system-ui, sans-serif" },
  { id: "super-fast", name: "Super Fast", desc: "No shadows, pure speed", style: "fast",
    l: { bg: "#fff", s: "#fff", b: "#e5e7eb", t: "#000", a: "#2563eb", sh: "none", sb: "#fff" },
    d: { bg: "#000", s: "#111", b: "#333", t: "#fff", a: "#60a5fa", sh: "none", sb: "#000" },
    r: "0", bl: "none", f: "system-ui, sans-serif", fast: true },
  { id: "terminal", name: "Terminal", desc: "Monospace, black/green", style: "terminal",
    l: { bg: "#1a1a1a", s: "#222", b: "#444", t: "#00ff41", a: "#00ff41", sh: "none", sb: "#111" },
    d: { bg: "#0a0a0a", s: "#141414", b: "#333", t: "#00ff41", a: "#00ff41", sh: "none", sb: "#0a0a0a" },
    r: "0", bl: "none", f: "'Fira Code', monospace", fast: true },
  { id: "cyberpunk", name: "Cyberpunk", desc: "Neon magenta + cyan", style: "cyber",
    l: { bg: "#fdf2f8", s: "rgba(255,255,255,0.9)", b: "#ec4899", t: "#1a0520", a: "#06b6d4", sh: "0 0 12px rgba(6,182,212,0.15)", sb: "#fdf2f8" },
    d: { bg: "#0d0221", s: "rgba(13,2,33,0.9)", b: "#ff2a6d", t: "#d1f7ff", a: "#05d9e8", sh: "0 0 12px rgba(5,217,232,0.4), 4px 4px 0 #ff2a6d", sb: "rgba(13,2,33,0.95)" },
    r: "2px", bl: "blur(6px)", f: "'Share Tech Mono', monospace" },
  { id: "neon-rave", name: "Neon Rave", desc: "Pink + lime on black", style: "neon",
    l: { bg: "#fafafa", s: "#fff", b: "#16a34a", t: "#0a0a0a", a: "#d946ef", sh: "0 0 8px rgba(217,70,239,0.12)", sb: "#fafafa" },
    d: { bg: "#000", s: "#111", b: "#39ff14", t: "#fff", a: "#ff00ff", sh: "0 0 8px #ff00ff, 0 0 16px rgba(255,0,255,0.3)", sb: "#000" },
    r: "8px", bl: "none", f: "monospace" },
  { id: "aurora", name: "Aurora", desc: "Northern lights gradient", style: "aurora",
    l: { bg: "linear-gradient(135deg,#e0f2fe,#ede9fe,#fce7f3)", s: "rgba(255,255,255,0.6)", b: "rgba(139,92,246,0.25)", t: "#1e1b4b", a: "#7c3aed", sh: "0 8px 32px rgba(124,58,237,0.12)", sb: "rgba(255,255,255,0.5)" },
    d: { bg: "linear-gradient(135deg,#0c0a1a,#1a0520,#0a1628)", s: "rgba(30,20,50,0.7)", b: "rgba(139,92,246,0.25)", t: "#e2e8f0", a: "#a78bfa", sh: "0 8px 32px rgba(0,0,0,0.4)", sb: "rgba(0,0,0,0.6)" },
    r: "16px", bl: "blur(16px) saturate(180%)", f: "system-ui, sans-serif" },
  { id: "liquid-gradient", name: "Liquid Gradient", desc: "Moving gradient", style: "fluid",
    l: { bg: "linear-gradient(135deg,#667eea,#764ba2)", s: "rgba(255,255,255,0.25)", b: "rgba(255,255,255,0.35)", t: "#fff", a: "#fbbf24", sh: "0 8px 32px rgba(102,126,234,0.3)", sb: "rgba(255,255,255,0.15)" },
    d: { bg: "linear-gradient(135deg,#1e1b4b,#4c1d95)", s: "rgba(255,255,255,0.08)", b: "rgba(255,255,255,0.15)", t: "#e2e8f0", a: "#fbbf24", sh: "0 8px 32px rgba(0,0,0,0.5)", sb: "rgba(0,0,0,0.3)" },
    r: "20px", bl: "blur(16px) saturate(200%)", f: "system-ui, sans-serif" },
  { id: "y2k", name: "Y2K", desc: "Chrome, glossy, retro", style: "y2k",
    l: { bg: "#f0f0ff", s: "linear-gradient(180deg,#fff,#e8e8f0)", b: "#c0c0d0", t: "#1a1a2e", a: "#ff1493", sh: "0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)", sb: "#e8e8f0" },
    d: { bg: "#0a0a1a", s: "linear-gradient(180deg,#1a1a2e,#0d0d1a)", b: "#3a3a5c", t: "#e0e0ff", a: "#ff69b4", sh: "0 2px 8px rgba(0,0,0,0.4)", sb: "#0d0d1a" },
    r: "12px", bl: "none", f: "'Trebuchet MS', sans-serif" },
  { id: "vaporwave", name: "Vaporwave", desc: "Pink/purple/blue retro", style: "vaporwave",
    l: { bg: "#ffe4f0", s: "rgba(255,255,255,0.7)", b: "#ff69b4", t: "#4a0050", a: "#9b59b6", sh: "0 4px 16px rgba(155,89,182,0.15)", sb: "rgba(255,255,255,0.6)" },
    d: { bg: "#1a0030", s: "rgba(40,0,60,0.8)", b: "#ff69b4", t: "#ffccff", a: "#ff69b4", sh: "0 4px 16px rgba(255,105,180,0.2)", sb: "rgba(26,0,48,0.9)" },
    r: "4px", bl: "blur(8px)", f: "'Trebuchet MS', sans-serif" },
  { id: "arcade", name: "Arcade", desc: "Pixel, CRT, game UI", style: "terminal",
    l: { bg: "#1a0a2e", s: "#2a1a3e", b: "#00ff00", t: "#00ff00", a: "#ff00ff", sh: "0 0 8px rgba(0,255,0,0.3)", sb: "#0d0520" },
    d: { bg: "#0a0515", s: "#150a25", b: "#00ff00", t: "#00ff00", a: "#ff00ff", sh: "0 0 8px rgba(0,255,0,0.3)", sb: "#050210" },
    r: "0", bl: "none", f: "monospace", fast: true },
  { id: "editorial", name: "Editorial", desc: "Large type, magazine", style: "paper",
    l: { bg: "#fff", s: "#fff", b: "#e5e5e5", t: "#0a0a0a", a: "#0a0a0a", sh: "none", sb: "#fff" },
    d: { bg: "#111", s: "#1a1a1a", b: "#333", t: "#f5f5f5", a: "#f5f5f5", sh: "none", sb: "#111" },
    r: "0", bl: "none", f: "Georgia, 'Times New Roman', serif" },
  { id: "bento", name: "Bento Grid", desc: "Modular cards", style: "bento",
    l: { bg: "#f5f5f5", s: "#fff", b: "#e5e5e5", t: "#171717", a: "#2563eb", sh: "0 1px 3px rgba(0,0,0,0.06)", sb: "#f5f5f5" },
    d: { bg: "#0a0a0a", s: "#171717", b: "#262626", t: "#f5f5f5", a: "#60a5fa", sh: "0 1px 3px rgba(0,0,0,0.3)", sb: "#0a0a0a" },
    r: "16px", bl: "none", f: "system-ui, sans-serif" },
  { id: "super-3d", name: "Super 3D", desc: "Multi-layer depth", style: "threed",
    l: { bg: "#ede9fe", s: "#c4b5fd", b: "#8b5cf6", t: "#1e1b4b", a: "#5b21b6", sh: "3px 3px 0 #8b5cf6, 6px 6px 0 #5b21b6, 9px 9px 0 #3b0764", sb: "#ede9fe" },
    d: { bg: "#1e1b4b", s: "#312e81", b: "#4338ca", t: "#e0e7ff", a: "#a5b4fc", sh: "4px 4px 0 #1e1b4b, 8px 8px 0 #312e81, 12px 12px 0 #4338ca", sb: "#1e1b4b" },
    r: "4px", bl: "none", f: "'Space Mono', monospace" },
  { id: "luxury", name: "Luxury Black & Gold", desc: "Premium, exclusive", style: "luxury",
    l: { bg: "#fafaf9", s: "#fff", b: "#d4c5a0", t: "#1c1917", a: "#b8860b", sh: "0 2px 8px rgba(184,134,11,0.1)", sb: "#fafaf9" },
    d: { bg: "#0a0a0a", s: "#141414", b: "#b8860b", t: "#f5f5f4", a: "#d4a017", sh: "0 2px 12px rgba(184,134,11,0.2)", sb: "#0a0a0a" },
    r: "2px", bl: "none", f: "Georgia, 'Times New Roman', serif" },
  { id: "monochrome", name: "Monochrome", desc: "One color, very clean", style: "minimal",
    l: { bg: "#fff", s: "#fff", b: "#999", t: "#000", a: "#000", sh: "none", sb: "#fff" },
    d: { bg: "#111", s: "#1a1a1a", b: "#555", t: "#fff", a: "#fff", sh: "none", sb: "#111" },
    r: "0", bl: "none", f: "'Helvetica Neue', Arial, sans-serif" },
  { id: "dark-premium", name: "Dark Premium", desc: "Charcoal + gradients", style: "pro",
    l: { bg: "#f8f9fa", s: "#fff", b: "#dee2e6", t: "#212529", a: "#0d6efd", sh: "0 1px 3px rgba(0,0,0,0.06)", sb: "#f8f9fa" },
    d: { bg: "#121212", s: "#1e1e1e", b: "#2d2d2d", t: "#e0e0e0", a: "#4dabf7", sh: "0 2px 8px rgba(0,0,0,0.4)", sb: "#121212" },
    r: "8px", bl: "blur(8px)", f: "'Inter', system-ui, sans-serif" },
  { id: "hud", name: "HUD Interface", desc: "Spacecraft interface", style: "hud",
    l: { bg: "#0a1628", s: "rgba(10,22,40,0.85)", b: "#00e5ff", t: "#b0bec5", a: "#00e5ff", sh: "0 0 12px rgba(0,229,255,0.2)", sb: "rgba(10,22,40,0.9)" },
    d: { bg: "#050d18", s: "rgba(5,13,24,0.9)", b: "#00e5ff", t: "#b0bec5", a: "#00e5ff", sh: "0 0 16px rgba(0,229,255,0.3)", sb: "rgba(5,13,18,0.95)" },
    r: "0", bl: "blur(4px)", f: "'Share Tech Mono', monospace", fast: true },
  { id: "sunset-warm", name: "Sunset Warm", desc: "Warm gradient, cozy", style: "sunset",
    l: { bg: "linear-gradient(160deg,#ff9a56,#ff6a88,#ff99ac)", s: "rgba(255,255,255,0.85)", b: "rgba(255,255,255,0.5)", t: "#4a1d1d", a: "#c2185b", sh: "0 8px 32px rgba(255,106,136,0.25)", sb: "rgba(255,255,255,0.5)" },
    d: { bg: "linear-gradient(160deg,#7c2d12,#9f1239,#831843)", s: "rgba(255,255,255,0.08)", b: "rgba(255,255,255,0.12)", t: "#fef2f2", a: "#fb7185", sh: "0 8px 32px rgba(0,0,0,0.5)", sb: "rgba(0,0,0,0.3)" },
    r: "16px", bl: "blur(10px) saturate(140%)", f: "system-ui, sans-serif" },
  { id: "startup", name: "Startup Modern", desc: "Hero gradient, CTA", style: "fluid",
    l: { bg: "linear-gradient(135deg,#667eea,#764ba2)", s: "rgba(255,255,255,0.9)", b: "rgba(255,255,255,0.6)", t: "#1a1a2e", a: "#6366f1", sh: "0 4px 24px rgba(99,102,241,0.2)", sb: "rgba(255,255,255,0.8)" },
    d: { bg: "linear-gradient(135deg,#1e1b4b,#312e81)", s: "rgba(255,255,255,0.08)", b: "rgba(255,255,255,0.12)", t: "#e2e8f0", a: "#818cf8", sh: "0 4px 24px rgba(0,0,0,0.5)", sb: "rgba(0,0,0,0.4)" },
    r: "12px", bl: "blur(12px)", f: "'Inter', system-ui, sans-serif" },
  { id: "neo-classical", name: "Neo-Classical", desc: "Classic + modern UI", style: "paper",
    l: { bg: "#faf8f5", s: "#fff", b: "#e8e4df", t: "#2c2416", a: "#b45309", sh: "0 1px 4px rgba(0,0,0,0.06)", sb: "#faf8f5" },
    d: { bg: "#1a1814", s: "#252219", b: "#3d3629", t: "#e8e0d4", a: "#f59e0b", sh: "0 1px 4px rgba(0,0,0,0.3)", sb: "#1a1814" },
    r: "2px", bl: "none", f: "Georgia, 'Times New Roman', serif" },
  { id: "ai-native", name: "AI Native", desc: "Chat + command UI", style: "pro",
    l: { bg: "#f0f4ff", s: "#fff", b: "#c7d2fe", t: "#1e1b4b", a: "#4f46e5", sh: "0 2px 8px rgba(79,70,229,0.08)", sb: "#eef2ff" },
    d: { bg: "#0c0a1a", s: "#1a1630", b: "#312e81", t: "#e0e7ff", a: "#818cf8", sh: "0 2px 8px rgba(0,0,0,0.4)", sb: "#0c0a1a" },
    r: "12px", bl: "blur(8px)", f: "'Inter', system-ui, sans-serif" },
];

const FILTERS = [
  { id: "all", label: "All" }, { id: "glass", label: "Glass" }, { id: "brutal", label: "Brutal" },
  { id: "minimal", label: "Minimal" }, { id: "classic", label: "Classic" }, { id: "fast", label: "Fast" },
  { id: "creative", label: "Creative" }, { id: "elegant", label: "Elegant" },
];
const CREATIVE = ["cyber", "neon", "aurora", "fluid", "y2k", "vaporwave", "terminal", "bento", "hud"];
const ELEGANT = ["luxury", "paper", "minimal"];

const getM = (t, dark) => dark ? t.d : t.l;

const ThemeCard = memo(({ theme, active, dark, onPick }) => {
  const m = getM(theme, dark);
  const g = m.bg?.includes?.("gradient");
  return (
    <button onClick={() => onPick(theme)}
      className="w-full text-left p-3 transition-[transform,box-shadow] duration-100 will-change-transform"
      style={{
        background: m.s, border: `2px solid ${m.b}`, borderRadius: theme.r,
        boxShadow: theme.sh, backdropFilter: theme.bl, fontFamily: theme.f,
        transform: active ? "translateY(-1px)" : "none",
      }}>
      <div className="flex gap-1.5 mb-2 items-center">
        <span style={{ color: m.a }}><ThemeIcon style={theme.style} /></span>
        <div className="w-4 h-4 rounded-sm" style={{ background: g ? m.bg : m.bg, border: `2px solid ${m.b}` }} />
        <div className="w-4 h-4 rounded-sm" style={{ background: m.a, border: `2px solid ${m.b}` }} />
        {active && <span className="ml-auto text-[9px] font-bold uppercase px-1" style={{ color: m.a }}>{theme.style}</span>}
      </div>
      <h3 className="font-bold text-xs mb-0.5" style={{ color: m.t }}>{theme.name}</h3>
      <p className="text-[10px]" style={{ color: m.t, opacity: 0.5 }}>{theme.desc}</p>
    </button>
  );
});
ThemeCard.displayName = "ThemeCard";

const Preview = memo(({ theme, dark }) => {
  const m = getM(theme, dark);
  const g = m.bg?.includes?.("gradient");
  return (
    <div className="p-4" style={{
      background: m.s, border: `2px solid ${m.b}`, borderRadius: theme.r,
      boxShadow: theme.sh, backdropFilter: theme.bl, fontFamily: theme.f,
    }}>
      <h3 className="text-sm font-bold mb-1" style={{ color: m.t }}>{theme.name}</h3>
      <p className="text-[10px] mb-2" style={{ color: m.t, opacity: 0.5 }}>Previewing {dark ? "dark" : "light"} mode</p>
      <input type="text" placeholder="..." readOnly className="w-full mb-2 px-2 py-1.5 text-[11px] outline-none"
        style={{ background: g ? "rgba(255,255,255,0.15)" : m.bg, border: `2px solid ${m.b}`,
          borderRadius: theme.r === "0" ? "0" : "6px", color: m.t, fontFamily: theme.f }} />
      <div className="flex gap-1.5">
        <button className="px-2.5 py-1 text-[10px] font-bold" style={{
          background: m.a, color: m.t, border: `2px solid ${m.b}`,
          borderRadius: theme.r === "0" ? "0" : "6px", fontFamily: theme.f }}>Primary</button>
        <button className="px-2.5 py-1 text-[10px] font-bold" style={{
          background: "transparent", color: m.a, border: `2px solid ${m.a}`,
          borderRadius: theme.r === "0" ? "0" : "6px", fontFamily: theme.f }}>Outline</button>
      </div>
    </div>
  );
});
Preview.displayName = "Preview";

export default function ThemesPage() {
  const [active, setActive] = useState("liquid-glass");
  const [dark, setDark] = useState(false);
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("tid");
    const d = localStorage.getItem("td");
    if (t && THEMES.find((x) => x.id === t)) setActive(t);
    if (d === "1") { setDark(true); document.documentElement.classList.add("dark"); }
  }, []);

  const pick = useCallback((theme) => {
    setActive(theme.id);
    localStorage.setItem("tid", theme.id);
    setToast(true);
    setTimeout(() => setToast(false), 800);

    const m = getM(theme, dark);
    const r = document.documentElement;
    const g = m.bg?.includes?.("gradient");

    // Batch DOM writes
    requestAnimationFrame(() => {
      r.style.cssText = r.style.cssText; // force reflow
      const sets = [
        ["--color-bg", m.bg], ["--color-bg-alt", m.bg], ["--color-surface", m.s],
        ["--color-surface-2", m.s], ["--color-surface-3", m.s], ["--color-sidebar", m.sb],
        ["--color-border", m.b], ["--color-border-subtle", m.b],
        ["--color-text-main", m.t], ["--color-text", m.t],
        ["--color-primary", m.a], ["--color-primary-hover", m.a],
        ["--shadow-soft", theme.sh], ["--shadow-warm", theme.sh],
        ["--shadow-elevated", theme.sh], ["--shadow-elev", theme.sh],
        ["--radius-brand", theme.r], ["--radius-brand-lg", theme.r],
        ["--font-sans", theme.f],
      ];
      for (const [k, v] of sets) r.style.setProperty(k, v);
      document.body.style.background = g ? m.bg : "";
      document.body.style.backgroundAttachment = g ? "fixed" : "";
    });
  }, [dark]);

  const toggleDark = useCallback(() => {
    const nd = !dark;
    setDark(nd);
    localStorage.setItem("td", nd ? "1" : "0");
    document.documentElement.classList.toggle("dark", nd);
    const t = THEMES.find((x) => x.id === active);
    if (t) pick(t);
  }, [dark, active, pick]);

  const cur = useMemo(() => THEMES.find((t) => t.id === active), [active]);
  const curM = cur ? getM(cur, dark) : null;

  const filtered = useMemo(() => {
    if (filter === "all") return THEMES;
    if (filter === "creative") return THEMES.filter((t) => CREATIVE.includes(t.style));
    if (filter === "elegant") return THEMES.filter((t) => ELEGANT.includes(t.style));
    return THEMES.filter((t) => t.style === filter);
  }, [filter]);

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h1 className="text-lg md:text-2xl font-bold">Themes</h1>
          <p className="text-text-muted text-[10px]">{THEMES.length} themes, light + dark</p>
        </div>
        <button onClick={toggleDark} className="self-start px-2.5 py-1 text-[10px] font-bold flex items-center gap-1.5 gpu-accelerated"
          style={{ background: dark ? "#fff" : "#000", color: dark ? "#000" : "#fff",
            border: `2px solid ${dark ? "#fff" : "#000"}`, borderRadius: cur?.r || "6px",
            transition: "background 100ms, color 100ms" }}>
          <ThemeIcon style={dark ? "fast" : "glow"} /> {dark ? "Light" : "Dark"}
        </button>
      </div>

      {toast && <div className="fixed top-3 right-3 z-50 px-2.5 py-1 bg-green-500 text-white font-bold text-[10px]" style={{ borderRadius: cur?.r || "6px" }}>Applied</div>}

      <div className="flex flex-wrap gap-1 mb-4">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider gpu-accelerated"
            style={{
              background: filter === f.id ? curM?.t : "transparent",
              color: filter === f.id ? (curM?.bg?.includes?.("gradient") ? (dark ? "#fff" : "#000") : curM?.bg) : curM?.t,
              border: `2px solid ${curM?.b || "#000"}`, borderRadius: cur?.r || "6px",
              transition: "all 80ms",
            }}>{f.label}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 mb-4">
        {filtered.map((t) => <ThemeCard key={t.id} theme={t} dark={dark} active={active === t.id} onPick={pick} />)}
      </div>

      {cur && (
        <div>
          <h2 className="text-xs font-bold mb-2">Preview — {cur.name}</h2>
          <Preview theme={cur} dark={dark} />
        </div>
      )}
    </div>
  );
}
