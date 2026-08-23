"use client";

import { useState, useEffect } from "react";

const THEMES = [
  {
    id: "liquid-yellow",
    name: "Liquid Yellow",
    description: "Bold yellow with liquid glass",
    bg: "#fef9c3",
    surface: "rgba(255, 255, 255, 0.85)",
    border: "#000000",
    text: "#000000",
    accent: "#fde047",
    shadow: "#000000",
  },
  {
    id: "neon-pink",
    name: "Neon Pink",
    description: "Vibrant pink neobrutalism",
    bg: "#fce7f3",
    surface: "rgba(255, 255, 255, 0.9)",
    border: "#000000",
    text: "#000000",
    accent: "#ec4899",
    shadow: "#000000",
  },
  {
    id: "electric-blue",
    name: "Electric Blue",
    description: "Bold blue with electric vibes",
    bg: "#dbeafe",
    surface: "rgba(255, 255, 255, 0.9)",
    border: "#000000",
    text: "#000000",
    accent: "#3b82f6",
    shadow: "#000000",
  },
  {
    id: "cyber-green",
    name: "Cyber Green",
    description: "Matrix-style green",
    bg: "#dcfce7",
    surface: "rgba(255, 255, 255, 0.9)",
    border: "#000000",
    text: "#000000",
    accent: "#22c55e",
    shadow: "#000000",
  },
  {
    id: "sunset-orange",
    name: "Sunset Orange",
    description: "Warm orange sunset",
    bg: "#fed7aa",
    surface: "rgba(255, 255, 255, 0.9)",
    border: "#000000",
    text: "#000000",
    accent: "#f97316",
    shadow: "#000000",
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    description: "Majestic purple theme",
    bg: "#f3e8ff",
    surface: "rgba(255, 255, 255, 0.9)",
    border: "#000000",
    text: "#000000",
    accent: "#a855f7",
    shadow: "#000000",
  },
  {
    id: "midnight-dark",
    name: "Midnight Dark",
    description: "Pure black with white borders",
    bg: "#000000",
    surface: "rgba(26, 26, 26, 0.9)",
    border: "#ffffff",
    text: "#ffffff",
    accent: "#fde047",
    shadow: "#ffffff",
  },
  {
    id: "retro-cyan",
    name: "Retro Cyan",
    description: "80s retro cyan",
    bg: "#cffafe",
    surface: "rgba(255, 255, 255, 0.9)",
    border: "#000000",
    text: "#000000",
    accent: "#06b6d4",
    shadow: "#000000",
  },
  {
    id: "hot-red",
    name: "Hot Red",
    description: "Fiery red neobrutalism",
    bg: "#fee2e2",
    surface: "rgba(255, 255, 255, 0.9)",
    border: "#000000",
    text: "#000000",
    accent: "#ef4444",
    shadow: "#000000",
  },
  {
    id: "mint-fresh",
    name: "Mint Fresh",
    description: "Cool mint green",
    bg: "#d1fae5",
    surface: "rgba(255, 255, 255, 0.9)",
    border: "#000000",
    text: "#000000",
    accent: "#10b981",
    shadow: "#000000",
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    description: "Warm golden tones",
    bg: "#fef3c7",
    surface: "rgba(255, 255, 255, 0.9)",
    border: "#000000",
    text: "#000000",
    accent: "#f59e0b",
    shadow: "#000000",
  },
  {
    id: "lavender-dream",
    name: "Lavender Dream",
    description: "Soft lavender purple",
    bg: "#ede9fe",
    surface: "rgba(255, 255, 255, 0.9)",
    border: "#000000",
    text: "#000000",
    accent: "#8b5cf6",
    shadow: "#000000",
  },
];

export default function ThemesPage() {
  const [activeTheme, setActiveTheme] = useState("liquid-yellow");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) {
      const theme = THEMES.find((t) => t.id === saved);
      if (theme) setActiveTheme(saved);
    }
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const applyTheme = (theme) => {
    setActiveTheme(theme.id);
    localStorage.setItem("theme", theme.id);

    const root = document.documentElement;
    root.style.setProperty("--color-bg", theme.bg);
    root.style.setProperty("--color-surface", theme.surface);
    root.style.setProperty("--color-border", theme.border);
    root.style.setProperty("--color-text-main", theme.text);
    root.style.setProperty("--color-primary", theme.accent);
    root.style.setProperty("--shadow-soft", `4px 4px 0px ${theme.shadow}`);
    root.style.setProperty("--shadow-warm", `4px 4px 0px ${theme.shadow}`);
    root.style.setProperty("--shadow-elevated", `6px 6px 0px ${theme.shadow}`);
  };

  const toggleDark = () => {
    const root = document.documentElement;
    setIsDark(!isDark);
    root.classList.toggle("dark");
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-4xl font-bold mb-2">Themes</h1>
        <p className="text-text-muted">
          Choose a theme for your dashboard
        </p>
      </div>

      {/* Dark Mode Toggle */}
      <div className="mb-8">
        <button
          onClick={toggleDark}
          className="btn-brutal"
          style={{
            background: isDark ? "#ffffff" : "#000000",
            color: isDark ? "#000000" : "#ffffff",
            borderColor: isDark ? "#ffffff" : "#000000",
          }}
        >
          {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => applyTheme(theme)}
            className={`card-liquid p-4 text-left transition-all ${
              activeTheme === theme.id
                ? "ring-4 ring-black dark:ring-white"
                : ""
            }`}
            style={{
              background: theme.surface,
              borderColor: theme.border,
            }}
          >
            {/* Color Preview */}
            <div className="flex gap-2 mb-3">
              <div
                className="w-8 h-8 rounded"
                style={{ background: theme.bg, border: `2px solid ${theme.border}` }}
              />
              <div
                className="w-8 h-8 rounded"
                style={{ background: theme.accent, border: `2px solid ${theme.border}` }}
              />
              <div
                className="w-8 h-8 rounded"
                style={{ background: theme.surface, border: `2px solid ${theme.border}` }}
              />
            </div>

            {/* Theme Info */}
            <h3
              className="font-bold text-lg mb-1"
              style={{ color: theme.text }}
            >
              {theme.name}
            </h3>
            <p
              className="text-sm"
              style={{ color: theme.text, opacity: 0.7 }}
            >
              {theme.description}
            </p>

            {/* Active Indicator */}
            {activeTheme === theme.id && (
              <div
                className="mt-3 text-xs font-bold uppercase"
                style={{ color: theme.accent }}
              >
                ✓ Active
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Preview Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Preview</h2>
        <div className="card-liquid p-6">
          <h3 className="text-lg font-bold mb-2">Card Title</h3>
          <p className="text-text-muted mb-4">
            This is a preview of how the theme looks with content.
          </p>
          <div className="flex gap-2">
            <button className="btn-brutal btn-brutal-primary">Primary</button>
            <button className="btn-brutal btn-brutal-blue">Blue</button>
            <button className="btn-brutal btn-brutal-pink">Pink</button>
          </div>
        </div>
      </div>
    </div>
  );
}
