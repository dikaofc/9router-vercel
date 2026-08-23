"use client";

import { useState, useEffect, useCallback } from "react";

/*
 * Each theme has light + dark variants.
 * When user toggles dark mode, the active theme switches to its dark variant.
 */
const THEMES = [
  {
    id: "liquid-glass",
    name: "Liquid Glass",
    description: "iOS-style frosted glass with blur",
    style: "glass",
    light: {
      bg: "#e0e5ec", surface: "rgba(255,255,255,0.45)", border: "rgba(0,0,0,0.15)",
      text: "#1a1a2e", accent: "#6366f1",
      shadow: "0 8px 32px rgba(0,0,0,0.12)", sidebar: "rgba(255,255,255,0.6)",
    },
    dark: {
      bg: "#0f172a", surface: "rgba(30,41,59,0.6)", border: "rgba(255,255,255,0.12)",
      text: "#e2e8f0", accent: "#818cf8",
      shadow: "0 8px 32px rgba(0,0,0,0.4)", sidebar: "rgba(15,23,42,0.7)",
    },
    borderRadius: "16px", backdropFilter: "blur(20px) saturate(180%)",
    font: "system-ui, -apple-system, sans-serif",
  },
  {
    id: "neobrutalism",
    name: "Neobrutalism",
    description: "Bold borders, solid shadows, raw aesthetic",
    style: "brutal",
    light: {
      bg: "#fef9c3", surface: "#ffffff", border: "#000000",
      text: "#000000", accent: "#ec4899",
      shadow: "4px 4px 0px #000000", sidebar: "#fef9c3",
    },
    dark: {
      bg: "#18181b", surface: "#27272a", border: "#ffffff",
      text: "#fafafa", accent: "#f472b6",
      shadow: "4px 4px 0px #ffffff", sidebar: "#18181b",
    },
    borderRadius: "0px", backdropFilter: "none",
    font: "'Space Mono', 'Courier New', monospace",
  },
  {
    id: "minimalism",
    name: "Minimalism",
    description: "Clean whites, thin lines, lots of space",
    style: "minimal",
    light: {
      bg: "#ffffff", surface: "#ffffff", border: "#f0f0f0",
      text: "#111111", accent: "#111111",
      shadow: "none", sidebar: "#ffffff",
    },
    dark: {
      bg: "#0a0a0a", surface: "#141414", border: "#262626",
      text: "#ededed", accent: "#ededed",
      shadow: "none", sidebar: "#0a0a0a",
    },
    borderRadius: "4px", backdropFilter: "none",
    font: "'Inter', system-ui, sans-serif",
  },
  {
    id: "classic",
    name: "Classic",
    description: "Traditional blue/gray corporate look",
    style: "classic",
    light: {
      bg: "#f1f5f9", surface: "#ffffff", border: "#e2e8f0",
      text: "#0f172a", accent: "#2563eb",
      shadow: "0 1px 3px rgba(0,0,0,0.1)", sidebar: "#f8fafc",
    },
    dark: {
      bg: "#0f172a", surface: "#1e293b", border: "#334155",
      text: "#f1f5f9", accent: "#60a5fa",
      shadow: "0 1px 3px rgba(0,0,0,0.4)", sidebar: "#0f172a",
    },
    borderRadius: "8px", backdropFilter: "none",
    font: "-apple-system, 'Segoe UI', Roboto, sans-serif",
  },
  {
    id: "fluid-glass",
    name: "Fluid Glass",
    description: "Animated gradients with glass overlay",
    style: "fluid",
    light: {
      bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      surface: "rgba(255,255,255,0.25)", border: "rgba(255,255,255,0.35)",
      text: "#ffffff", accent: "#fbbf24",
      shadow: "0 8px 32px rgba(102,126,234,0.4)", sidebar: "rgba(255,255,255,0.15)",
    },
    dark: {
      bg: "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)",
      surface: "rgba(255,255,255,0.1)", border: "rgba(255,255,255,0.2)",
      text: "#e2e8f0", accent: "#fbbf24",
      shadow: "0 8px 32px rgba(0,0,0,0.5)", sidebar: "rgba(0,0,0,0.3)",
    },
    borderRadius: "20px", backdropFilter: "blur(16px) saturate(200%)",
    font: "system-ui, -apple-system, sans-serif",
  },
  {
    id: "tinted-glass",
    name: "Tinted Glass",
    description: "Warm amber-tinted frosted panels",
    style: "tinted",
    light: {
      bg: "#fef3c7", surface: "rgba(255,255,255,0.5)", border: "rgba(245,158,11,0.3)",
      text: "#451a03", accent: "#d97706",
      shadow: "0 4px 24px rgba(217,119,6,0.15)", sidebar: "rgba(255,255,255,0.5)",
    },
    dark: {
      bg: "#1c1005", surface: "rgba(45,30,10,0.7)", border: "rgba(217,119,6,0.25)",
      text: "#fef3c7", accent: "#fbbf24",
      shadow: "0 4px 24px rgba(0,0,0,0.4)", sidebar: "rgba(28,16,5,0.8)",
    },
    borderRadius: "12px", backdropFilter: "blur(12px) saturate(150%)",
    font: "system-ui, -apple-system, sans-serif",
  },
  {
    id: "glow",
    name: "Glow",
    description: "Dark background with neon glow accents",
    style: "glow",
    light: {
      bg: "#f0f0ff", surface: "rgba(230,230,255,0.8)", border: "rgba(99,102,241,0.3)",
      text: "#1e1b4b", accent: "#6366f1",
      shadow: "0 0 20px rgba(99,102,241,0.15)", sidebar: "rgba(240,240,255,0.9)",
    },
    dark: {
      bg: "#0a0a1a", surface: "rgba(15,15,35,0.8)", border: "rgba(99,102,241,0.4)",
      text: "#e2e8f0", accent: "#818cf8",
      shadow: "0 0 20px rgba(99,102,241,0.3), 0 0 40px rgba(99,102,241,0.1)",
      sidebar: "rgba(10,10,26,0.9)",
    },
    borderRadius: "12px", backdropFilter: "blur(10px)",
    font: "'JetBrains Mono', 'Fira Code', monospace",
  },
  {
    id: "professional",
    name: "Professional",
    description: "Clean enterprise gray with blue accents",
    style: "pro",
    light: {
      bg: "#f8fafc", surface: "#ffffff", border: "#cbd5e1",
      text: "#1e293b", accent: "#0284c7",
      shadow: "0 1px 2px rgba(0,0,0,0.05)", sidebar: "#f1f5f9",
    },
    dark: {
      bg: "#0f172a", surface: "#1e293b", border: "#475569",
      text: "#e2e8f0", accent: "#38bdf8",
      shadow: "0 1px 2px rgba(0,0,0,0.3)", sidebar: "#0f172a",
    },
    borderRadius: "6px", backdropFilter: "none",
    font: "'Inter', -apple-system, sans-serif",
  },
  {
    id: "super-fast",
    name: "Super Fast",
    description: "No shadows, no blur, pure speed",
    style: "fast",
    light: {
      bg: "#ffffff", surface: "#ffffff", border: "#e5e7eb",
      text: "#000000", accent: "#2563eb",
      shadow: "none", sidebar: "#ffffff",
    },
    dark: {
      bg: "#000000", surface: "#111111", border: "#333333",
      text: "#ffffff", accent: "#60a5fa",
      shadow: "none", sidebar: "#000000",
    },
    borderRadius: "0px", backdropFilter: "none",
    font: "system-ui, sans-serif", disableAnimations: true,
  },
  {
    id: "super-3d",
    name: "Super 3D",
    description: "Multi-layered depth with extrude effect",
    style: "threed",
    light: {
      bg: "#ede9fe", surface: "#c4b5fd", border: "#8b5cf6",
      text: "#1e1b4b", accent: "#5b21b6",
      shadow: "3px 3px 0px #8b5cf6, 6px 6px 0px #5b21b6, 9px 9px 0px #3b0764",
      sidebar: "#ede9fe",
    },
    dark: {
      bg: "#1e1b4b", surface: "#312e81", border: "#4338ca",
      text: "#e0e7ff", accent: "#a5b4fc",
      shadow: "4px 4px 0px #1e1b4b, 8px 8px 0px #312e81, 12px 12px 0px #4338ca",
      sidebar: "#1e1b4b",
    },
    borderRadius: "4px", backdropFilter: "none",
    font: "'Space Mono', monospace",
  },
  {
    id: "frost",
    name: "Frost",
    description: "Ice-blue frosted surface, cool tones",
    style: "frost",
    light: {
      bg: "#e0f2fe", surface: "rgba(255,255,255,0.6)", border: "rgba(56,189,248,0.4)",
      text: "#0c4a6e", accent: "#0ea5e9",
      shadow: "0 4px 24px rgba(14,165,233,0.15)", sidebar: "rgba(255,255,255,0.5)",
    },
    dark: {
      bg: "#0c1929", surface: "rgba(15,30,50,0.7)", border: "rgba(56,189,248,0.25)",
      text: "#bae6fd", accent: "#38bdf8",
      shadow: "0 4px 24px rgba(0,0,0,0.4)", sidebar: "rgba(12,25,41,0.8)",
    },
    borderRadius: "14px", backdropFilter: "blur(14px) saturate(160%)",
    font: "system-ui, -apple-system, sans-serif",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Neon magenta + cyan on dark chrome",
    style: "cyber",
    light: {
      bg: "#fdf2f8", surface: "rgba(255,255,255,0.9)", border: "#ec4899",
      text: "#1a0520", accent: "#06b6d4",
      shadow: "0 0 12px rgba(6,182,212,0.2)", sidebar: "#fdf2f8",
    },
    dark: {
      bg: "#0d0221", surface: "rgba(13,2,33,0.9)", border: "#ff2a6d",
      text: "#d1f7ff", accent: "#05d9e8",
      shadow: "0 0 12px rgba(5,217,232,0.4), 4px 4px 0px #ff2a6d",
      sidebar: "rgba(13,2,33,0.95)",
    },
    borderRadius: "2px", backdropFilter: "blur(6px)",
    font: "'Share Tech Mono', 'Courier New', monospace",
  },
  {
    id: "paper",
    name: "Paper",
    description: "Off-white paper texture, ink-black text",
    style: "paper",
    light: {
      bg: "#faf8f5", surface: "#ffffff", border: "#e8e4df",
      text: "#2c2416", accent: "#b45309",
      shadow: "0 1px 4px rgba(0,0,0,0.08)", sidebar: "#faf8f5",
    },
    dark: {
      bg: "#1a1814", surface: "#252219", border: "#3d3629",
      text: "#e8e0d4", accent: "#f59e0b",
      shadow: "0 1px 4px rgba(0,0,0,0.3)", sidebar: "#1a1814",
    },
    borderRadius: "2px", backdropFilter: "none",
    font: "Georgia, 'Times New Roman', serif",
  },
  {
    id: "neon-rave",
    name: "Neon Rave",
    description: "Black with hot pink + lime neon",
    style: "neon",
    light: {
      bg: "#fafafa", surface: "#ffffff", border: "#16a34a",
      text: "#0a0a0a", accent: "#d946ef",
      shadow: "0 0 8px rgba(217,70,239,0.15)", sidebar: "#fafafa",
    },
    dark: {
      bg: "#000000", surface: "#111111", border: "#39ff14",
      text: "#ffffff", accent: "#ff00ff",
      shadow: "0 0 8px #ff00ff, 0 0 16px rgba(255,0,255,0.3)",
      sidebar: "#000000",
    },
    borderRadius: "8px", backdropFilter: "none",
    font: "monospace",
  },
  {
    id: "sunset-warm",
    name: "Sunset Warm",
    description: "Warm gradient bg, cozy surfaces",
    style: "sunset",
    light: {
      bg: "linear-gradient(160deg, #ff9a56 0%, #ff6a88 50%, #ff99ac 100%)",
      surface: "rgba(255,255,255,0.85)", border: "rgba(255,255,255,0.5)",
      text: "#4a1d1d", accent: "#c2185b",
      shadow: "0 8px 32px rgba(255,106,136,0.3)", sidebar: "rgba(255,255,255,0.5)",
    },
    dark: {
      bg: "linear-gradient(160deg, #7c2d12 0%, #9f1239 50%, #831843 100%)",
      surface: "rgba(255,255,255,0.1)", border: "rgba(255,255,255,0.15)",
      text: "#fef2f2", accent: "#fb7185",
      shadow: "0 8px 32px rgba(0,0,0,0.5)", sidebar: "rgba(0,0,0,0.3)",
    },
    borderRadius: "16px", backdropFilter: "blur(10px) saturate(140%)",
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
  { id: "pro", label: "Pro" },
  { id: "fast", label: "Fast" },
  { id: "3d", label: "3D" },
];

function ThemeCard({ theme, isActive, isDark, onApply }) {
  const meta = STYLE_META[theme.style] || {};
  const mode = isDark ? theme.dark : theme.light;
  const isGradient = mode.bg.includes("gradient");

  return (
    <button
      onClick={() => onApply(theme)}
      className={`w-full text-left p-4 transition-all duration-200 ${isActive ? "ring-4 ring-accent" : ""}`}
      style={{
        background: mode.surface,
        border: `2px solid ${mode.border}`,
        borderRadius: theme.borderRadius,
        boxShadow: theme.shadow,
        backdropFilter: theme.backdropFilter || "none",
        fontFamily: theme.font,
      }}
    >
      {/* Swatches */}
      <div className="flex gap-2 mb-3 items-center">
        <div className="w-7 h-7 shrink-0" style={{ background: isGradient ? mode.bg : mode.bg, border: `2px solid ${mode.border}`, borderRadius: "4px" }} />
        <div className="w-7 h-7 shrink-0" style={{ background: mode.accent, border: `2px solid ${mode.border}`, borderRadius: "4px" }} />
        <div className="w-7 h-7 shrink-0" style={{ background: mode.surface, border: `2px solid ${mode.border}`, borderRadius: "4px" }} />
        <span className="ml-auto text-[10px] font-bold uppercase px-2 py-0.5"
          style={{ color: mode.accent, border: `2px solid ${mode.border}`, borderRadius: "4px" }}>
          {meta.icon} {meta.tag}
        </span>
      </div>

      <h3 className="font-bold text-base mb-1" style={{ color: mode.text }}>{theme.name}</h3>
      <p className="text-xs leading-relaxed" style={{ color: mode.text, opacity: 0.6 }}>{theme.description}</p>

      {isActive && (
        <div className="mt-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: mode.accent }}>
          ✓ Active
        </div>
      )}
    </button>
  );
}

function PreviewCard({ theme, isDark }) {
  const mode = isDark ? theme.dark : theme.light;
  const isGradient = mode.bg.includes("gradient");

  return (
    <div className="p-6" style={{
      background: mode.surface, border: `2px solid ${mode.border}`,
      borderRadius: theme.borderRadius, boxShadow: theme.shadow,
      backdropFilter: theme.backdropFilter || "none", fontFamily: theme.font,
    }}>
      <h3 className="text-lg font-bold mb-2" style={{ color: mode.text }}>Preview Card</h3>
      <p className="text-sm mb-4" style={{ color: mode.text, opacity: 0.7 }}>
        This is how {theme.name} looks with {isDark ? "dark" : "light"} mode.
      </p>
      <input type="text" placeholder="Type something..."
        className="w-full mb-4 px-3 py-2 text-sm outline-none"
        style={{
          background: isGradient ? "rgba(255,255,255,0.2)" : mode.bg,
          border: `2px solid ${mode.border}`,
          borderRadius: theme.borderRadius === "0px" ? "0" : "8px",
          color: mode.text, fontFamily: theme.font,
        }}
      />
      <div className="flex flex-wrap gap-2">
        <button className="px-4 py-2 text-sm font-bold" style={{
          background: mode.accent, color: mode.text,
          border: `2px solid ${mode.border}`,
          borderRadius: theme.borderRadius === "0px" ? "0" : "8px",
          fontFamily: theme.font,
        }}>Primary</button>
        <button className="px-4 py-2 text-sm font-bold" style={{
          background: "transparent", color: mode.accent,
          border: `2px solid ${mode.accent}`,
          borderRadius: theme.borderRadius === "0px" ? "0" : "8px",
          fontFamily: theme.font,
        }}>Outline</button>
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
    if (saved) {
      const found = THEMES.find((t) => t.id === saved);
      if (found) setActiveTheme(saved);
    }
    if (darkSaved === "true") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const applyTheme = useCallback((theme, save = true) => {
    setActiveTheme(theme.id);
    if (save) {
      localStorage.setItem("theme-id", theme.id);
      setApplied(true);
      setTimeout(() => setApplied(false), 1200);
    }

    const mode = isDark ? theme.dark : theme.light;
    const root = document.documentElement;
    const isGradient = mode.bg.includes("gradient");

    root.style.setProperty("--color-bg", mode.bg);
    root.style.setProperty("--color-bg-alt", mode.bg);
    root.style.setProperty("--color-surface", mode.surface);
    root.style.setProperty("--color-surface-2", mode.surface);
    root.style.setProperty("--color-sidebar", mode.sidebar);
    root.style.setProperty("--color-border", mode.border);
    root.style.setProperty("--color-border-subtle", mode.border);
    root.style.setProperty("--color-text-main", mode.text);
    root.style.setProperty("--color-text", mode.text);
    root.style.setProperty("--color-primary", mode.accent);
    root.style.setProperty("--color-primary-hover", mode.accent);
    root.style.setProperty("--shadow-soft", theme.shadow);
    root.style.setProperty("--shadow-warm", theme.shadow);
    root.style.setProperty("--shadow-elevated", theme.shadow);
    root.style.setProperty("--shadow-elev", theme.shadow);
    root.style.setProperty("--radius-brand", theme.borderRadius);
    root.style.setProperty("--radius-brand-lg", theme.borderRadius);
    root.style.setProperty("--font-sans", theme.font);

    if (isGradient) {
      document.body.style.background = mode.bg;
      document.body.style.backgroundAttachment = "fixed";
    } else {
      document.body.style.background = "";
      document.body.style.backgroundAttachment = "";
    }

    if (theme.disableAnimations) {
      root.style.setProperty("--animation-duration", "0ms");
    } else {
      root.style.setProperty("--animation-duration", "");
    }
  }, [isDark]);

  const toggleDark = useCallback(() => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem("theme-dark", String(newDark));
    const root = document.documentElement;
    if (newDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    const theme = THEMES.find((t) => t.id === activeTheme);
    if (theme) applyTheme(theme, false);
  }, [isDark, activeTheme, applyTheme]);

  const currentTheme = THEMES.find((t) => t.id === activeTheme);
  const currentMode = currentTheme ? (isDark ? currentTheme.dark : currentTheme.light) : null;

  const filteredThemes = filter === "all"
    ? THEMES
    : THEMES.filter((t) => t.style === filter);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold mb-2">🎨 Themes</h1>
          <p className="text-text-muted text-sm">
            {THEMES.length} themes — each with light & dark mode. Toggle below.
          </p>
        </div>
        <button onClick={toggleDark} className="self-start px-4 py-2 text-sm font-bold shrink-0"
          style={{
            background: isDark ? "#ffffff" : "#000000",
            color: isDark ? "#000000" : "#ffffff",
            border: `2px solid ${isDark ? "#ffffff" : "#000000"}`,
            borderRadius: currentTheme?.borderRadius || "8px",
          }}>
          {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      {/* Toast */}
      {applied && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-green-500 text-white font-bold text-sm animate-bounce"
          style={{ borderRadius: currentTheme?.borderRadius || "8px" }}>
          ✓ Theme Applied!
        </div>
      )}

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STYLE_FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-all"
            style={{
              background: filter === f.id ? (currentMode?.text || "#000") : (currentMode?.surface || "#fff"),
              color: filter === f.id ? (currentMode?.bg?.includes?.("gradient") ? (isDark ? "#fff" : "#000") : currentMode?.bg || "#fff") : (currentMode?.text || "#000"),
              border: `2px solid ${currentMode?.border || "#000"}`,
              borderRadius: currentTheme?.borderRadius || "6px",
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {filteredThemes.map((theme) => (
          <ThemeCard key={theme.id} theme={theme} isDark={isDark}
            isActive={activeTheme === theme.id} onApply={applyTheme} />
        ))}
      </div>

      {/* Live Preview */}
      {currentTheme && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Live Preview — {currentTheme.name} ({isDark ? "Dark" : "Light"})</h2>
          <PreviewCard theme={currentTheme} isDark={isDark} />
        </div>
      )}
    </div>
  );
}
