"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Play,
  FileCode,
  ThumbsUp,
  Cpu,
} from "lucide-react";
import { AIReviewResult } from "@/lib/openrouter";

interface AIReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: AIReviewResult | null;
  loading: boolean;
  studentName?: string;
  taskTitle?: string;
  onApplyFeedback: (feedbackText: string, verdict: "CORRECT" | "INCORRECT" | "RETRY") => void;
  onOpenSandbox?: (code: string) => void;
}

export default function AIReviewModal({
  isOpen,
  onClose,
  review,
  loading,
  studentName,
  taskTitle,
  onApplyFeedback,
  onOpenSandbox,
}: AIReviewModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [applied, setApplied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleApply = () => {
    if (!review) return;
    const mappedVerdict =
      review.status === "CORRECT"
        ? "CORRECT"
        : review.status === "INCORRECT"
        ? "INCORRECT"
        : "RETRY";

    onApplyFeedback(review.teacherFeedback, mappedVerdict);
    setApplied(true);
    setTimeout(() => {
      setApplied(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight flex items-center gap-2">
                <span>OpenRouter AI Kod Tahlili</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  100% Bepul Vision
                </span>
              </h2>
              <p className="text-xs text-white/80">
                {studentName ? `${studentName} — ` : ""}
                {taskTitle || "Vazifa tahlili"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-slate-700 text-sm">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <div>
                <p className="font-bold text-slate-800 text-base">
                  Skrinshot OpenRouter orqali tahlil qilinmoqda...
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Dasturlash tili, sintaksis xatolar va o&apos;qituvchi sharhi shakllanmoqda
                </p>
              </div>
            </div>
          ) : review ? (
            <>
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">Til:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5" />
                    {review.language}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs font-semibold text-slate-500">Tavsiya baho:</div>
                  <span
                    className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 ${
                      review.status === "CORRECT"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : review.status === "INCORRECT"
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {review.status === "CORRECT" && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {review.status === "INCORRECT" && <AlertTriangle className="w-3.5 h-3.5" />}
                    {review.status === "NEEDS_REVISION" && <AlertTriangle className="w-3.5 h-3.5" />}
                    {review.status === "RETRY" && <AlertTriangle className="w-3.5 h-3.5" />}
                    <span>
                      {review.status === "CORRECT"
                        ? "To'g'ri (Qabul)"
                        : review.status === "INCORRECT"
                        ? "Xato"
                        : "Qayta ko'rish"}
                    </span>
                    <span className="text-[11px] font-mono font-black">
                      ({review.suggestedScore} ball)
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{review.modelUsed}</span>
                </div>
              </div>

              {/* Summary */}
              {review.summary && (
                <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100">
                  <span className="text-xs font-bold text-indigo-900 block mb-1 uppercase tracking-wider">
                    Qisqa Xulosa:
                  </span>
                  <p className="text-xs text-indigo-950 leading-relaxed font-medium">
                    {review.summary}
                  </p>
                </div>
              )}

              {/* Issues & Strengths Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Issues */}
                <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-800 uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Topilgan Kamchiliklar:</span>
                  </div>
                  {review.issues.length === 0 ? (
                    <p className="text-xs text-rose-700 italic">Jiddiy xatolar topilmadi.</p>
                  ) : (
                    <ul className="space-y-1.5 pl-1">
                      {review.issues.map((iss, i) => (
                        <li key={i} className="text-xs text-rose-900 flex items-start gap-2">
                          <span className="text-rose-500 font-bold">•</span>
                          <span>{iss}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Strengths */}
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    <ThumbsUp className="w-4 h-4 text-emerald-600" />
                    <span>To&apos;g&apos;ri qilingan qismlar:</span>
                  </div>
                  {review.strengths.length === 0 ? (
                    <p className="text-xs text-emerald-700 italic">Kod tuzilishi tekshirildi.</p>
                  ) : (
                    <ul className="space-y-1.5 pl-1">
                      {review.strengths.map((str, i) => (
                        <li key={i} className="text-xs text-emerald-900 flex items-start gap-2">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Ready Teacher Feedback */}
              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>O&apos;quvchiga Tayyor Sharh (O&apos;zbek tilida):</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    {applied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Formaga joylandi!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Formaga Qo&apos;yish</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 bg-white/90 rounded-xl border border-amber-200 text-xs text-slate-800 leading-relaxed italic">
                  &ldquo;{review.teacherFeedback}&rdquo;
                </div>
              </div>

              {/* Extracted or Corrected Code (if available) */}
              {(review.correctedCode || review.extractedCode) && (
                <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-indigo-400" />
                      <span>{review.correctedCode ? "To'g'rilangan Kod Namunasi" : "Ajratilgan Kod"}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(review.correctedCode || review.extractedCode || "")}
                        className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? "Nusxalandi" : "Nusxalash"}</span>
                      </button>
                      {onOpenSandbox && (
                        <button
                          type="button"
                          onClick={() => onOpenSandbox(review.correctedCode || review.extractedCode || "")}
                          className="py-1 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Sandboxda ishlatish</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <pre className="p-3 bg-black/40 rounded-xl text-xs font-mono overflow-x-auto max-h-56 leading-relaxed text-emerald-300">
                    <code>{review.correctedCode || review.extractedCode}</code>
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-slate-500">
              Hech qanday tahlil natijasi yo&apos;q.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            OpenRouter AI yordamchi o&apos;qituvchi
          </div>
          <div className="flex items-center gap-2">
            {review && (
              <button
                type="button"
                onClick={handleApply}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Sharh va Bahoni Formaga Qo&apos;yish</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Yopish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
