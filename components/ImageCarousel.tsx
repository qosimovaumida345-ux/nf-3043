"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Image as ImageIcon } from "lucide-react";

interface ImageCarouselProps {
  images: string[];
  title?: string;
  onZoom?: (initialIndex: number) => void;
  className?: string;
  maxHeightClass?: string;
}

export default function ImageCarousel({
  images,
  title = "Suratlar",
  onZoom,
  className = "",
  maxHeightClass = "h-64 sm:h-72",
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className={`w-full ${maxHeightClass} rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2 ${className}`}>
        <ImageIcon className="w-8 h-8 opacity-40" />
        <span className="text-xs font-medium">Fotosurat mavjud emas</span>
      </div>
    );
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Faqat 1 ta rasm bo'lsa:
  if (images.length === 1) {
    return (
      <div
        onClick={() => onZoom?.(0)}
        className={`relative w-full ${maxHeightClass} rounded-2xl overflow-hidden bg-slate-950/5 border border-slate-200 cursor-pointer group flex items-center justify-center p-1.5 shadow-xs hover:border-blue-300 transition-all ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[0]}
          alt={title}
          className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-200"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5 rounded-2xl pointer-events-none">
          <Maximize2 className="w-4 h-4" />
          <span>Kattalashtirib ko&apos;rish (Zoom)</span>
        </div>
      </div>
    );
  }

  // 2 yoki undan ortiq rasm bo'lsa:
  const activeImage = images[currentIndex] || images[0];

  return (
    <div className={`space-y-2 select-none ${className}`}>
      {/* Asosiy ko'rinish va boshqaruv tugmalari */}
      <div
        onClick={() => onZoom?.(currentIndex)}
        className={`relative w-full ${maxHeightClass} rounded-2xl overflow-hidden bg-slate-950/5 border border-slate-200 cursor-pointer group flex items-center justify-center p-2 shadow-xs hover:border-blue-400 transition-all`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={activeImage}
          src={activeImage}
          alt={`${title} (${currentIndex + 1}/${images.length})`}
          className="w-full h-full object-contain transition-all duration-200 group-hover:scale-[1.01]"
          loading="lazy"
        />

        {/* Tepada rasm indikatori (Rasm 1 / 4) */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-bold shadow-md border border-white/20">
          <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
          <span>
            {currentIndex + 1} / {images.length}
          </span>
        </div>

        {/* Zoom belgisi (Hover paytida) */}
        <div className="absolute bottom-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-[11px] font-medium border border-white/15">
          <Maximize2 className="w-3 h-3 text-blue-400" />
          <span>Zoom</span>
        </div>

        {/* Oldingi rasm tugmasi */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Oldingi rasm"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center shadow-lg border border-white/20 hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Keyingi rasm tugmasi */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Keyingi rasm"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center shadow-lg border border-white/20 hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-sm"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Pastdagi Thumbnail (mini-rasmlar) satri */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 scrollbar-thin">
        {images.map((imgUrl, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`relative shrink-0 w-12 h-10 rounded-lg overflow-hidden border-2 transition-all cursor-pointer p-0.5 bg-slate-900/5 ${
                isActive
                  ? "border-blue-600 ring-2 ring-blue-400/30 scale-105"
                  : "border-slate-200 opacity-65 hover:opacity-100 hover:border-slate-400"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgUrl}
                alt={`Miniature ${idx + 1}`}
                className="w-full h-full object-contain"
                loading="lazy"
              />
              <span className="absolute bottom-0 right-0 text-[8px] font-bold px-1 bg-black/70 text-white rounded-tl">
                {idx + 1}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
