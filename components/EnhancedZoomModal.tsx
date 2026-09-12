"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";

interface EnhancedZoomModalProps {
  images: string[];
  initialIndex?: number;
  title?: string;
  onClose: () => void;
}

export default function EnhancedZoomModal({
  images,
  initialIndex = 0,
  title = "Kod fotosurati",
  onClose,
}: EnhancedZoomModalProps) {
  const [currentIndex, setCurrentIndex] = useState(
    Math.min(Math.max(0, initialIndex), Math.max(0, images.length - 1))
  );
  const [scale, setScale] = useState(1);

  const currentImage = images[currentIndex] || images[0];

  const handleZoomIn = () => {
    setScale((prev) => Math.min(3, Math.round((prev + 0.25) * 100) / 100));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.75, Math.round((prev - 0.25) * 100) / 100));
  };

  const handleResetZoom = () => {
    setScale(1);
  };

  const handlePrev = useCallback(() => {
    setScale(1);
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setScale(1);
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  // Klaviatura tugmalari orqali boshqarish (ArrowLeft, ArrowRight, Escape, +/-)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        if (images.length > 1) handlePrev();
      } else if (e.key === "ArrowRight") {
        if (images.length > 1) handleNext();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      } else if (e.key === "0") {
        handleResetZoom();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext, images.length, onClose]);

  // Modal ochilganda sahifa scroll bo'lishini to'xtatish
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-3 sm:p-6 select-none animate-fade-in"
      onClick={onClose}
    >
      {/* Top Bar: Title, Image Counter, Zoom Controls, Close Button */}
      <div
        className="w-full flex items-center justify-between gap-3 text-white z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-blue-400 border border-white/15">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-fustat font-bold text-sm sm:text-base text-white truncate max-w-[200px] sm:max-w-md">
              {title}
            </h3>
            {images.length > 1 && (
              <span className="text-xs text-slate-300 font-medium">
                {currentIndex + 1}-rasm / Jami {images.length} ta
              </span>
            )}
          </div>
        </div>

        {/* Zoom & Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-white/15">
          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 0.75}
            title="Kichiklashtirish (-)"
            className="p-1.5 rounded-xl hover:bg-white/15 text-slate-200 hover:text-white transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Scale display */}
          <span className="text-xs font-mono font-bold text-blue-300 px-1 min-w-[40px] text-center">
            {Math.round(scale * 100)}%
          </span>

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 3}
            title="Kattalashtirish (+)"
            className="p-1.5 rounded-xl hover:bg-white/15 text-slate-200 hover:text-white transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Reset Zoom */}
          <button
            type="button"
            onClick={handleResetZoom}
            title="Asl hajmga qaytarish (0)"
            className="p-1.5 rounded-xl hover:bg-white/15 text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Open full image in new tab */}
          <a
            href={currentImage}
            target="_blank"
            rel="noopener noreferrer"
            title="Asl tiniq sifatda yangi oynada ochish"
            className="p-1.5 rounded-xl hover:bg-white/15 text-slate-200 hover:text-white transition-colors cursor-pointer ml-1 hidden sm:flex"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          <div className="w-[1px] h-4 bg-white/20 mx-0.5" />

          {/* Close Modal */}
          <button
            type="button"
            onClick={onClose}
            title="Yopish (Esc)"
            className="p-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition-all cursor-pointer hover:scale-105"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Main Zoom Viewport */}
      <div
        className="relative flex-1 w-full my-2 flex items-center justify-center overflow-auto rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation Arrows for Multiple Images */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Oldingi rasm"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center shadow-2xl border border-white/25 hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Keyingi rasm"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center shadow-2xl border border-white/25 hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Image Container with Scalable Zoom */}
        <div
          className="max-w-full max-h-[78vh] flex items-center justify-center transition-transform duration-150 ease-out cursor-grab active:cursor-grabbing"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImage}
            alt={title}
            className="max-w-full max-h-[78vh] object-contain rounded-xl shadow-2xl transition-all"
            draggable={false}
          />
        </div>
      </div>

      {/* Bottom Thumbnails bar (if multiple images) */}
      {images.length > 1 && (
        <div
          className="w-full flex items-center justify-center gap-2 overflow-x-auto py-2 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-2xl border border-white/15">
            {images.map((imgUrl, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setScale(1);
                    setCurrentIndex(idx);
                  }}
                  className={`relative shrink-0 w-12 h-10 rounded-lg overflow-hidden border-2 transition-all cursor-pointer p-0.5 bg-slate-900 ${
                    isActive
                      ? "border-blue-500 ring-2 ring-blue-400/40 scale-110"
                      : "border-white/20 opacity-50 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl}
                    alt={`Thumb ${idx + 1}`}
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute bottom-0 right-0 text-[8px] font-bold px-1 bg-black/80 text-white rounded-tl">
                    {idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
