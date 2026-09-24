"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Compass,
  Move,
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

  // Zoom va Pan holatlari
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; dist?: number } | null>(null);

  const currentImage = images[currentIndex] || images[0];

  // Zoom o'zgartirish
  const handleZoomIn = () => {
    setScale((prev) => Math.min(4, Math.round((prev + 0.25) * 100) / 100));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(0.5, Math.round((prev - 0.25) * 100) / 100);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleSetScale = (targetScale: number) => {
    setScale(targetScale);
    if (targetScale === 1) setPosition({ x: 0, y: 0 });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Rasmni tepaga / pastga / chapga / o'ngga surish (Pan)
  const handlePan = (deltaX: number, deltaY: number) => {
    setPosition((prev) => ({
      x: Math.round(prev.x + deltaX),
      y: Math.round(prev.y + deltaY),
    }));
  };

  // Oldingi / keyingi rasmga o'tish
  const handlePrev = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  // Double click orqali tezkor kattalashtirish yoki qaytarish
  const handleDoubleClick = () => {
    if (scale === 1) {
      setScale(2);
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  // Sichqoncha bilan ushlab surish (Drag & Pan)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Faqat chap tugma (button 0)
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: Math.round(e.clientX - dragStart.x),
      y: Math.round(e.clientY - dragStart.y),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Sensorli qurilmalar (Touch & Pinch)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStartRef.current = { x: t.clientX - position.x, y: t.clientY - position.y };
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      // Pinch to zoom
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current = { x: 0, y: 0, dist };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchStartRef.current && !touchStartRef.current.dist) {
      const t = e.touches[0];
      setPosition({
        x: Math.round(t.clientX - touchStartRef.current.x),
        y: Math.round(t.clientY - touchStartRef.current.y),
      });
    } else if (e.touches.length === 2 && touchStartRef.current?.dist) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartRef.current.dist;
      setScale((prev) => Math.min(4, Math.max(0.5, Math.round(prev * factor * 100) / 100)));
      touchStartRef.current.dist = dist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartRef.current = null;
  };

  // Sichqoncha g'ildiragi bilan vertikal / gorizontal surish va Ctrl bilan zoom qilish
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        // Ctrl bosilganda zoom qilish
        const delta = e.deltaY < 0 ? 0.2 : -0.2;
        setScale((prev) => {
          const next = Math.min(4, Math.max(0.5, Math.round((prev + delta) * 100) / 100));
          if (next === 1) setPosition({ x: 0, y: 0 });
          return next;
        });
      } else {
        // Oddiy g'ildirak aylantirish: RASMNI TUSHURIB VA KO'TARIB KO'RISH!
        const scrollFactor = scale > 1 ? 1.2 : 0.9;
        setPosition((prev) => ({
          x: Math.round(prev.x - (e.deltaX || 0) * scrollFactor),
          y: Math.round(prev.y - e.deltaY * scrollFactor),
        }));
      }
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", onWheel);
    };
  }, [scale]);

  // Klaviatura orqali boshqarish
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        handlePan(0, 100);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handlePan(0, -100);
      } else if (e.key === "ArrowLeft") {
        if (scale > 1 && !e.shiftKey) {
          e.preventDefault();
          handlePan(100, 0);
        } else if (images.length > 1) {
          handlePrev();
        }
      } else if (e.key === "ArrowRight") {
        if (scale > 1 && !e.shiftKey) {
          e.preventDefault();
          handlePan(-100, 0);
        } else if (images.length > 1) {
          handleNext();
        }
      } else if (e.key === "PageUp") {
        e.preventDefault();
        handlePan(0, 250);
      } else if (e.key === "PageDown") {
        e.preventDefault();
        handlePan(0, -250);
      } else if (e.key === "Home") {
        e.preventDefault();
        setPosition({ x: 0, y: 0 });
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
  }, [handlePrev, handleNext, images.length, onClose, scale]);

  // Modal ochilganda sahifa scroll bo'lishini to'xtatish
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const isPanned = position.x !== 0 || position.y !== 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-3 sm:p-5 select-none animate-fade-in"
      onClick={onClose}
    >
      {/* Top Bar: Title, Image Counter, Zoom Controls, Close Button */}
      <div
        className="w-full flex flex-wrap items-center justify-between gap-3 text-white z-20 shrink-0"
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
            <div className="flex items-center gap-2 text-xs text-slate-300">
              {images.length > 1 && (
                <span>
                  {currentIndex + 1}-rasm / Jami {images.length} ta
                </span>
              )}
              {scale !== 1 && (
                <span className="text-amber-300 font-medium hidden sm:inline">
                  • Masshtab: {Math.round(scale * 100)}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Zoom & Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/15">
          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            title="Kichiklashtirish (-)"
            className="p-1.5 rounded-xl hover:bg-white/15 text-slate-200 hover:text-white transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Scale display */}
          <span className="text-xs font-mono font-bold text-blue-300 px-1 min-w-[42px] text-center">
            {Math.round(scale * 100)}%
          </span>

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 4}
            title="Kattalashtirish (+)"
            className="p-1.5 rounded-xl hover:bg-white/15 text-slate-200 hover:text-white transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Quick Zoom Presets */}
          <div className="hidden md:flex items-center gap-1 border-l border-white/15 pl-2 ml-1">
            {[1, 1.5, 2, 3].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleSetScale(preset)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  scale === preset
                    ? "bg-blue-600 text-white"
                    : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
                }`}
              >
                {preset * 100}%
              </button>
            ))}
          </div>

          {/* Reset Zoom & Position */}
          <button
            type="button"
            onClick={handleResetZoom}
            title="Asl holatga qaytarish (0 yoki Markaz)"
            className={`p-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1 ${
              scale !== 1 || isPanned
                ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30"
                : "hover:bg-white/15 text-slate-200 hover:text-white"
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            {(scale !== 1 || isPanned) && (
              <span className="text-[10px] font-bold hidden sm:inline">Qaytarish</span>
            )}
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
        ref={containerRef}
        className="relative flex-1 w-full my-2 flex items-center justify-center overflow-hidden rounded-3xl bg-slate-900/40 border border-white/5"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          cursor: isDragging
            ? "grabbing"
            : scale > 1 || isPanned
            ? "grab"
            : "zoom-in",
        }}
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

        {/* Floating D-Pad Controls: Tushurib & Ko'tarib ko'rish tugmalari */}
        <div
          className="absolute right-4 bottom-4 z-30 flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-black/75 backdrop-blur-xl border border-white/20 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 flex items-center gap-1">
            <Move className="w-3 h-3 text-blue-400" />
            <span className="hidden sm:inline">Surish (Pan)</span>
          </div>

          {/* Tepaga ko'tarish (Pan Up) */}
          <button
            type="button"
            onClick={() => handlePan(0, 120)}
            title="Rasmni tepaga ko'tarish (ArrowUp)"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-blue-600 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90 hover:shadow-lg"
          >
            <ArrowUp className="w-4 h-4" />
          </button>

          {/* Chapga / Markaz / O'ngga */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handlePan(120, 0)}
              title="Chapga surish (ArrowLeft)"
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-blue-600 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90 hover:shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setPosition({ x: 0, y: 0 })}
              title="Markazga qaytarish (Home)"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
                isPanned
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                  : "bg-white/10 hover:bg-white/20 text-slate-300"
              }`}
            >
              <Compass className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handlePan(-120, 0)}
              title="O'ngga surish (ArrowRight)"
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-blue-600 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90 hover:shadow-lg"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Pastga tushirish (Pan Down) */}
          <button
            type="button"
            onClick={() => handlePan(0, -120)}
            title="Rasmni pastga tushirish (ArrowDown)"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-blue-600 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90 hover:shadow-lg"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Helper Tip */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-slate-300">
          <Move className="w-3 h-3 text-blue-400" />
          <span>Sichqoncha bilan ushlab suring yoki g&apos;ildirakni aylantiring (Tepaga/Pastga)</span>
        </div>

        {/* Scalable & Pannable Image Element */}
        <div
          onDoubleClick={handleDoubleClick}
          className="max-w-full max-h-[76vh] flex items-center justify-center"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.12s ease-out",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImage}
            alt={title}
            className="max-w-full max-h-[76vh] object-contain rounded-xl shadow-2xl transition-all pointer-events-none select-none"
            draggable={false}
          />
        </div>
      </div>

      {/* Bottom Thumbnails bar (if multiple images) */}
      {images.length > 1 && (
        <div
          className="w-full flex items-center justify-center gap-2 overflow-x-auto py-1 z-20 shrink-0"
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
                    setPosition({ x: 0, y: 0 });
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
