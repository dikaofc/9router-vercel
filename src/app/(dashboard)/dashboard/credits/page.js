import React, { useState } from "react";
import {
  ExternalLink,
  Github,
  Package,
  Send,
  Globe,
  Coffee,
  Copy,
  Check,
  Heart,
  Info,
  ShieldCheck,
  Terminal,
  Cpu
} from "lucide-react";

// Win98 Classic Button Component with authentic 3D border & active press state
const Win98Button = ({ children, onClick, href, primary, icon: Icon, className = "" }) => {
  const content = (
    <span className="flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-sans text-black font-medium select-none">
      {Icon && <Icon className="w-3.5 h-3.5 text-gray-800" />}
      <span>{children}</span>
    </span>
  );

  const baseStyle = `
    relative inline-block bg-[#c0c0c0] cursor-pointer outline-none focus:outline-1 focus:outline-dotted focus:outline-black
    border-t-2 border-l-2 border-b-2 border-r-2
    border-t-[#ffffff] border-l-[#ffffff] border-b-[#000000] border-r-[#000000]
    shadow-[inset_-1px_-1px_0px_0px_#808080,inset_1px_1px_0px_0px_#dfdfdf]
    active:border-t-[#000000] active:border-l-[#000000] active:border-b-[#ffffff] active:border-r-[#ffffff]
    active:shadow-[inset_-1px_-1px_0px_0px_#dfdfdf,inset_1px_1px_0px_0px_#808080]
    active:translate-x-[1px] active:translate-y-[1px]
    ${primary ? "font-bold" : ""}
    ${className}
  `;

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={baseStyle}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={baseStyle}>
      {content}
    </button>
  );
};

// Group Box / Fieldset Component for classic Windows grouping
const Win98GroupBox = ({ label, icon: Icon, children }) => (
  <fieldset className="border-2 border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] p-3 mb-3 bg-[#c0c0c0] relative">
    {label && (
      <legend className="px-1.5 text-xs font-bold text-[#000080] bg-[#c0c0c0] flex items-center gap-1">
        {Icon && <Icon className="w-3.5 h-3.5 text-[#000080]" />}
        <span>{label}</span>
      </legend>
    )}
    {children}
  </fieldset>
);

export default function App() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const [statusMessage, setStatusMessage] = useState("Ready");

  const handleShare = () => {
    if (typeof window !== "undefined") {
      document.execCommand("copy");
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setStatusMessage("URL copied to clipboard!");
      setTimeout(() => {
        setCopied(false);
        setStatusMessage("Ready");
      }, 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#008080] flex items-center justify-center p-3 sm:p-6 font-sans text-xs antialiased selection:bg-[#000080] selection:text-white">
      {/* Main Window Container */}
      <div className="w-full max-w-xl bg-[#c0c0c0] border-t-2 border-l-2 border-b-2 border-r-2 border-t-[#ffffff] border-l-[#ffffff] border-b-[#000000] border-r-[#000000] shadow-[inset_-1px_-1px_0px_0px_#808080,inset_1px_1px_0px_0px_#dfdfdf] p-1">
        
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-[#000080] via-[#0000a0] to-[#1084d0] px-2 py-1 flex items-center justify-between text-white font-bold select-none mb-1">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-white shrink-0" />
            <span className="text-xs tracking-wide">9Router Properties & Credits</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="w-4 h-3.5 bg-[#c0c0c0] border-t border-l border-b-2 border-r-2 border-t-[#ffffff] border-l-[#ffffff] border-b-[#000000] border-r-[#000000] text-black text-[9px] font-black flex items-center justify-center leading-none active:translate-x-[1px] active:translate-y-[1px]">
              _
            </button>
            <button className="w-4 h-3.5 bg-[#c0c0c0] border-t border-l border-b-2 border-r-2 border-t-[#ffffff] border-l-[#ffffff] border-b-[#000000] border-r-[#000000] text-black text-[9px] font-black flex items-center justify-center leading-none active:translate-x-[1px] active:translate-y-[1px]">
              □
            </button>
            <button className="w-4 h-3.5 bg-[#c0c0c0] border-t border-l border-b-2 border-r-2 border-t-[#ffffff] border-l-[#ffffff] border-b-[#000000] border-r-[#000000] text-black text-[9px] font-black flex items-center justify-center leading-none active:translate-x-[1px] active:translate-y-[1px]">
              ×
            </button>
          </div>
        </div>

        {/* Menu Bar */}
        <div className="flex gap-3 px-2 py-0.5 text-xs text-black border-b border-[#808080] mb-2 select-none">
          <span className="cursor-pointer hover:bg-[#000080] hover:text-white px-1"><u>F</u>ile</span>
          <span className="cursor-pointer hover:bg-[#000080] hover:text-white px-1"><u>E</u>dit</span>
          <span className="cursor-pointer hover:bg-[#000080] hover:text-white px-1"><u>V</u>iew</span>
          <span className="cursor-pointer hover:bg-[#000080] hover:text-white px-1"><u>H</u>elp</span>
        </div>

        {/* Tabs Header */}
        <div className="flex gap-1 px-2 pt-1 border-b-2 border-[#808080]">
          <button
            onClick={() => setActiveTab("about")}
            className={`px-3 py-1 text-xs select-none border-t-2 border-l-2 border-r-2 ${
              activeTab === "about"
                ? "bg-[#c0c0c0] border-t-[#ffffff] border-l-[#ffffff] border-r-[#000000] font-bold -mb-[2px] pb-1.5 z-10"
                : "bg-[#b0b0b0] border-t-[#dfdfdf] border-l-[#dfdfdf] border-r-[#808080] text-gray-700"
            }`}
          >
            Core Package
          </button>
          <button
            onClick={() => setActiveTab("vercel")}
            className={`px-3 py-1 text-xs select-none border-t-2 border-l-2 border-r-2 ${
              activeTab === "vercel"
                ? "bg-[#c0c0c0] border-t-[#ffffff] border-l-[#ffffff] border-r-[#000000] font-bold -mb-[2px] pb-1.5 z-10"
                : "bg-[#b0b0b0] border-t-[#dfdfdf] border-l-[#dfdfdf] border-r-[#808080] text-gray-700"
            }`}
          >
            Vercel Patch
          </button>
          <button
            onClick={() => setActiveTab("support")}
            className={`px-3 py-1 text-xs select-none border-t-2 border-l-2 border-r-2 ${
              activeTab === "support"
                ? "bg-[#c0c0c0] border-t-[#ffffff] border-l-[#ffffff] border-r-[#000000] font-bold -mb-[2px] pb-1.5 z-10"
                : "bg-[#b0b0b0] border-t-[#dfdfdf] border-l-[#dfdfdf] border-r-[#808080] text-gray-700"
            }`}
          >
            Support & Info
          </button>
        </div>

        {/* Main Content Area */}
        <div className="p-3 bg-[#c0c0c0]">
          {activeTab === "about" && (
            <Win98GroupBox label="Project Specifications" icon={Terminal}>
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-white border-2 border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] shrink-0">
                  <Cpu className="w-8 h-8 text-[#000080]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-black mb-1">9Router v0.5.55</h2>
                  <p className="text-xs text-gray-800 leading-normal">
                    Universal AI Router built by <b>decolua</b> & community contributors. Supports 40+ LLM providers with automatic fallback routing and RTK token optimization.
                  </p>
                </div>
              </div>

              {/* Inset Details Box */}
              <div className="bg-white border-2 border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] p-2 mb-3 text-xs space-y-1 text-gray-800">
                <div className="flex justify-between border-b border-gray-200 pb-0.5">
                  <span className="text-gray-500">Maintainer:</span>
                  <span className="font-mono">decolua</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-0.5">
                  <span className="text-gray-500">Providers Supported:</span>
                  <span className="font-mono">40+ Endpoints</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Optimization:</span>
                  <span className="font-mono">RTK Token Saver Enabled</span>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Win98Button href="https://github.com/decolua/9router" icon={Github}>
                  GitHub Repo
                </Win98Button>
                <Win98Button href="https://www.npmjs.com/package/9router" icon={Package}>
                  npm Registry
                </Win98Button>
              </div>
            </Win98GroupBox>
          )}

          {activeTab === "vercel" && (
            <Win98GroupBox label="Serverless Patch Details" icon={ShieldCheck}>
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-white border-2 border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] shrink-0">
                  <Globe className="w-8 h-8 text-[#1084d0]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-black mb-1">Vercel Deployment Patch</h2>
                  <p className="text-xs text-gray-800 leading-normal">
                    Zero-config deployment layer for Vercel free tier. Features in-memory SQLite integration and HMAC signature authentication. Engineered by <b>Dika</b>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <Win98Button href="https://t.me/dikaacode" icon={Send} className="w-full">
                  Telegram
                </Win98Button>
                <Win98Button href="https://www.obitoglory.tech" icon={Globe} className="w-full">
                  Website
                </Win98Button>
                <Win98Button href="https://github.com/dikaofc" icon={Github} className="w-full">
                  GitHub
                </Win98Button>
                <Win98Button href="https://saweria.co/dikatech" icon={Coffee} className="w-full">
                  Donate
                </Win98Button>
              </div>
            </Win98GroupBox>
          )}

          {activeTab === "support" && (
            <Win98GroupBox label="Contribution & Share" icon={Info}>
              <p className="text-xs text-gray-800 mb-3 leading-normal">
                If this deployment patch reduced your server costs or simplified your workflow, consider supporting the developer or sharing this page with other devs.
              </p>

              <div className="p-3 bg-white border-2 border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coffee className="w-5 h-5 text-[#800000]" />
                  <div>
                    <div className="font-bold text-xs">Buy Me a Coffee</div>
                    <div className="text-[10px] text-gray-500">Support via Saweria</div>
                  </div>
                </div>
                <Win98Button href="https://saweria.co/dikatech" primary icon={ExternalLink}>
                  Donate ☕
                </Win98Button>
              </div>

              <div className="flex justify-end gap-2">
                <Win98Button onClick={handleShare} icon={copied ? Check : Copy} primary={copied}>
                  {copied ? "Link Copied!" : "Copy Page URL"}
                </Win98Button>
              </div>
            </Win98GroupBox>
          )}

          {/* Quick Action Bar at bottom */}
          <div className="pt-2 flex justify-between items-center border-t border-[#dfdfdf]">
            <div className="flex items-center gap-1 text-[11px] text-gray-700">
              <Heart className="w-3.5 h-3.5 text-red-600 fill-red-600" />
              <span>Made for open source community</span>
            </div>
            <div className="flex gap-2">
              <Win98Button onClick={() => setActiveTab("about")}>
                OK
              </Win98Button>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="border-t-2 border-l-2 border-b border-r border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] bg-[#c0c0c0] px-2 py-0.5 text-[10px] text-black flex justify-between items-center select-none mt-1">
          <span className="truncate pr-2 font-mono">{statusMessage}</span>
          <span className="border-l border-[#808080] pl-2 text-gray-600 shrink-0">v0.5.55 (Vercel Build)</span>
        </div>

      </div>
    </div>
  );
}

