"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Cpu,
  CheckCircle2,
  Eye,
  FileText,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  Filter,
} from "lucide-react";
import { OpenRouterModelInfo } from "@/lib/openrouter";

interface AIModelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModel: string;
  onSelectModel: (modelId: string) => void;
}

export default function AIModelManagerModal({
  isOpen,
  onClose,
  currentModel,
  onSelectModel,
}: AIModelManagerModalProps) {
  const [models, setModels] = useState<OpenRouterModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "vision" | "text">("vision");
  const [testingModel, setTestingModel] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ model: string; duration: number; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchModels();
    }
  }, [isOpen]);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/models");
      const data = await res.json();
      if (data.allModels) {
        setModels(data.allModels);
      }
    } catch (err) {
      console.error("Modellarni olishda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestModel = async (modelId: string, isVision: boolean) => {
    setTestingModel(modelId);
    setTestResult(null);
    try {
      const res = await fetch("/api/ai/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelId,
          testVision: isVision,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          model: data.modelUsed,
          duration: data.durationMs,
          text: data.result,
        });
      }
    } catch (err) {
      console.error("Modelni sinashda xatolik:", err);
    } finally {
      setTestingModel(null);
    }
  };

  if (!isOpen) return null;

  const filteredModels = models.filter((m) => {
    if (filter === "vision") return m.supportsVision && m.isFree;
    if (filter === "text") return !m.supportsVision && m.isFree;
    return m.isFree;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden">
      <div className="bg-white rounded-3xl max-w-4xl w-full h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top bar */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
                <span>OpenRouter Bepul Modellari Boshqaruvi</span>
                <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  .env API Key Faol
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Mars IT o&apos;quvchilarining skrinshot va kodlarini tekshirish uchun jonli modellar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="flex items-center bg-white rounded-xl p-1 border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setFilter("vision")}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  filter === "vision"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Bepul Vision Modellari ({models.filter((m) => m.supportsVision && m.isFree).length})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilter("text")}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  filter === "text"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Faqat Matn/Kod ({models.filter((m) => !m.supportsVision && m.isFree).length})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  filter === "all"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Barchasi ({models.filter((m) => m.isFree).length})</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchModels}
            className="py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Yangilash</span>
          </button>
        </div>

        {/* Live Test Banner */}
        {testResult && (
          <div className="p-3 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between text-xs text-emerald-900 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                <strong>{testResult.model}</strong> muvaffaqiyatli javob berdi ({testResult.duration}ms): &ldquo;
                {testResult.text}&rdquo;
              </span>
            </div>
            <button
              type="button"
              onClick={() => setTestResult(null)}
              className="text-emerald-700 hover:text-emerald-950 font-bold ml-2"
            >
              ×
            </button>
          </div>
        )}

        {/* Models list */}
        <div className="flex-1 p-5 overflow-y-auto space-y-3">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3 text-center">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500">OpenRouter jonli katalogi yuklanmoqda...</p>
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Ushbu filtr bo&apos;yicha model topilmadi.
            </div>
          ) : (
            filteredModels.map((m) => {
              const isSelected = currentModel === m.id;
              const isTesting = testingModel === m.id;

              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-indigo-50/60 border-indigo-300 ring-1 ring-indigo-400/50 shadow-sm"
                      : "bg-white hover:bg-slate-50 border-slate-200 shadow-2xs"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 text-sm">{m.name}</span>
                      {isSelected && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Asosiy Tanlangan</span>
                        </span>
                      )}
                      {m.supportsVision ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                          <Eye className="w-3 h-3 text-purple-600" />
                          <span>Vision Bor (Rasmni ko&apos;radi)</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-500" />
                          <span>Faqat Matn</span>
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                        100% Bepul ($0)
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                      <span>ID: {m.id}</span>
                      <span>•</span>
                      <span>Kontekst: {m.contextLength.toLocaleString()} token</span>
                    </div>

                    {m.description && (
                      <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">
                        {m.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isTesting}
                      onClick={() => handleTestModel(m.id, m.supportsVision)}
                      className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isTesting ? (
                        <div className="w-3 h-3 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Play className="w-3 h-3 fill-current" />
                      )}
                      <span>Sinash</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectModel(m.id);
                      }}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                      }`}
                    >
                      {isSelected ? "Tanlangan" : "Tanlash"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Mars IT AI: Asosiy model <strong>{currentModel}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}
