"use client";

import { useState, useEffect, useCallback } from "react";
import { ThemeIcon } from "@/shared/components/ThemeIcons";

const THEMES = [
  // ── GLASS ──
  { id: "ios-glass", name: "iOS Glass", desc: "Blur, translucent cards, rounded corners", style: "glass",
    light: { bg: "#f2f2f7", surface: "rgba(255,255,255,0.72)", border: "rgba(0,0,0,0.08)", text: "#1c1c1e", accent: "#007aff", shadow: "0 2px 16px rgba(0,0,0,0.08)", sidebar: "rgba(255,255,255,0.8)" },
    dark: { bg: "#000000", surface: "rgba(28,28,30,0.72)", border: "rgba(255,255,255,0.1)", text: "#f2f2f7", accent: "#0a84ff", shadow: "0 2px 16px rgba(0,0,0,0.4)", sidebar: "rgba(28,28,30,0.85)" },
    radius: "16px", blur: "blur(20px) saturate(180%)", font: "-apple-system, 'SF Pro Display', system-ui, sans-serif" },
  { id: "liquid-glass", name: "Liquid Glass", desc: "Frosted glass with liquid gradient", style: "glass",
    light: { bg: "#e0e5ec", surface: "rgba(255,255,255,0.45)", border: "rgba(0,0,0,0.12)", text: "#1a1a2e", accent: "#6366f1", shadow: "0 8px 32px rgba(0,0,0,0.12)", sidebar: "rgba(255,255,255,0.6)" },
    dark: { bg: "#0f172a", surface: "rgba(30,41,59,0.6)", border: "rgba(255,255,255,0.1)", text: "#e2e8f0", accent: "#818cf8", shadow: "0 8px 32px rgba(0,0,0,0.4)", sidebar: "rgba(15,23,42,0.7)" },
    radius: "16px", blur: "blur(20px) saturate(180%)", font: "system-ui, -apple-system, sans-serif" },
  { id: "frost", name: "Frost", desc: "Ice-blue frosted panels", style: "frost",
    light: { bg: "#e0f2fe", surface: "rgba(255,255,255,0.6)", border: "rgba(56,189,248,0.35)", text: "#0c4a6e", accent: "#0ea5e9", shadow: "0 4px 24px rgba(14,165,233,0.12)", sidebar: "rgba(255,255,255,0.5)" },
    dark: { bg: "#0c1929", surface: "rgba(15,30,50,0.7)", border: "rgba(56,189,248,0.2)", text: "#bae6fd", accent: "#38bdf8", shadow: "0 4px 24px rgba(0,0,0,0.4)", sidebar: "rgba(12,25,41,0.8)" },
    radius: "14px", blur: "blur(14px) saturate(160%)", font: "system-ui, sans-serif" },
  { id: "neon-glass", name: "Neon Glass", desc: "Glassmorphism + neon glow", style: "glass",
    light: { bg: "#f0f0ff", surface: "rgba(255,255,255,0.5)", border: "rgba(139,92,246,0.3)", text: "#1e1b4b", accent: "#7c3aed", shadow: "0 0 20px rgba(124,58,237,0.15)", sidebar: "rgba(240,240,255,0.7)" },
    dark: { bg: "#0a0a1a", surface: "rgba(15,15,35,0.6)", border: "rgba(139,92,246,0.35)", text: "#e2e8f0", accent: "#a78bfa", shadow: "0 0 24px rgba(139,92,246,0.25)", sidebar: "rgba(10,10,26,0.8)" },
    radius: "14px", blur: "blur(16px) saturate(180%)", font: "system-ui, sans-serif" },
  { id: "tinted-glass", name: "Tinted Glass", desc: "Warm amber-tinted frosted", style: "tinted",
    light: { bg: "#fef3c7", surface: "rgba(255,255,255,0.5)", border: "rgba(217,119,6,0.25)", text: "#451a03", accent: "#d97706", shadow: "0 4px 24px rgba(217,119,6,0.12)", sidebar: "rgba(255,255,255,0.5)" },
    dark: { bg: "#1c1005", surface: "rgba(45,30,10,0.7)", border: "rgba(217,119,6,0.2)", text: "#fef3c7", accent: "#fbbf24", shadow: "0 4px 24px rgba(0,0,0,0.4)", sidebar: "rgba(28,16,5,0.8)" },
    radius: "12px", blur: "blur(12px) saturate(150%)", font: "system-ui, sans-serif" },
  { id: "visionos", name: "VisionOS", desc: "Floating panels, spatial depth", style: "visionos",
    light: { bg: "#f5f5f7", surface: "rgba(255,255,255,0.8)", border: "rgba(0,0,0,0.06)", text: "#1d1d1f", accent: "#1d1d1f", shadow: "0 8px 40px rgba(0,0,0,0.1)", sidebar: "rgba(255,255,255,0.9)" },
    dark: { bg: "#000000", surface: "rgba(29,29,31,0.75)", border: "rgba(255,255,255,0.08)", text: "#f5f5f7", accent: "#f5f5f7", shadow: "0 8px 40px rgba(0,0,0,0.5)", sidebar: "rgba(0,0,0,0.85)" },
    radius: "24px", blur: "blur(24px) saturate(200%)", font: "-apple-system, system-ui, sans-serif" },

  // ── NEOBRUTALISM ──
  { id: "neobrutalism", name: "Neobrutalism", desc: "Bold borders, solid shadows, raw", style: "brutal",
    light: { bg: "#fef9c3", surface: "#ffffff", border: "#000000", text: "#000000", accent: "#ec4899", shadow: "4px 4px 0px #000000", sidebar: "#fef9c3" },
    dark: { bg: "#18181b", surface: "#27272a", border: "#fafafa", text: "#fafafa", accent: "#f472b6", shadow: "4px 4px 0px #fafafa", sidebar: "#18181b" },
    radius: "0px", blur: "none", font: "'Space Mono', monospace" },
  { id: "brutalist-fast", name: "Brutalist Fast", desc: "HTML-like, bold, ultra fast", style: "brutal",
    light: { bg: "#ffffff", surface: "#ffffff", border: "#000000", text: "#000000", accent: "#000000", shadow: "3px 3px 0px #000000", sidebar: "#ffffff" },
    dark: { bg: "#000000", surface: "#111111", border: "#ffffff", text: "#ffffff", accent: "#ffffff", shadow: "3px 3px 0px #ffffff", sidebar: "#000000" },
    radius: "0px", blur: "none", font: "'Courier New', monospace", fast: true },

  // ── MINIMAL ──
  { id: "minimalism", name: "Minimalism", desc: "Clean whites, thin lines, space", style: "minimal",
    light: { bg: "#ffffff", surface: "#ffffff", border: "#f0f0f0", text: "#111111", accent: "#111111", shadow: "none", sidebar: "#ffffff" },
    dark: { bg: "#0a0a0a", surface: "#141414", border: "#262626", text: "#ededed", accent: "#ededed", shadow: "none", sidebar: "#0a0a0a" },
    radius: "4px", blur: "none", font: "'Inter', system-ui, sans-serif" },
  { id: "swiss", name: "Swiss Minimal", desc: "Grid, strong typography, clean", style: "minimal",
    light: { bg: "#ffffff", surface: "#ffffff", border: "#d4d4d4", text: "#0a0a0a", accent: "#dc2626", shadow: "none", sidebar: "#ffffff" },
    dark: { bg: "#0a0a0a", surface: "#171717", border: "#404040", text: "#f5f5f5", accent: "#ef4444", shadow: "none", sidebar: "#0a0a0a" },
    radius: "0px", blur: "none", font: "'Helvetica Neue', Arial, sans-serif" },
  { id: "flat-ui", name: "Flat UI", desc: "No heavy shadows, simple", style: "minimal",
    light: { bg: "#ecf0f1", surface: "#ffffff", border: "#bdc3c7", text: "#2c3e50", accent: "#3498db", shadow: "none", sidebar: "#ecf0f1" },
    dark: { bg: "#1a1a2e", surface: "#16213e", border: "#0f3460", text: "#e8e8e8", accent: "#53a8b6", shadow: "none", sidebar: "#1a1a2e" },
    radius: "4px", blur: "none", font: "'Segoe UI', system-ui, sans-serif" },

  // ── CLASSIC / CORPORATE ──
  { id: "classic", name: "Classic", desc: "Traditional blue/gray corporate", style: "classic",
    light: { bg: "#f1f5f9", surface: "#ffffff", border: "#e2e8f0", text: "#0f172a", accent: "#2563eb", shadow: "0 1px 3px rgba(0,0,0,0.08)", sidebar: "#f8fafc" },
    dark: { bg: "#0f172a", surface: "#1e293b", border: "#334155", text: "#f1f5f9", accent: "#60a5fa", shadow: "0 1px 3px rgba(0,0,0,0.3)", sidebar: "#0f172a" },
    radius: "8px", blur: "none", font: "-apple-system, 'Segoe UI', Roboto, sans-serif" },
  { id: "corporate", name: "Corporate", desc: "Formal navy, structured layout", style: "classic",
    light: { bg: "#f8fafc", surface: "#ffffff", border: "#cbd5e1", text: "#0f172a", accent: "#1e40af", shadow: "0 1px 2px rgba(0,0,0,0.06)", sidebar: "#f1f5f9" },
    dark: { bg: "#0c1222", surface: "#162032", border: "#2d4a6f", text: "#e2e8f0", accent: "#60a5fa", shadow: "0 1px 2px rgba(0,0,0,0.3)", sidebar: "#0c1222" },
    radius: "6px", blur: "none", font: "'Segoe UI', system-ui, sans-serif" },
  { id: "enterprise", name: "Enterprise SaaS", desc: "Dashboard, cards, sidebar", style: "classic",
    light: { bg: "#f1f5f9", surface: "#ffffff", border: "#e2e8f0", text: "#1e293b", accent: "#0284c7", shadow: "0 1px 3px rgba(0,0,0,0.08)", sidebar: "#ffffff" },
    dark: { bg: "#0f172a", surface: "#1e293b", border: "#334155", text: "#e2e8f0", accent: "#38bdf8", shadow: "0 1px 3px rgba(0,0,0,0.3)", sidebar: "#1e293b" },
    radius: "8px", blur: "none", font: "'Inter', system-ui, sans-serif" },
  { id: "professional", name: "Professional", desc: "Enterprise gray, blue accents", style: "pro",
    light: { bg: "#f8fafc", surface: "#ffffff", border: "#cbd5e1", text: "#1e293b", accent: "#0284c7", shadow: "0 1px 2px rgba(0,0,0,0.05)", sidebar: "#f1f5f9" },
    dark: { bg: "#0f172a", surface: "#1e293b", border: "#475569", text: "#e2e8f0", accent: "#38bdf8", shadow: "0 1px 2px rgba(0,0,0,0.3)", sidebar: "#0f172a" },
    radius: "6px", blur: "none", font: "'Inter', system-ui, sans-serif" },
  { id: "financial", name: "Financial", desc: "Clean, trustworthy, data-focused", style: "pro",
    light: { bg: "#f8fafc", surface: "#ffffff", border: "#d1d5db", text: "#111827", accent: "#059669", shadow: "0 1px 2px rgba(0,0,0,0.04)", sidebar: "#ffffff" },
    dark: { bg: "#111827", surface: "#1f2937", border: "#374151", text: "#f9fafb", accent: "#34d399", shadow: "0 1px 2px rgba(0,0,0,0.3)", sidebar: "#111827" },
    radius: "4px", blur: "none", font: "'Inter', system-ui, sans-serif" },

  // ── PERFORMANCE ──
  { id: "super-fast", name: "Super Fast", desc: "No shadows, no blur, pure speed", style: "fast",
    light: { bg: "#ffffff", surface: "#ffffff", border: "#e5e7eb", text: "#000000", accent: "#2563eb", shadow: "none", sidebar: "#ffffff" },
    dark: { bg: "#000000", surface: "#111111", border: "#333333", text: "#ffffff", accent: "#60a5fa", shadow: "none", sidebar: "#000000" },
    radius: "0px", blur: "none", font: "system-ui, sans-serif", fast: true },
  { id: "terminal", name: "Terminal", desc: "Monospace, black/green, super light", style: "terminal",
    light: { bg: "#1a1a1a", surface: "#222222", border: "#444444", text: "#00ff41", accent: "#00ff41", shadow: "none", sidebar: "#111111" },
    dark: { bg: "#0a0a0a", surface: "#141414", border: "#333333", text: "#00ff41", accent: "#00ff41", shadow: "none", sidebar: "#0a0a0a" },
    radius: "0px", blur: "none", font: "'Fira Code', 'Courier New', monospace", fast: true },

  // ── CREATIVE ──
  { id: "cyberpunk", name: "Cyberpunk", desc: "Neon magenta + cyan, dark chrome", style: "cyber",
    light: { bg: "#fdf2f8", surface: "rgba(255,255,255,0.9)", border: "#ec4899", text: "#1a0520", accent: "#06b6d4", shadow: "0 0 12px rgba(6,182,212,0.15)", sidebar: "#fdf2f8" },
    dark: { bg: "#0d0221", surface: "rgba(13,2,33,0.9)", border: "#ff2a6d", text: "#d1f7ff", accent: "#05d9e8", shadow: "0 0 12px rgba(5,217,232,0.4), 4px 4px 0px #ff2a6d", sidebar: "rgba(13,2,33,0.95)" },
    radius: "2px", blur: "blur(6px)", font: "'Share Tech Mono', monospace" },
  { id: "neon-rave", name: "Neon Rave", desc: "Hot pink + lime neon on black", style: "neon",
    light: { bg: "#fafafa", surface: "#ffffff", border: "#16a34a", text: "#0a0a0a", accent: "#d946ef", shadow: "0 0 8px rgba(217,70,239,0.12)", sidebar: "#fafafa" },
    dark: { bg: "#000000", surface: "#111111", border: "#39ff14", text: "#ffffff", accent: "#ff00ff", shadow: "0 0 8px #ff00ff, 0 0 16px rgba(255,0,255,0.3)", sidebar: "#000000" },
    radius: "8px", blur: "none", font: "monospace" },
  { id: "aurora", name: "Aurora", desc: "Northern lights gradient + blur", style: "aurora",
    light: { bg: "linear-gradient(135deg, #e0f2fe 0%, #ede9fe 50%, #fce7f3 100%)", surface: "rgba(255,255,255,0.6)", border: "rgba(139,92,246,0.25)", text: "#1e1b4b", accent: "#7c3aed", shadow: "0 8px 32px rgba(124,58,237,0.12)", sidebar: "rgba(255,255,255,0.5)" },
    dark: { bg: "linear-gradient(135deg, #0c0a1a 0%, #1a0520 50%, #0a1628 100%)", surface: "rgba(30,20,50,0.7)", border: "rgba(139,92,246,0.25)", text: "#e2e8f0", accent: "#a78bfa", shadow: "0 8px 32px rgba(0,0,0,0.4)", sidebar: "rgba(0,0,0,0.6)" },
    radius: "16px", blur: "blur(16px) saturate(180%)", font: "system-ui, sans-serif" },
  { id: "liquid-gradient", name: "Liquid Gradient", desc: "Moving gradient surfaces", style: "fluid",
    light: { bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", surface: "rgba(255,255,255,0.25)", border: "rgba(255,255,255,0.35)", text: "#ffffff", accent: "#fbbf24", shadow: "0 8px 32px rgba(102,126,234,0.3)", sidebar: "rgba(255,255,255,0.15)" },
    dark: { bg: "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)", surface: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.15)", text: "#e2e8f0", accent: "#fbbf24", shadow: "0 8px 32px rgba(0,0,0,0.5)", sidebar: "rgba(0,0,0,0.3)" },
    radius: "20px", blur: "blur(16px) saturate(200%)", font: "system-ui, sans-serif" },
  { id: "y2k", name: "Y2K", desc: "Chrome, glossy, retro-futuristic", style: "y2k",
    light: { bg: "#f0f0ff", surface: "linear-gradient(180deg, #ffffff 0%, #e8e8f0 100%)", border: "#c0c0d0", text: "#1a1a2e", accent: "#ff1493", shadow: "0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)", sidebar: "#e8e8f0" },
    dark: { bg: "#0a0a1a", surface: "linear-gradient(180deg, #1a1a2e 0%, #0d0d1a 100%)", border: "#3a3a5c", text: "#e0e0ff", accent: "#ff69b4", shadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)", sidebar: "#0d0d1a" },
    radius: "12px", blur: "none", font: "'Trebuchet MS', sans-serif" },
  { id: "vaporwave", name: "Vaporwave", desc: "Pink/purple/blue retro", style: "vaporwave",
    light: { bg: "#ffe4f0", surface: "rgba(255,255,255,0.7)", border: "#ff69b4", text: "#4a0050", accent: "#9b59b6", shadow: "0 4px 16px rgba(155,89,182,0.15)", sidebar: "rgba(255,255,255,0.6)" },
    dark: { bg: "#1a0030", surface: "rgba(40,0,60,0.8)", border: "#ff69b4", text: "#ffccff", accent: "#ff69b4", shadow: "0 4px 16px rgba(255,105,180,0.2)", sidebar: "rgba(26,0,48,0.9)" },
    radius: "4px", blur: "blur(8px)", font: "'Trebuchet MS', sans-serif" },
  { id: "arcade", name: "Arcade", desc: "Pixel, CRT scanlines, game UI", style: "terminal",
    light: { bg: "#1a0a2e", surface: "#2a1a3e", border: "#00ff00", text: "#00ff00", accent: "#ff00ff", shadow: "0 0 8px rgba(0,255,0,0.3)", sidebar: "#0d0520" },
    dark: { bg: "#0a0515", surface: "#150a25", border: "#00ff00", text: "#00ff00", accent: "#ff00ff", shadow: "0 0 8px rgba(0,255,0,0.3)", sidebar: "#050210" },
    radius: "0px", blur: "none", font: "'Press Start 2P', monospace", fast: true },
  { id: "editorial", name: "Editorial", desc: "Large typography, magazine feel", style: "paper",
    light: { bg: "#ffffff", surface: "#ffffff", border: "#e5e5e5", text: "#0a0a0a", accent: "#0a0a0a", shadow: "none", sidebar: "#ffffff" },
    dark: { bg: "#111111", surface: "#1a1a1a", border: "#333333", text: "#f5f5f5", accent: "#f5f5f5", shadow: "none", sidebar: "#111111" },
    radius: "0px", blur: "none", font: "Georgia, 'Times New Roman', serif" },
  { id: "bento", name: "Bento Grid", desc: "Modular card layout", style: "bento",
    light: { bg: "#f5f5f5", surface: "#ffffff", border: "#e5e5e5", text: "#171717", accent: "#2563eb", shadow: "0 1px 3px rgba(0,0,0,0.06)", sidebar: "#f5f5f5" },
    dark: { bg: "#0a0a0a", surface: "#171717", border: "#262626", text: "#f5f5f5", accent: "#60a5fa", shadow: "0 1px 3px rgba(0,0,0,0.3)", sidebar: "#0a0a0a" },
    radius: "16px", blur: "none", font: "system-ui, sans-serif" },

  // ── 3D ──
  { id: "super-3d", name: "Super 3D", desc: "Multi-layered depth extrude", style: "threed",
    light: { bg: "#ede9fe", surface: "#c4b5fd", border: "#8b5cf6", text: "#1e1b4b", accent: "#5b21b6", shadow: "3px 3px 0px #8b5cf6, 6px 6px 0px #5b21b6, 9px 9px 0px #3b0764", sidebar: "#ede9fe" },
    dark: { bg: "#1e1b4b", surface: "#312e81", border: "#4338ca", text: "#e0e7ff", accent: "#a5b4fc", shadow: "4px 4px 0px #1e1b4b, 8px 8px 0px #312e81, 12px 12px 0px #4338ca", sidebar: "#1e1b4b" },
    radius: "4px", blur: "none", font: "'Space Mono', monospace" },

  // ── ELEGANT ──
  { id: "luxury", name: "Luxury Black & Gold", desc: "Premium, exclusive feel", style: "luxury",
    light: { bg: "#fafaf9", surface: "#ffffff", border: "#d4c5a0", text: "#1c1917", accent: "#b8860b", shadow: "0 2px 8px rgba(184,134,11,0.1)", sidebar: "#fafaf9" },
    dark: { bg: "#0a0a0a", surface: "#141414", border: "#b8860b", text: "#f5f5f4", accent: "#d4a017", shadow: "0 2px 12px rgba(184,134,11,0.2)", sidebar: "#0a0a0a" },
    radius: "2px", blur: "none", font: "Georgia, 'Times New Roman', serif" },
  { id: "monochrome", name: "Monochrome", desc: "One dominant color, very clean", style: "minimal",
    light: { bg: "#ffffff", surface: "#ffffff", border: "#999999", text: "#000000", accent: "#000000", shadow: "none", sidebar: "#ffffff" },
    dark: { bg: "#111111", surface: "#1a1a1a", border: "#555555", text: "#ffffff", accent: "#ffffff", shadow: "none", sidebar: "#111111" },
    radius: "0px", blur: "none", font: "'Helvetica Neue', Arial, sans-serif" },
  { id: "dark-premium", name: "Dark Premium", desc: "Charcoal + subtle gradients", style: "pro",
    light: { bg: "#f8f9fa", surface: "#ffffff", border: "#dee2e6", text: "#212529", accent: "#0d6efd", shadow: "0 1px 3px rgba(0,0,0,0.06)", sidebar: "#f8f9fa" },
    dark: { bg: "#121212", surface: "#1e1e1e", border: "#2d2d2d", text: "#e0e0e0", accent: "#4dabf7", shadow: "0 2px 8px rgba(0,0,0,0.4)", sidebar: "#121212" },
    radius: "8px", blur: "blur(8px)", font: "'Inter', system-ui, sans-serif" },

  // ── EXPERIMENTAL ──
  { id: "hud", name: "HUD Interface", desc: "Aircraft/spacecraft interface", style: "hud",
    light: { bg: "#0a1628", surface: "rgba(10,22,40,0.85)", border: "#00e5ff", text: "#b0bec5", accent: "#00e5ff", shadow: "0 0 12px rgba(0,229,255,0.2)", sidebar: "rgba(10,22,40,0.9)" },
    dark: { bg: "#050d18", surface: "rgba(5,13,24,0.9)", border: "#00e5ff", text: "#b0bec5", accent: "#00e5ff", shadow: "0 0 16px rgba(0,229,255,0.3)", sidebar: "rgba(5,13,18,0.95)" },
    radius: "0px", blur: "blur(4px)", font: "'Share Tech Mono', monospace", fast: true },
  { id: "sunset-warm", name: "Sunset Warm", desc: "Warm gradient, cozy surfaces", style: "sunset",
    light: { bg: "linear-gradient(160deg, #ff9a56 0%, #ff6a88 50%, #ff99ac 100%)", surface: "rgba(255,255,255,0.85)", border: "rgba(255,255,255,0.5)", text: "#4a1d1d", accent: "#c2185b", shadow: "0 8px 32px rgba(255,106,136,0.25)", sidebar: "rgba(255,255,255,0.5)" },
    dark: { bg: "linear-gradient(160deg, #7c2d12 0%, #9f1239 50%, #831843 100%)", surface: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.12)", text: "#fef2f2", accent: "#fb7185", shadow: "0 8px 32px rgba(0,0,0,0.5)", sidebar: "rgba(0,0,0,0.3)" },
    radius: "16px", blur: "blur(10px) saturate(140%)", font: "system-ui, sans-serif" },
  { id: "startup", name: "Startup Modern", desc: "Hero gradient, strong CTA", style: "fluid",
    light: { bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", surface: "rgba(255,255,255,0.9)", border: "rgba(255,255,255,0.6)", text: "#1a1a2e", accent: "#6366f1", shadow: "0 4px 24px rgba(99,102,241,0.2)", sidebar: "rgba(255,255,255,0.8)" },
    dark: { bg: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", surface: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.12)", text: "#e2e8f0", accent: "#818cf8", shadow: "0 4px 24px rgba(0,0,0,0.5)", sidebar: "rgba(0,0,0,0.4)" },
    radius: "12px", blur: "blur(12px)", font: "'Inter', system-ui, sans-serif" },
  { id: "neo-classical", name: "Neo-Classical", desc: "Classic with modern UI", style: "paper",
    light: { bg: "#faf8f5", surface: "#ffffff", border: "#e8e4df", text: "#2c2416", accent: "#b45309", shadow: "0 1px 4px rgba(0,0,0,0.06)", sidebar: "#faf8f5" },
    dark: { bg: "#1a1814", surface: "#252219", border: "#3d3629", text: "#e8e0d4", accent: "#f59e0b", shadow: "0 1px 4px rgba(0,0,0,0.3)", sidebar: "#1a1814" },
    radius: "2px", blur: "none", font: "Georgia, 'Times New Roman', serif" },
  { id: "ai-native", name: "AI Native", desc: "Chat + command intelligent UI", style: "pro",
    light: { bg: "#f0f4ff", surface: "#ffffff", border: "#c7d2fe", text: "#1e1b4b", accent: "#4f46e5", shadow: "0 2px 8px rgba(79,70,229,0.08)", sidebar: "#eef2ff" },
    dark: { bg: "#0c0a1a", surface: "#1a1630", border: "#312e81", text: "#e0e7ff", accent: "#818cf8", shadow: "0 2px 8px rgba(0,0,0,0.4)", sidebar: "#0c0a1a" },
    radius: "12px", blur: "blur(8px)", font: "'Inter', system-ui, sans-serif" },
];

const STYLE_META = {
  glass: "Glass", brutal: "Brutal", minimal: "Minimal", classic: "Classic", pro: "Pro",
  fast: "Fast", terminal: "Terminal", cyber: "Cyber", neon: "Neon", aurora: "Aurora",
  fluid: "Fluid", tinted: "Tinted", threed: "3D", paper: "Paper", frost: "Frost",
  luxury: "Luxury", hud: "HUD", visionos: "VisionOS", y2k: "Y2K", vaporwave: "Vaporwave",
  bento: "Bento",
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "glass", label: "Glass" },
  { id: "brutal", label: "Brutal" },
  { id: "minimal", label: "Minimal" },
  { id: "classic", label: "Classic" },
  { id: "fast", label: "Fast" },
  { id: "creative", label: "Creative" },
  { id: "elegant", label: "Elegant" },
];

const CREATIVE_STYLES = ["cyber", "neon", "aurora", "fluid", "y2k", "vaporwave", "terminal", "bento", "hud"];
const ELEGANT_STYLES = ["luxury", "paper", "minimal"];

function ThemeCard({ theme, isActive, isDark, onApply }) {
  const m = isDark ? theme.dark : theme.light;
  const g = m.bg?.includes?.("gradient");
  return (
    <button onClick={() => onApply(theme)}
      className={`w-full text-left p-4 transition-all duration-150 ${isActive ? "ring-2 ring-offset-2" : "hover:translate-y-[-1px]"}`}
      style={{
        background: m.surface, border: `2px solid ${m.border}`, borderRadius: theme.radius,
        boxShadow: theme.shadow, backdropFilter: theme.blur, fontFamily: theme.font,
        ...(isActive ? { ringOffsetColor: m.bg?.includes?.("gradient") ? "#fff" : m.bg } : {}),
      }}>
      <div className="flex gap-2 mb-2 items-center">
        <span style={{ color: m.accent }}><ThemeIcon style={theme.style} /></span>
        <div className="w-5 h-5 shrink-0 rounded-sm" style={{ background: g ? m.bg : m.bg, border: `2px solid ${m.border}` }} />
        <div className="w-5 h-5 shrink-0 rounded-sm" style={{ background: m.accent, border: `2px solid ${m.border}` }} />
        <span className="ml-auto text-[9px] font-bold uppercase px-1.5 py-0.5 tracking-wider"
          style={{ color: m.accent, border: `1px solid ${m.border}`, borderRadius: "3px" }}>
          {STYLE_META[theme.style]}
        </span>
      </div>
      <h3 className="font-bold text-sm mb-0.5" style={{ color: m.text }}>{theme.name}</h3>
      <p className="text-[11px] leading-snug" style={{ color: m.text, opacity: 0.55 }}>{theme.desc}</p>
      {isActive && <div className="mt-2 text-[10px] font-bold uppercase" style={{ color: m.accent }}>Active</div>}
    </button>
  );
}

function PreviewCard({ theme, isDark }) {
  const m = isDark ? theme.dark : theme.light;
  const g = m.bg?.includes?.("gradient");
  return (
    <div className="p-5" style={{
      background: m.surface, border: `2px solid ${m.border}`, borderRadius: theme.radius,
      boxShadow: theme.shadow, backdropFilter: theme.blur, fontFamily: theme.font,
    }}>
      <h3 className="text-base font-bold mb-1.5" style={{ color: m.text }}>{theme.name} Preview</h3>
      <p className="text-xs mb-3" style={{ color: m.text, opacity: 0.6 }}>Previewing {isDark ? "dark" : "light"} mode.</p>
      <input type="text" placeholder="Type here..." className="w-full mb-3 px-3 py-2 text-xs outline-none"
        style={{ background: g ? "rgba(255,255,255,0.15)" : m.bg, border: `2px solid ${m.border}`,
          borderRadius: theme.radius === "0px" ? "0" : "6px", color: m.text, fontFamily: theme.font }} />
      <div className="flex gap-2 flex-wrap">
        <button className="px-3 py-1.5 text-xs font-bold" style={{
          background: m.accent, color: m.text, border: `2px solid ${m.border}`,
          borderRadius: theme.radius === "0px" ? "0" : "6px", fontFamily: theme.font }}>Primary</button>
        <button className="px-3 py-1.5 text-xs font-bold" style={{
          background: "transparent", color: m.accent, border: `2px solid ${m.accent}`,
          borderRadius: theme.radius === "0px" ? "0" : "6px", fontFamily: theme.font }}>Outline</button>
      </div>
    </div>
  );
}

export default function ThemesPage() {
  const [activeTheme, setActiveTheme] = useState("liquid-glass");
  const [isDark, setIsDark] = useState(false);
  const [filter, setFilter] = useState("all");
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme-id");
    const darkSaved = localStorage.getItem("theme-dark");
    if (saved && THEMES.find((t) => t.id === saved)) setActiveTheme(saved);
    if (darkSaved === "true") { setIsDark(true); document.documentElement.classList.add("dark"); }
  }, []);

  const applyTheme = useCallback((theme, save = true) => {
    setActiveTheme(theme.id);
    if (save) { localStorage.setItem("theme-id", theme.id); setApplied(true); setTimeout(() => setApplied(false), 1000); }
    const m = isDark ? theme.dark : theme.light;
    const r = document.documentElement;
    const g = m.bg?.includes?.("gradient");
    r.style.setProperty("--color-bg", m.bg); r.style.setProperty("--color-bg-alt", m.bg);
    r.style.setProperty("--color-surface", m.surface); r.style.setProperty("--color-surface-2", m.surface);
    r.style.setProperty("--color-surface-3", m.surface); r.style.setProperty("--color-sidebar", m.sidebar);
    r.style.setProperty("--color-border", m.border); r.style.setProperty("--color-border-subtle", m.border);
    r.style.setProperty("--color-text-main", m.text); r.style.setProperty("--color-text", m.text);
    r.style.setProperty("--color-primary", m.accent); r.style.setProperty("--color-primary-hover", m.accent);
    ["--shadow-soft", "--shadow-warm", "--shadow-elevated", "--shadow-elev"].forEach((k) => r.style.setProperty(k, theme.shadow));
    r.style.setProperty("--radius-brand", theme.radius); r.style.setProperty("--radius-brand-lg", theme.radius);
    r.style.setProperty("--font-sans", theme.font);
    document.body.style.background = g ? m.bg : ""; document.body.style.backgroundAttachment = g ? "fixed" : "";
    if (theme.fast) r.style.setProperty("--animation-duration", "0ms"); else r.style.setProperty("--animation-duration", "");
  }, [isDark]);

  const toggleDark = useCallback(() => {
    const nd = !isDark; setIsDark(nd); localStorage.setItem("theme-dark", String(nd));
    document.documentElement.classList.toggle("dark", nd);
    const t = THEMES.find((x) => x.id === activeTheme); if (t) applyTheme(t, false);
  }, [isDark, activeTheme, applyTheme]);

  const current = THEMES.find((t) => t.id === activeTheme);

  const filtered = filter === "all" ? THEMES
    : filter === "creative" ? THEMES.filter((t) => CREATIVE_STYLES.includes(t.style))
    : filter === "elegant" ? THEMES.filter((t) => ELEGANT_STYLES.includes(t.style))
    : THEMES.filter((t) => t.style === filter);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl md:text-3xl font-bold">Themes</h1>
          <p className="text-text-muted text-xs mt-1">{THEMES.length} themes, each with light & dark mode</p>
        </div>
        <button onClick={toggleDark} className="self-start px-3 py-1.5 text-xs font-bold shrink-0 flex items-center gap-2"
          style={{ background: isDark ? "#fff" : "#000", color: isDark ? "#000" : "#fff",
            border: `2px solid ${isDark ? "#fff" : "#000"}`, borderRadius: current?.radius || "6px" }}>
          <ThemeIcon style={isDark ? "fast" : "glow"} /> {isDark ? "Light" : "Dark"}
        </button>
      </div>

      {/* Toast */}
      {applied && (
        <div className="fixed top-4 right-4 z-50 px-3 py-1.5 bg-green-500 text-white font-bold text-xs"
          style={{ borderRadius: current?.radius || "6px" }}>Theme Applied</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {FILTERS.map((f) => {
          const m = isDark ? (current?.dark || THEMES[0].dark) : (current?.light || THEMES[0].light);
          const active = filter === f.id;
          return (
            <button key={f.id} onClick={() => setFilter(f.id)} className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all"
              style={{
                background: active ? m.text : "transparent", color: active ? m.bg?.includes?.("gradient") ? (isDark ? "#fff" : "#000") : m.bg : m.text,
                border: `2px solid ${m.border}`, borderRadius: current?.radius || "6px",
              }}>{f.label}</button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
        {filtered.map((t) => <ThemeCard key={t.id} theme={t} isDark={isDark} isActive={activeTheme === t.id} onApply={applyTheme} />)}
      </div>

      {/* Preview */}
      {current && (
        <div>
          <h2 className="text-base font-bold mb-3">Preview — {current.name} ({isDark ? "Dark" : "Light"})</h2>
          <PreviewCard theme={current} isDark={isDark} />
        </div>
      )}
    </div>
  );
}
