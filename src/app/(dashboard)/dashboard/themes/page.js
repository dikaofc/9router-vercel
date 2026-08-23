"use client";

import { useState, useEffect, useCallback } from "react";

const THEMES = [
  // === LIQUID GLASS ===
  {
    id: "liquid-glass",
    name: "Liquid Glass",
    description: "iOS-style frosted glass with blur",
    style: "glass",
    bg: "#e0e5ec",
    surface: "rgba(255,255,255,0.45)",
    border: "rgba(255,255,255,0.6)",
    borderStyle: "1px solid",
    text: "#1a1a2e",
    accent: "#6366f1",
    shadow: "0 8px 32px rgba(0,0,0,0.12)",
    borderRadius: "16px",
    backdropFilter: "blur(20px) saturate(180%)",
    font: "system-ui, -apple-system, sans-serif",
  },
  // === NEOBRUTALISM ===
  {
    id: "neobrutalism",
    name: "Neobrutalism",
    description: "Bold borders, solid shadows, raw aesthetic",
    style: "brutal",
    bg: "#fef9c3",
    surface: "#ffffff",
    border: "#000000",
    borderStyle: "3px solid",
    text: "#000000",
    accent: "#ec4899",
    shadow: "4px 4px 0px #000000",
    borderRadius: "0px",
    backdropFilter: "none",
    font: "'Space Mono', 'Courier New', monospace",
  },
  // === MINIMALISM ===
  {
    id: "minimalism",
    name: "Minimalism",
    description: "Clean whites, thin lines, lots of space",
    style: "minimal",
    bg: "#ffffff",
    surface: "#ffffff",
    border: "#f0f0f0",
    borderStyle: "1px solid",
    text: "#111111",
    accent: "#111111",
    shadow: "none",
    borderRadius: "4px",
    backdropFilter: "none",
    font: "'Inter', system-ui, sans-serif",
  },
  // === CLASSIC ===
  {
    id: "classic",
    name: "Classic",
    description: "Traditional blue/gray corporate look",
    style: "classic",
    bg: "#f1f5f9",
    surface: "#ffffff",
    border: "#e2e8f0",
    borderStyle: "1px solid",
    text: "#0f172a",
    accent: "#2563eb",
    shadow: "0 1px 3px rgba(0,0,0,0.1)",
    borderRadius: "8px",
    backdropFilter: "none",
    font: "-apple-system, 'Segoe UI', Roboto, sans-serif",
  },
  // === FLUID GLASS ===
  {
    id: "fluid-glass",
    name: "Fluid Glass",
    description: "Animated gradients with glass overlay",
    style: "fluid",
    bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    surface: "rgba(255,255,255,0.25)",
    border: "rgba(255,255,255,0.35)",
    borderStyle: "1px solid",
    text: "#ffffff",
    accent: "#fbbf24",
    shadow: "0 8px 32px rgba(102,126,234,0.4)",
    borderRadius: "20px",
    backdropFilter: "blur(16px) saturate(200%)",
    font: "system-ui, -apple-system, sans-serif",
  },
  // === TINTED GLASS ===
  {
    id: "tinted-glass",
    name: "Tinted Glass",
    description: "Warm amber-tinted frosted panels",
    style: "tinted",
    bg: "#fef3c7",
    surface: "rgba(255,255,255,0.5)",
    border: "rgba(245,158,11,0.3)",
    borderStyle: "1px solid",
    text: "#451a03",
    accent: "#d97706",
    shadow: "0 4px 24px rgba(217,119,6,0.15)",
    borderRadius: "12px",
    backdropFilter: "blur(12px) saturate(150%)",
    font: "system-ui, -apple-system, sans-serif",
  },
  // === GLOW ===
  {
    id: "glow",
    name: "Glow",
    description: "Dark background with neon glow accents",
    style: "glow",
    bg: "#0a0a1a",
    surface: "rgba(15,15,35,0.8)",
    border: "rgba(99,102,241,0.4)",
    borderStyle: "1px solid",
    text: "#e2e8f0",
    accent: "#818cf8",
    shadow: "0 0 20px rgba(99,102,241,0.3), 0 0 40px rgba(99,102,241,0.1)",
    borderRadius: "12px",
    backdropFilter: "blur(10px)",
    font: "'JetBrains Mono', 'Fira Code', monospace",
  },
  // === PROFESSIONAL ===
  {
    id: "professional",
    name: "Professional",
    description: "Clean enterprise gray with blue accents",
    style: "pro",
    bg: "#f8fafc",
    surface: "#ffffff",
    border: "#cbd5e1",
    borderStyle: "1px solid",
    text: "#1e293b",
    accent: "#0284c7",
    shadow: "0 1px 2px rgba(0,0,0,0.05)",
    borderRadius: "6px",
    backdropFilter: "none",
    font: "'Inter', -apple-system, sans-serif",
  },
  // === SUPER FAST ===
  {
    id: "super-fast",
    name: "Super Fast",
    description: "No shadows, no blur, pure speed",
    style: "fast",
    bg: "#ffffff",
    surface: "#ffffff",
    border: "#e5e7eb",
    borderStyle: "1px solid",
    text: "#000000",
    accent: "#2563eb",
    shadow: "none",
    borderRadius: "0px",
    backdropFilter: "none",
    font: "system-ui, sans-serif",
    disableAnimations: true,
  },
  // === SUPER 3D ===
  {
    id: "super-3d",
    name: "Super 3D",
    description: "Multi-layered depth with extrude effect",
    style: "threed",
    bg: "#1e1b4b",
    surface: "#312e81",
    border: "#4338ca",
    borderStyle: "2px solid",
    text: "#e0e7ff",
    accent: "#a5b4fc",
    shadow: "4px 4px 0px #1e1b4b, 8px 8px 0px #312e81, 12px 12px 0px #4338ca",
    borderRadius: "4px",
    backdropFilter: "none",
    font: "'Space Mono', monospace",
  },
  // === FROST ===
  {
    id: "frost",
    name: "Frost",
    description: "Ice-blue frosted surface, cool tones",
    style: "frost",
    bg: "#e0f2fe",
    surface: "rgba(255,255,255,0.6)",
    border: "rgba(56,189,248,0.4)",
    borderStyle: "1px solid",
    text: "#0c4a6e",
    accent: "#0ea5e9",
    shadow: "0 4px 24px rgba(14,165,233,0.15)",
    borderRadius: "14px",
    backdropFilter: "blur(14px) saturate(160%)",
    font: "system-ui, -apple-system, sans-serif",
  },
  // === CYBERPUNK ===
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Neon magenta + cyan on dark chrome",
    style: "cyber",
    bg: "#0d0221",
    surface: "rgba(13,2,33,0.9)",
    border: "#ff2a6d",
    borderStyle: "2px solid",
    text: "#d1f7ff",
    accent: "#05d9e8",
    shadow: "0 0 12px rgba(5,217,232,0.4), 4px 4px 0px #ff2a6d",
    borderRadius: "2px",
    backdropFilter: "blur(6px)",
    font: "'Share Tech Mono', 'Courier New', monospace",
  },
  // === PAPER ===
  {
    id: "paper",
    name: "Paper",
    description: "Off-white paper texture, ink-black text",
    style: "paper",
    bg: "#faf8f5",
    surface: "#ffffff",
    border: "#e8e4df",
    borderStyle: "1px solid",
    text: "#2c2416",
    accent: "#b45309",
    shadow: "0 1px 4px rgba(0,0,0,0.08)",
    borderRadius: "2px",
    backdropFilter: "none",
    font: "Georgia, 'Times New Roman', serif",
  },
  // === NEON RAVE ===
  {
    id: "neon-rave",
    name: "Neon Rave",
    description: "Black with hot pink + lime neon",
    style: "neon",
    bg: "#000000",
    surface: "#111111",
    border: "#39ff14",
    borderStyle: "2px solid",
    text: "#ffffff",
    accent: "#ff00ff",
    shadow: "0 0 8px #ff00ff, 0 0 16px rgba(255,0,255,0.3)",
    borderRadius: "8px",
    backdropFilter: "none",
    font: "'Press Start 2P', monospace",
  },
  // === SUNSET WARM ===
  {
    id: "sunset-warm",
    name: "Sunset Warm",
    description: "Warm gradient bg, cozy surfaces",
    style: "sunset",
    bg: "linear-gradient(160deg, #ff9a56 0%, #ff6a88 50%, #ff99ac 100%)",
    surface: "rgba(255,255,255,0.85)",
    border: "rgba(255,255,255,0.5)",
    borderStyle: "1px solid",
    text: "#4a1d1d",
    accent: "#c2185b",
    shadow: "0 8px 32px rgba(255,106,136,0.3)",
    borderRadius: "16px",
    backdropFilter: "blur(10px) saturate(140%)",
    font: "system-ui, -apple-system, sans-serif",
  },
];

const STYLE_META = {
  glass: { icon: "💧", tag: "Glass" },
  brutal: { icon: "🔨", tag: "Brutal" },
  minimal: { icon: "✨", tag: "Minimal" },
  classic: { icon: "🏛️", tag: "Classic" },
  fluid: { icon: "🌊", tag: "Fluid" },
  tinted: { icon: "🟠", tag: "Tinted" },
  glow: { icon: "💜", tag: "Glow" },
  pro: { icon: "💼", tag: "Pro" },
  fast: { icon: "⚡", tag: "Fast" },
  threed: { icon: "🧊", tag: "3D" },
  frost: { icon: "❄️", tag: "Frost" },
  cyber: { icon: "🤖", tag: "Cyber" },
  paper: { icon: "📜", tag: "Paper" },
  neon: { icon: "💜", tag: "Neon" },
  sunset: { icon: "🌅", tag: "Sunset" },
};

const STYLE_FILTERS = [
  { id: "all", label: "All" },
  { id: "glass", label: "Glass" },
  { id: "brutal", label: "Brutal" },
  { id: "minimal", label: "Minimal" },
  { id: "dark", label: "Dark" },
  { id: "fast", label: "Fast" },
  { id: "3d", label: "3D" },
];

function ThemeCard({ theme, isActive, onApply }) {
  const meta = STYLE_META[theme.style] || {};
  const isGradientBg = theme.bg.includes("gradient");

  return (
    <button
      onClick={() => onApply(theme)}
      className={`w-full text-left p-4 transition-all duration-200 ${
        isActive ? "ring-4 ring-accent dark:ring-white" : ""
      }`}
      style={{
        background: theme.surface,
        border: `${theme.borderStyle} ${theme.border}`,
        borderRadius: theme.borderRadius,
        boxShadow: theme.shadow,
        backdropFilter: theme.backdropFilter || "none",
        fontFamily: theme.font,
      }}
    >
      {/* Color Swatches */}
      <div className="flex gap-2 mb-3">
        <div
          className="w-8 h-8 shrink-0"
          style={{
            background: isGradientBg ? theme.bg : theme.bg,
            border: `${theme.borderStyle} ${theme.border}`,
            borderRadius: theme.borderRadius === "0px" ? "0" : "6px",
          }}
        />
        <div
          className="w-8 h-8 shrink-0"
          style={{
            background: theme.accent,
            border: `${theme.borderStyle} ${theme.border}`,
            borderRadius: theme.borderRadius === "0px" ? "0" : "6px",
          }}
        />
        <div
          className="w-8 h-8 shrink-0"
          style={{
            background: theme.surface,
            border: `${theme.borderStyle} ${theme.border}`,
            borderRadius: theme.borderRadius === "0px" ? "0" : "6px",
          }}
        />
        <div className="ml-auto flex items-center">
          <span
            className="text-[10px] px-2 py-0.5 font-bold uppercase"
            style={{
              color: theme.accent,
              border: `${theme.borderStyle} ${theme.border}`,
              borderRadius: theme.borderRadius === "0px" ? "0" : "4px",
            }}
          >
            {meta.icon} {meta.tag}
          </span>
        </div>
      </div>

      {/* Theme Info */}
      <h3
        className="font-bold text-base mb-1"
        style={{ color: theme.text }}
      >
        {theme.name}
      </h3>
      <p
        className="text-xs leading-relaxed"
        style={{ color: theme.text, opacity: 0.6 }}
      >
        {theme.description}
      </p>

      {/* Active Indicator */}
      {isActive && (
        <div
          className="mt-3 text-[11px] font-bold uppercase tracking-wide"
          style={{ color: theme.accent }}
        >
          ✓ Active
        </div>
      )}
    </button>
  );
}

function PreviewCard({ theme }) {
  const isGradientBg = theme.bg.includes("gradient");

  return (
    <div
      className="p-6"
      style={{
        background: theme.surface,
        border: `${theme.borderStyle} ${theme.border}`,
        borderRadius: theme.borderRadius,
        boxShadow: theme.shadow,
        backdropFilter: theme.backdropFilter || "none",
        fontFamily: theme.font,
      }}
    >
      <h3 className="text-lg font-bold mb-2" style={{ color: theme.text }}>
        Preview Card
      </h3>
      <p className="text-sm mb-4" style={{ color: theme.text, opacity: 0.7 }}>
        This shows how the selected theme looks with real content.
      </p>

      {/* Input preview */}
      <input
        type="text"
        placeholder="Type something..."
        className="w-full mb-4 px-3 py-2 text-sm outline-none"
        style={{
          background: isGradientBg ? "rgba(255,255,255,0.3)" : theme.bg,
          border: `${theme.borderStyle} ${theme.border}`,
          borderRadius: theme.borderRadius === "0px" ? "0" : "8px",
          color: theme.text,
          fontFamily: theme.font,
        }}
      />

      {/* Button row */}
      <div className="flex flex-wrap gap-2">
        <button
          className="px-4 py-2 text-sm font-bold"
          style={{
            background: theme.accent,
            color: theme.style === "pro" || theme.style === "minimal" ? "#ffffff" : theme.text,
            border: `${theme.borderStyle} ${theme.border}`,
            borderRadius: theme.borderRadius === "0px" ? "0" : "8px",
            boxShadow: theme.style === "brutal" ? "3px 3px 0px #000" : theme.shadow,
            fontFamily: theme.font,
          }}
        >
          Primary
        </button>
        <button
          className="px-4 py-2 text-sm font-bold"
          style={{
            background: "transparent",
            color: theme.accent,
            border: `${theme.borderStyle} ${theme.accent}`,
            borderRadius: theme.borderRadius === "0px" ? "0" : "8px",
            fontFamily: theme.font,
          }}
        >
          Outline
        </button>
      </div>
    </div>
  );
}

export default function ThemesPage() {
  const [activeTheme, setActiveTheme] = useState("liquid-glass");
  const [filter, setFilter] = useState("all");
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme-id");
    if (saved) {
      const found = THEMES.find((t) => t.id === saved);
      if (found) {
        setActiveTheme(saved);
        applyTheme(found, false);
      }
    }
  }, []);

  const applyTheme = useCallback((theme, save = true) => {
    setActiveTheme(theme.id);
    if (save) {
      localStorage.setItem("theme-id", theme.id);
      setApplied(true);
      setTimeout(() => setApplied(false), 1200);
    }

    const root = document.documentElement;
    const isGradientBg = theme.bg.includes("gradient");

    root.style.setProperty("--color-bg", isGradientBg ? theme.bg.split(",")[0].replace("linear-gradient(135deg ", "").replace("linear-gradient(160deg ", "") : theme.bg);
    root.style.setProperty("--color-bg-raw", theme.bg);
    root.style.setProperty("--color-surface", theme.surface);
    root.style.setProperty("--color-border", theme.border);
    root.style.setProperty("--color-text-main", theme.text);
    root.style.setProperty("--color-text", theme.text);
    root.style.setProperty("--color-primary", theme.accent);
    root.style.setProperty("--shadow-soft", theme.shadow);
    root.style.setProperty("--shadow-warm", theme.shadow);
    root.style.setProperty("--shadow-elevated", theme.shadow);
    root.style.setProperty("--shadow-elev", theme.shadow);
    root.style.setProperty("--radius-brand", theme.borderRadius);
    root.style.setProperty("--radius-brand-lg", theme.borderRadius);
    root.style.setProperty("--font-sans", theme.font);

    // Apply backdrop-filter to body if gradient
    if (isGradientBg) {
      document.body.style.background = theme.bg;
      document.body.style.backgroundAttachment = "fixed";
    } else {
      document.body.style.background = "";
      document.body.style.backgroundAttachment = "";
    }

    // Disable animations for fast theme
    if (theme.disableAnimations) {
      root.style.setProperty("--animation-duration", "0ms");
    } else {
      root.style.setProperty("--animation-duration", "");
    }
  }, []);

  const currentTheme = THEMES.find((t) => t.id === activeTheme);

  const filteredThemes = filter === "all"
    ? THEMES
    : filter === "dark"
      ? THEMES.filter((t) => t.style === "glow" || t.style === "cyber" || t.style === "neon" || t.style === "threed")
      : THEMES.filter((t) => t.style === filter);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-4xl font-bold mb-2">🎨 Themes</h1>
        <p className="text-text-muted text-sm md:text-base">
          Choose from {THEMES.length} unique styles — Liquid Glass, Neobrutalism, Minimalism, Classic, Fluid, Glow, 3D, and more.
        </p>
      </div>

      {/* Applied toast */}
      {applied && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-green-500 text-white font-bold text-sm animate-bounce"
          style={{ borderRadius: currentTheme?.borderRadius || "8px" }}>
          ✓ Theme Applied!
        </div>
      )}

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STYLE_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
              filter === f.id
                ? "bg-text-main text-bg"
                : "bg-surface text-text-muted hover:bg-surface-2"
            }`}
            style={{
              border: `${currentTheme?.borderStyle || "1px solid"} ${currentTheme?.border || "#000"}`,
              borderRadius: currentTheme?.borderRadius || "6px",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {filteredThemes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isActive={activeTheme === theme.id}
            onApply={applyTheme}
          />
        ))}
      </div>

      {/* Live Preview */}
      {currentTheme && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Live Preview</h2>
          <PreviewCard theme={currentTheme} />
        </div>
      )}
    </div>
  );
}
