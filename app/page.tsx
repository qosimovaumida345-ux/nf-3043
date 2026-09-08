"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, X, LogIn, Sparkles, BookOpen, Layers, MessageSquareQuote } from "lucide-react";

const fadeDown = {
  initial: { opacity: 0, y: -20 },
  animate: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom * 0.1,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const fadeUp = {
  initial: { opacity: 0, y: 32 },
  animate: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom * 0.12,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const wordSlideUp = {
  initial: { y: "110%" },
  animate: (i: number) => ({
    y: 0,
    transition: {
      delay: 0.4 + i * 0.14,
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const stats = [
  { value: "300", plus: "+", label: "CRAFTED\nBRANDS", custom: 2 },
  { value: "200", plus: "+", label: "DIGITAL\nPRODUCTS", custom: 3 },
  { value: "100", plus: "+", label: "VENTURES\nFUNDED", custom: 4 },
];

const headingWords = ["Fearless", "Vision", "Delivered"];

const navItems = [
  {
    name: "Story",
    id: "story",
    icon: BookOpen,
    desc: "Mars IT akademiyasining zamonaviy ta'lim falsafasi va dasturlash o'rganuvchilari uchun kundalik kod tahlili standartlari.",
  },
  {
    name: "Expertise",
    id: "expertise",
    icon: Sparkles,
    desc: "Frontend, Backend va Full-stack yo'nalishlarida real loyihalar, o'qituvchi bilan jonli SSE oqimi orqali kod tekshiruvi.",
  },
  {
    name: "Studios",
    id: "studios",
    icon: Layers,
    desc: "O'quv guruhlari, topshiriqlar va kundalik vazifalar laboratoriyasi. Har bir talabaning shaxsiy ko'nikma o'sishi.",
  },
  {
    name: "Feedback",
    id: "feedback",
    icon: MessageSquareSquareIcon,
    desc: "Ustoz tomonidan har bir yuborilgan topshiriqqa batafsil yozma tahlil, xatolar tushuntirilishi va natija berilishi.",
  },
];

function MessageSquareSquareIcon(props: React.SVGProps<SVGSVGElement>) {
  return <MessageSquareQuote {...props} />;
}

export default function HeroPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModalItem, setActiveModalItem] = useState<{
    name: string;
    desc: string;
  } | null>(null);

  return (
    <div
      className="relative flex flex-col min-h-screen overflow-hidden text-black font-semibold uppercase tracking-widest select-none"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* 1. Full-screen Autoplaying Looping Muted Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none -z-10"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260517_222138_3e3205be-3364-417b-a64a-bfe087acbec4.mp4"
      />

      {/* Subtle overlay to guarantee crisp text legibility if needed */}
      <div className="absolute inset-0 bg-white/5 pointer-events-none -z-10" />

      {/* 2. Top Navigation Bar */}
      <header className="w-full flex items-center justify-between px-5 sm:px-8 md:px-12 pt-5 md:pt-6 z-40">
        {/* Left: Circular Logo (32px div, 2px border in #5E0ED7, 10px solid circle inside in #5E0ED7) */}
        <motion.div
          custom={0}
          initial="initial"
          animate="animate"
          variants={fadeDown}
          className="flex items-center gap-3"
        >
          <Link
            href="/"
            aria-label="Home"
            className="w-[32px] h-[32px] rounded-full border-[2px] border-[#5E0ED7] flex items-center justify-center hover:scale-105 transition-transform"
          >
            <div className="w-[10px] h-[10px] rounded-full bg-[#5E0ED7]" />
          </Link>
        </motion.div>

        {/* Center: 4 Nav Links (hidden on mobile, visible md+) */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item, idx) => (
            <motion.button
              key={item.name}
              custom={idx + 1}
              initial="initial"
              animate="animate"
              variants={fadeDown}
              onClick={() => setActiveModalItem({ name: item.name, desc: item.desc })}
              className="text-[14px] font-semibold tracking-widest uppercase text-black hover:text-[#5E0ED7] transition-colors cursor-pointer"
            >
              {item.name}
            </motion.button>
          ))}
        </nav>

        {/* Right: Hamburger button (36px round black button with 3 white lines) + Login CTA */}
        <motion.div
          custom={5}
          initial="initial"
          animate="animate"
          variants={fadeDown}
          className="flex items-center gap-3"
        >
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/20 bg-white/70 hover:bg-black hover:text-white text-[11px] font-semibold tracking-wider transition-all"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>KIRISH</span>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="w-[36px] h-[36px] rounded-full bg-black flex flex-col items-center justify-center gap-1 hover:scale-105 transition-transform shadow-md cursor-pointer"
          >
            <span className="w-4 h-0.5 bg-white block" />
            <span className="w-4 h-0.5 bg-white block" />
            <span className="w-4 h-0.5 bg-white block" />
          </button>
        </motion.div>
      </header>

      {/* 3. Middle Section: Stats Row (flex-1, vertically centered, right-aligned) */}
      <main className="flex-1 flex items-center justify-end px-5 sm:px-8 md:px-12 py-8 md:py-0 z-20">
        <div className="flex items-start justify-end gap-5 sm:gap-8 md:gap-10">
          {stats.map((st) => (
            <motion.div
              key={st.label}
              custom={st.custom}
              initial="initial"
              animate="animate"
              variants={fadeUp}
              className="flex flex-col items-end text-right"
            >
              <div
                className="font-semibold text-black leading-none"
                style={{ fontSize: "clamp(1.5rem, 5vw, 3.5rem)" }}
              >
                <span className="text-[#5E0ED7] text-[0.5em] align-top mr-0.5 font-bold">
                  {st.plus}
                </span>
                {st.value}
              </div>
              <div className="text-[10px] sm:text-xs md:text-sm font-semibold tracking-widest uppercase text-black whitespace-pre-line leading-tight mt-1 text-right">
                {st.label}
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* 4. Bottom Section (pinned to bottom with padding) */}
      <footer className="w-full px-5 sm:px-8 md:px-12 pb-8 md:pb-12 flex flex-col gap-6 md:gap-12 z-20">
        {/* Row A (tagline + CTA) */}
        <div className="flex items-center justify-between gap-4">
          {/* Left: Tagline paragraph */}
          <motion.p
            custom={5}
            initial="initial"
            animate="animate"
            variants={fadeUp}
            className="text-[10px] sm:text-xs md:text-sm font-semibold tracking-widest uppercase text-black max-w-[130px] sm:max-w-[160px] md:max-w-xs leading-snug"
          >
            Shaping Bold
            <br />
            Visions Into Power
            <br />
            For Your Tribe
          </motion.p>

          {/* Right: CTA Link "Work With Us" */}
          <motion.div custom={6} initial="initial" animate="animate" variants={fadeUp}>
            <Link
              href="/login"
              className="text-base sm:text-xl md:text-2xl text-[#5E0ED7] font-semibold whitespace-nowrap flex items-center gap-1 hover:opacity-85 transition-opacity"
            >
              <span>Work With Us</span>
              <ArrowUpRight className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" />
            </Link>
          </motion.div>
        </div>

        {/* Row B (description + main heading) */}
        <div className="flex items-end justify-between gap-3 sm:gap-4">
          {/* Left: Fixed-width description block */}
          <motion.div
            custom={7}
            initial="initial"
            animate="animate"
            variants={fadeUp}
            className="w-[120px] sm:w-[180px] md:w-[280px] shrink-0"
          >
            <p className="text-[9px] sm:text-xs md:text-sm font-semibold tracking-widest uppercase text-left md:text-right text-black leading-relaxed">
              Creative Studios Built Around Elevating Your Vision Into Striking Reality
            </p>
          </motion.div>

          {/* Right: Main heading with stacked words slide-up effect */}
          <div className="flex flex-col items-end text-right">
            {headingWords.map((word, i) => (
              <div key={word} className="overflow-hidden leading-none">
                <motion.h1
                  custom={i}
                  initial="initial"
                  animate="animate"
                  variants={wordSlideUp}
                  className="font-semibold uppercase text-black text-right block"
                  style={{
                    fontSize: "clamp(2rem, 9vw, 9rem)",
                    lineHeight: 0.88,
                  }}
                >
                  {word}
                </motion.h1>
              </div>
            ))}
          </div>
        </div>
      </footer>

      {/* 5. Mobile Menu Overlay (Fixed, Full-screen, Z-50, White Background) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-50 bg-white flex flex-col px-5 sm:px-8 pt-5 sm:pt-6 pb-8 sm:pb-12 text-black"
          >
            {/* Top row: Logo (left) and Close button (right) */}
            <div className="flex items-center justify-between w-full">
              <div className="w-[32px] h-[32px] rounded-full border-[2px] border-[#5E0ED7] flex items-center justify-center">
                <div className="w-[10px] h-[10px] rounded-full bg-[#5E0ED7]" />
              </div>

              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="w-[36px] h-[36px] rounded-full bg-black flex items-center justify-center text-white hover:scale-105 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Middle: Vertical list of 4 nav links + Login */}
            <div className="flex flex-col gap-8 mt-16 text-left">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setActiveModalItem({ name: item.name, desc: item.desc });
                  }}
                  className="text-3xl font-semibold tracking-widest uppercase text-black hover:text-[#5E0ED7] transition-colors text-left"
                >
                  {item.name}
                </button>
              ))}

              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-3xl font-semibold tracking-widest uppercase text-blue-600 hover:text-blue-800 transition-colors text-left flex items-center gap-2"
              >
                <span>Kirish (Login)</span>
                <ArrowUpRight className="w-7 h-7" />
              </Link>
            </div>

            {/* Bottom: Work With Us CTA */}
            <div className="mt-auto pt-8">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xl text-[#5E0ED7] font-semibold tracking-widest uppercase flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <span>Work With Us</span>
                <ArrowUpRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Information Modal for Nav Items */}
      <AnimatePresence>
        {activeModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-white rounded-3xl p-7 sm:p-8 shadow-2xl border border-slate-200 text-black space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-[28px] h-[28px] rounded-full border-[2px] border-[#5E0ED7] flex items-center justify-center">
                    <div className="w-[8px] h-[8px] rounded-full bg-[#5E0ED7]" />
                  </div>
                  <h3 className="text-xl font-bold tracking-widest uppercase text-black">
                    {activeModalItem.name}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModalItem(null)}
                  className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <p className="text-sm font-medium tracking-normal normal-case leading-relaxed text-slate-700">
                {activeModalItem.desc}
              </p>

              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
                <button
                  onClick={() => setActiveModalItem(null)}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-black"
                >
                  Yopish
                </button>
                <Link
                  href="/login"
                  onClick={() => setActiveModalItem(null)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5E0ED7] hover:bg-[#4d0bb5] text-white text-xs font-semibold uppercase tracking-widest transition-colors shadow-md"
                >
                  <span>Tizimga o&apos;tish</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
