/**
 * SVG icons for theme styles — zero emojis, pure SVG.
 * All icons are 16x16, inherit currentColor.
 */
export const ThemeIcon = ({ style, className = "" }) => {
  const s = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.5, className };
  switch (style) {
    /* Glass */
    case "glass": return (
      <svg {...s}><rect x="2" y="3" width="12" height="10" rx="2" opacity=".5"/><path d="M5 7h6M6 9h4" opacity=".3"/></svg>
    );
    case "fluid": return (
      <svg {...s}><path d="M2 8c2-3 4-5 6-5s4 2 6 5-2 5-6 5-4-2-6-5z" opacity=".5"/><circle cx="8" cy="8" r="2" opacity=".3"/></svg>
    );
    case "tinted": return (
      <svg {...s}><rect x="2" y="3" width="12" height="10" rx="2" fill="currentColor" opacity=".15"/><circle cx="8" cy="8" r="3" opacity=".4"/></svg>
    );
    case "frost": return (
      <svg {...s}><path d="M8 1v14M1 8h14M3 3l10 10M13 3L3 13" opacity=".3"/><circle cx="8" cy="8" r="2" opacity=".5"/></svg>
    );
    case "aurora": return (
      <svg {...s}><path d="M1 12c2-4 4-8 7-8s5 4 7 8" opacity=".4"/><path d="M3 10c1.5-3 3.5-5 5-5s3.5 2 5 5" opacity=".6"/></svg>
    );
    /* Brutal */
    case "brutal": return (
      <svg {...s} strokeWidth="2.5"><rect x="2" y="2" width="12" height="12" rx="0"/><path d="M5 8h6M8 5v6" opacity=".4"/></svg>
    );
    case "terminal": return (
      <svg {...s} strokeWidth="1.5"><rect x="1" y="2" width="14" height="12" rx="1"/><path d="M4 6l2 2-2 2M8 10h4" opacity=".6"/></svg>
    );
    /* Minimal */
    case "minimal": return (
      <svg {...s} strokeWidth="1"><line x1="3" y1="4" x2="13" y2="4"/><line x1="3" y1="8" x2="10" y2="8"/><line x1="3" y1="12" x2="7" y2="12"/></svg>
    );
    case "swiss": return (
      <svg {...s} strokeWidth="1"><rect x="2" y="2" width="5" height="5"/><rect x="9" y="2" width="5" height="5"/><rect x="2" y="9" width="12" height="5"/></svg>
    );
    /* Classic */
    case "classic": return (
      <svg {...s}><rect x="2" y="3" width="12" height="10" rx="1" opacity=".3"/><path d="M2 6h12" strokeWidth="1"/></svg>
    );
    case "corporate": return (
      <svg {...s}><rect x="1" y="3" width="6" height="10" rx="1" opacity=".3"/><rect x="9" y="3" width="6" height="4" rx="1" opacity=".3"/><rect x="9" y="9" width="6" height="4" rx="1" opacity=".3"/></svg>
    );
    case "enterprise": return (
      <svg {...s}><rect x="1" y="2" width="4" height="12" rx="1" opacity=".3"/><rect x="6" y="2" width="9" height="5" rx="1" opacity=".3"/><rect x="6" y="9" width="4" height="5" rx="1" opacity=".3"/><rect x="11" y="9" width="4" height="5" rx="1" opacity=".3"/></svg>
    );
    /* Fluid */
    case "liquid": return (
      <svg {...s}><ellipse cx="6" cy="8" rx="4" ry="5" opacity=".3"/><ellipse cx="10" cy="8" rx="4" ry="5" opacity=".3"/></svg>
    );
    /* Glow */
    case "glow": return (
      <svg {...s}><circle cx="8" cy="8" r="3" opacity=".5"/><circle cx="8" cy="8" r="6" opacity=".15"/><circle cx="8" cy="8" r="1.5"/></svg>
    );
    /* Cyber */
    case "cyber": return (
      <svg {...s} strokeWidth="1"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="3"/><line x1="8" y1="2" x2="8" y2="5"/><line x1="8" y1="11" x2="8" y2="14"/><line x1="2" y1="8" x2="5" y2="8"/><line x1="11" y1="8" x2="14" y2="8"/></svg>
    );
    case "neon": return (
      <svg {...s}><path d="M4 12V6l4-4 4 4v6" opacity=".5"/><circle cx="8" cy="9" r="1.5"/></svg>
    );
    case "cyberpunk": return (
      <svg {...s} strokeWidth="1"><polygon points="8,1 15,6 12,15 4,15 1,6" opacity=".4"/><path d="M5 8h6M6 10h4" strokeWidth="1.5"/></svg>
    );
    /* 3D */
    case "threed": return (
      <svg {...s} strokeWidth="1"><rect x="3" y="5" width="8" height="8" rx="1"/><path d="M3 5l3-3h8l3 3v8l-3 3H6l-3-3z" opacity=".3"/><path d="M11 2v8M11 10l3-3" opacity=".2"/></svg>
    );
    case "3d": return (
      <svg {...s} strokeWidth="1"><path d="M8 2L2 6v8l6 4 6-4V6z" opacity=".3"/><path d="M8 2v12M2 6l6 4 6-4" opacity=".2"/></svg>
    );
    /* Paper */
    case "paper": return (
      <svg {...s} strokeWidth="1"><path d="M3 2h8l2 2v10H3z" opacity=".3"/><path d="M5 6h6M5 8h5M5 10h4" opacity=".4"/></svg>
    );
    /* Fast */
    case "fast": return (
      <svg {...s} strokeWidth="2"><path d="M9 2L4 9h4l-1 5 5-7H8z"/></svg>
    );
    /* Pro */
    case "pro": return (
      <svg {...s} strokeWidth="1"><rect x="2" y="3" width="12" height="10" rx="1" opacity=".3"/><path d="M2 5h12" strokeWidth="1"/><circle cx="4" cy="4" r=".5" fill="currentColor"/><circle cx="5.5" cy="4" r=".5" fill="currentColor"/></svg>
    );
    /* Sunset */
    case "sunset": return (
      <svg {...s}><circle cx="8" cy="10" r="4" opacity=".4"/><path d="M2 10h12" strokeWidth="1"/><path d="M4 7l4-5 4 5" opacity=".3"/></svg>
    );
    /* VisionOS */
    case "visionos": return (
      <svg {...s}><rect x="2" y="4" width="12" height="8" rx="4" opacity=".4"/><circle cx="8" cy="8" r="2" opacity=".5"/></svg>
    );
    /* Y2K */
    case "y2k": return (
      <svg {...s}><circle cx="8" cy="8" r="6" opacity=".3"/><circle cx="8" cy="8" r="3" opacity=".5"/><path d="M5 5l6 6M11 5L5 11" opacity=".3"/></svg>
    );
    /* Vaporwave */
    case "vaporwave": return (
      <svg {...s} strokeWidth="1"><path d="M1 12h14" /><path d="M3 10l2-2 2 2 2-2 2 2 2-2" opacity=".5"/><rect x="5" y="2" width="6" height="4" rx="3" opacity=".3"/></svg>
    );
    /* HUD */
    case "hud": return (
      <svg {...s} strokeWidth="1"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="3"/><line x1="8" y1="1" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="1" y1="8" x2="3" y2="8"/><line x1="13" y1="8" x2="15" y2="8"/></svg>
    );
    /* Monochrome */
    case "monochrome": return (
      <svg {...s} strokeWidth="1"><rect x="2" y="2" width="12" height="12" rx="6" opacity=".2"/><circle cx="8" cy="8" r="4" fill="currentColor" opacity=".6"/></svg>
    );
    /* Luxury */
    case "luxury": return (
      <svg {...s} strokeWidth="1"><path d="M8 1l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z" opacity=".5"/></svg>
    );
    /* Bento */
    case "bento": return (
      <svg {...s} strokeWidth="1"><rect x="1" y="1" width="6" height="6" rx="1" opacity=".3"/><rect x="9" y="1" width="6" height="6" rx="1" opacity=".3"/><rect x="1" y="9" width="6" height="6" rx="1" opacity=".3"/><rect x="9" y="9" width="6" height="6" rx="1" opacity=".3"/><rect x="1" y="1" width="14" height="3" rx="1" opacity=".1"/></svg>
    );
    /* Default fallback */
    default: return (
      <svg {...s}><circle cx="8" cy="8" r="5" opacity=".4"/></svg>
    );
  }
};
