"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Play,
  RotateCcw,
  Copy,
  Check,
  Code2,
  Terminal,
  Maximize2,
  ExternalLink,
} from "lucide-react";

interface CodeSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  title?: string;
}

export default function CodeSandboxModal({
  isOpen,
  onClose,
  initialCode = "",
  title = "Live Kod Sandbox",
}: CodeSandboxModalProps) {
  const [code, setCode] = useState(initialCode);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"code" | "preview" | "split">("split");
  const [copied, setCopied] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      setLogs([]);
    }
  }, [initialCode, isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCode(initialCode);
    setLogs([]);
    setKey((prev) => prev + 1);
  };

  // Prepare iframe HTML: inject console interceptor if it's JS/HTML
  const prepareSrcDoc = (userCode: string) => {
    const isHtml = /<[a-z][\s\S]*>/i.test(userCode);

    if (isHtml) {
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 16px; color: #1e293b; }
  </style>
  <script>
    const _origLog = console.log;
    const _origErr = console.error;
    window.addEventListener('error', (e) => {
      window.parent.postMessage({ type: 'SANDBOX_LOG', level: 'error', message: e.message }, '*');
    });
    console.log = (...args) => {
      _origLog(...args);
      window.parent.postMessage({ type: 'SANDBOX_LOG', level: 'log', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
    };
    console.error = (...args) => {
      _origErr(...args);
      window.parent.postMessage({ type: 'SANDBOX_LOG', level: 'error', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
    };
  </script>
</head>
<body>
  ${userCode}
</body>
</html>`;
    }

    // Pure JavaScript
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: monospace; background: #0f172a; color: #38bdf8; padding: 16px; font-size: 13px; }
  </style>
  <script>
    const _origLog = console.log;
    const _origErr = console.error;
    function print(msg, color = '#38bdf8') {
      const el = document.createElement('div');
      el.style.color = color;
      el.style.marginBottom = '6px';
      el.textContent = '▶ ' + msg;
      document.body.appendChild(el);
    }
    console.log = (...args) => {
      const txt = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      print(txt, '#4ade80');
      window.parent.postMessage({ type: 'SANDBOX_LOG', level: 'log', message: txt }, '*');
    };
    console.error = (...args) => {
      const txt = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      print('Xatolik: ' + txt, '#f87171');
      window.parent.postMessage({ type: 'SANDBOX_LOG', level: 'error', message: txt }, '*');
    };
    window.addEventListener('error', (e) => {
      print('Xatolik: ' + e.message, '#f87171');
      window.parent.postMessage({ type: 'SANDBOX_LOG', level: 'error', message: e.message }, '*');
    });
  </script>
</head>
<body>
  <div style="color: #94a3b8; margin-bottom: 12px; font-size: 11px;">// Natijalar konsoli:</div>
  <script>
    try {
      ${userCode}
    } catch(err) {
      console.error(err.message);
    }
  </script>
</body>
</html>`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 md:p-6 overflow-hidden">
      <div className="bg-slate-900 text-white rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl border border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top bar */}
        <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
                <span>{title}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Live Runner
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                HTML, CSS va JavaScript kodlarini to&apos;g&apos;ridan-to&apos;g&apos;ri sinab ko&apos;ring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="hidden sm:flex items-center bg-slate-900 rounded-xl p-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab("split")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === "split" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Taqsimlangan (Split)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("code")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === "code" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Faqat Kod
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === "preview" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Natija (Preview)
              </button>
            </div>

            {/* Run button */}
            <button
              type="button"
              onClick={() => setKey((k) => k + 1)}
              className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Ishga tushirish</span>
            </button>

            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopy}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
              title="Kodni nusxalash"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Reset button */}
            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
              title="Kodni asl holiga qaytarish"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workspace Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
          {/* Code Editor Area */}
          {(activeTab === "split" || activeTab === "code") && (
            <div
              className={`flex flex-col h-full border-r border-slate-800 bg-slate-950 ${
                activeTab === "code" ? "col-span-2" : ""
              }`}
            >
              <div className="py-2 px-4 bg-slate-900/80 border-b border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
                <span>// Muharrir (Editor)</span>
                <span className="text-[11px] text-slate-500">Tahrirlash mumkin</span>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Dasturlash kodini shu yerga yozing..."
                className="flex-1 w-full p-4 bg-slate-950 text-emerald-300 font-mono text-xs leading-relaxed outline-none resize-none placeholder:text-slate-600 focus:bg-slate-900/40 transition-colors"
                spellCheck={false}
              />
            </div>
          )}

          {/* Live Preview / Iframe Area */}
          {(activeTab === "split" || activeTab === "preview") && (
            <div
              className={`flex flex-col h-full bg-slate-900 ${
                activeTab === "preview" ? "col-span-2" : ""
              }`}
            >
              <div className="py-2 px-4 bg-slate-800/80 border-b border-slate-700 text-xs font-mono text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Jonli Natija (Live Output)</span>
                </span>
                <span className="text-[11px] text-slate-400">Izolatsiyalangan muhit</span>
              </div>
              <div className="flex-1 bg-white relative">
                <iframe
                  key={key}
                  srcDoc={prepareSrcDoc(code)}
                  title="Code Sandbox Preview"
                  sandbox="allow-scripts allow-modals"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
