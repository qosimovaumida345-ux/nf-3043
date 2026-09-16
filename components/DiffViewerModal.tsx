"use client";

import React, { useState } from "react";
import { X, GitCompare, ChevronLeft, ChevronRight, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

interface AttemptData {
  id: string;
  submittedAt: string;
  status: string;
  imageUrls: string[];
  comment?: {
    feedbackText: string;
    verdict: string;
  };
}

interface DiffViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  taskTitle: string;
  currentAttempt: AttemptData;
  previousAttempts: AttemptData[];
}

export default function DiffViewerModal({
  isOpen,
  onClose,
  studentName,
  taskTitle,
  currentAttempt,
  previousAttempts,
}: DiffViewerModalProps) {
  const [selectedPrevIndex, setSelectedPrevIndex] = useState(0);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [prevImgIndex, setPrevImgIndex] = useState(0);

  if (!isOpen) return null;

  const prevAttempt = previousAttempts[selectedPrevIndex] || previousAttempts[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-hidden">
      <div className="bg-white rounded-3xl max-w-6xl w-full h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
                <span>Versiyalar Farqini Solishtirish (Diff Viewer)</span>
              </h3>
              <p className="text-xs text-slate-400">
                {studentName} — {taskTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {previousAttempts.length > 1 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-medium">Eski urinish:</span>
                <select
                  value={selectedPrevIndex}
                  onChange={(e) => {
                    setSelectedPrevIndex(Number(e.target.value));
                    setPrevImgIndex(0);
                  }}
                  className="bg-slate-800 text-white text-xs py-1.5 px-3 rounded-xl border border-slate-700 outline-none"
                >
                  {previousAttempts.map((att, i) => (
                    <option key={att.id} value={i}>
                      {previousAttempts.length - i}-urinish (
                      {new Date(att.submittedAt).toLocaleDateString("uz-UZ")})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Side-by-side comparison body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Left: Previous Attempt */}
          <div className="flex flex-col h-full bg-slate-50 p-4 space-y-3 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <span className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                  Avvalgi Urinish
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {prevAttempt ? new Date(prevAttempt.submittedAt).toLocaleString("uz-UZ") : ""}
                </span>
              </div>
              {prevAttempt?.comment?.feedbackText && (
                <div className="max-w-[200px] text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200 truncate">
                  Sharh: {prevAttempt.comment.feedbackText}
                </div>
              )}
            </div>

            {prevAttempt && prevAttempt.imageUrls.length > 0 ? (
              <div className="flex-1 flex flex-col justify-between">
                <div className="relative flex-1 bg-slate-900/5 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center min-h-[300px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={prevAttempt.imageUrls[prevImgIndex] || prevAttempt.imageUrls[0]}
                    alt="Avvalgi urinish rasmi"
                    className="max-h-full max-w-full object-contain p-2"
                  />
                </div>

                {prevAttempt.imageUrls.length > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      disabled={prevImgIndex === 0}
                      onClick={() => setPrevImgIndex((i) => Math.max(0, i - 1))}
                      className="p-1 rounded-lg bg-white border border-slate-200 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono font-bold text-slate-600">
                      {prevImgIndex + 1} / {prevAttempt.imageUrls.length}
                    </span>
                    <button
                      type="button"
                      disabled={prevImgIndex === prevAttempt.imageUrls.length - 1}
                      onClick={() =>
                        setPrevImgIndex((i) => Math.min(prevAttempt.imageUrls.length - 1, i + 1))
                      }
                      className="p-1 rounded-lg bg-white border border-slate-200 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                Rasm mavjud emas
              </div>
            )}
          </div>

          {/* Right: Current (New) Attempt */}
          <div className="flex flex-col h-full bg-white p-4 space-y-3 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <span className="text-xs font-black text-emerald-700 uppercase tracking-wider block flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Yangi Topshirilgan Urinish</span>
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {new Date(currentAttempt.submittedAt).toLocaleString("uz-UZ")}
                </span>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                So&apos;nggi versiya
              </span>
            </div>

            {currentAttempt.imageUrls.length > 0 ? (
              <div className="flex-1 flex flex-col justify-between">
                <div className="relative flex-1 bg-slate-900/5 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center min-h-[300px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentAttempt.imageUrls[currentImgIndex] || currentAttempt.imageUrls[0]}
                    alt="Yangi urinish rasmi"
                    className="max-h-full max-w-full object-contain p-2"
                  />
                </div>

                {currentAttempt.imageUrls.length > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      disabled={currentImgIndex === 0}
                      onClick={() => setCurrentImgIndex((i) => Math.max(0, i - 1))}
                      className="p-1 rounded-lg bg-white border border-slate-200 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono font-bold text-slate-600">
                      {currentImgIndex + 1} / {currentAttempt.imageUrls.length}
                    </span>
                    <button
                      type="button"
                      disabled={currentImgIndex === currentAttempt.imageUrls.length - 1}
                      onClick={() =>
                        setCurrentImgIndex((i) => Math.min(currentAttempt.imageUrls.length - 1, i + 1))
                      }
                      className="p-1 rounded-lg bg-white border border-slate-200 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                Rasm mavjud emas
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
