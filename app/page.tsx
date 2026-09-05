import Link from "next/link";
import { ArrowRight, Star, Code2, ShieldCheck, Zap, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-white overflow-hidden text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Subtle, layered gradient glow in the top-left (#60B1FF va #319AFF) */}
      <div className="pointer-events-none absolute -top-[120px] -left-[120px] w-[650px] h-[650px] rounded-full bg-[#60B1FF]/30 blur-[130px] -z-10" />
      <div className="pointer-events-none absolute top-[80px] left-[60px] w-[450px] h-[450px] rounded-full bg-[#319AFF]/25 blur-[110px] -z-10" />
      <div className="pointer-events-none absolute top-[300px] right-[-100px] w-[500px] h-[500px] rounded-full bg-blue-100/40 blur-[140px] -z-10" />

      {/* 2. The "Strong Liquid Glass" Navbar */}
      <header className="sticky top-[30px] z-50 flex justify-center px-4 w-full">
        <nav
          className="liquid-glass-navbar flex items-center justify-between gap-6 md:gap-12 px-6 py-3 rounded-[16px] max-w-fit shadow-sm"
          style={{
            backdropFilter: "blur(50px)",
            WebkitBackdropFilter: "blur(50px)",
            background: "rgba(255, 255, 255, 0.4)",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            boxShadow: "inset 0px 4px 4px 0px rgba(255, 255, 255, 0.25), 0 10px 25px -5px rgba(0,0,0,0.04)",
          }}
        >
          {/* Logo Mars IT */}
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Mars IT Logo"
              className="w-10 h-10 rounded-xl object-contain shadow-sm border border-slate-200/60 bg-slate-950/5"
            />
            <span className="font-fustat font-bold text-xl tracking-tight text-slate-900">
              Mars IT <span className="text-blue-600 text-sm font-normal">NF-3043</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link href="#features" className="hover:text-blue-600 transition-colors">
              Xususiyatlar
            </Link>
            <Link href="#architecture" className="hover:text-blue-600 transition-colors">
              Arxitektura
            </Link>
            <Link href="#workflow" className="hover:text-blue-600 transition-colors">
              Jarayon
            </Link>
            <Link href="/login" className="hover:text-blue-600 transition-colors">
              Talabalar
            </Link>
          </div>

          {/* Glassy SignUp / Login Button */}
          <Link
            href="/login"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-900 bg-white/60 hover:bg-white/90 border border-black/10 rounded-[12px] shadow-sm transition-all hover:scale-105 active:scale-95"
            style={{
              boxShadow: "inset 0px 2px 3px 0px rgba(255,255,255,0.4)",
            }}
          >
            <span>Tizimga kirish</span>
            <ArrowRight className="w-4 h-4 text-blue-600" />
          </Link>
        </nav>
      </header>

      {/* 3. Hero Section (1600px Max-Width, Dual-Column Desktop) */}
      <section className="relative z-10 max-w-[1600px] mx-auto px-6 md:px-12 pt-12 md:pt-16 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-[620px]">
          
          {/* HERO CONTENT (HERO LEFT) - 7 Columns on Desktop */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6 pt-4">
            
            {/* Social Proof Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-50/80 border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#FF801E] text-[#FF801E]" />
                ))}
              </div>
              <span className="text-xs font-semibold text-slate-700 tracking-tight">
                Rated 4.9/5 by 2700+ customers
              </span>
              <span className="text-[11px] font-medium text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-full">
                Mars IT Code Review
              </span>
            </div>

            {/* Hero Headline: 75px, 1.05 line-height, -2px tracking */}
            <h1
              className="font-fustat font-bold text-slate-950 text-balance"
              style={{
                fontSize: "clamp(44px, 6vw, 75px)",
                lineHeight: "1.05",
                letterSpacing: "-2px",
              }}
            >
              Work smarter, achieve faster
            </h1>

            {/* Subheadline: 18px, Inter, -1px tracking */}
            <p
              className="font-inter text-slate-600 text-balance max-w-[620px]"
              style={{
                fontSize: "18px",
                lineHeight: "1.6",
                letterSpacing: "-0.5px",
              }}
            >
              Effortlessly manage your projects, collaborate with your team, and achieve your goals with our intuitive task management tool. Telegram orqali bittalab tekshirish o&apos;rniga barcha talabalar kodini bitta xavfsiz boshqaruv panelida tekshiring.
            </p>

            {/* Primary CTA Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2 w-full sm:w-auto">
              <Link
                href="/login"
                className="liquid-glass-button inline-flex items-center justify-center gap-3 px-8 py-4 rounded-[16px] text-white font-medium shadow-lg hover:shadow-blue-500/25"
                style={{
                  background: "rgba(0, 132, 255, 0.85)",
                  backdropFilter: "blur(2px)",
                  WebkitBackdropFilter: "blur(2px)",
                  boxShadow: "inset 0px 4px 4px 0px rgba(255, 255, 255, 0.35), 0 10px 30px -5px rgba(0, 132, 255, 0.4)",
                  transition: "transform 0.2s ease, background-color 0.2s ease",
                }}
              >
                <span className="font-semibold text-base tracking-tight">Get Started Now</span>
                <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-white" />
                </span>
              </Link>

              <div className="flex items-center gap-3 px-4 py-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Admin tomonidan kafolatlangan ma&apos;lumotlar izolyatsiyasi</span>
              </div>
            </div>

            {/* Feature Highlights pill cards */}
            <div className="grid grid-cols-3 gap-3 pt-6 w-full max-w-[620px]">
              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 shadow-xs">
                <Code2 className="w-5 h-5 text-blue-600 mb-1.5" />
                <div className="text-xs font-semibold text-slate-800">Kundalik kod surati</div>
                <div className="text-[11px] text-slate-500">Avtomatik vaqt tamg&apos;asi</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 shadow-xs">
                <Zap className="w-5 h-5 text-amber-500 mb-1.5" />
                <div className="text-xs font-semibold text-slate-800">Real-vaqtda SSE</div>
                <div className="text-[11px] text-slate-500">Refreshsiz bildirishnoma</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 shadow-xs">
                <Sparkles className="w-5 h-5 text-indigo-600 mb-1.5" />
                <div className="text-xs font-semibold text-slate-800">O&apos;qituvchi tahlili</div>
                <div className="text-[11px] text-slate-500">To&apos;g&apos;ri / Xato / Qayta topshirish</div>
              </div>
            </div>

          </div>

          {/* THE GLASSY ORB (HERO RIGHT) - 5 Columns on Desktop */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full max-w-[580px] aspect-square flex items-center justify-center">
              
              {/* Glassy Orb Video with exact CSS filter & screen blending mode */}
              <div className="relative w-full h-full flex items-center justify-center overflow-visible">
                <video
                  src="https://future.co/images/homepage/glassy-orb/orb-purple.webm"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="electric-blue-orb scale-125 w-full h-full object-contain pointer-events-none drop-shadow-2xl"
                  style={{
                    mixBlendMode: "screen",
                    filter: "hue-rotate(-55deg) saturate(250%) brightness(1.2) contrast(1.1)",
                  }}
                />
              </div>

              {/* Floating Glass Badges over the orb */}
              <div
                className="absolute -bottom-4 -left-4 md:left-4 p-4 rounded-2xl glass-panel shadow-xl flex items-center gap-3 border border-white/80 animate-fade-in"
                style={{
                  background: "rgba(255, 255, 255, 0.75)",
                  backdropFilter: "blur(24px)",
                }}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 font-bold">
                  ✓
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Yangi yuklama tushdi</div>
                  <div className="text-[11px] text-slate-500">Real-vaqtda SSE oqimi</div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 4. Footer Logos: "Trusted by Top-tier product companies" */}
      <footer className="relative z-10 border-t border-slate-100 bg-white/40 py-12 px-6">
        <div className="max-w-[1600px] mx-auto text-center space-y-6">
          <p className="text-xs uppercase tracking-widest font-semibold text-slate-400">
            Trusted by Top-tier product companies
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-[100px] opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
            {/* 5 High-Quality Clean Grayscale Brand/Company Logos */}
            <div className="flex items-center gap-2 font-bold text-lg text-slate-700">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span>VORTEX</span>
            </div>

            <div className="flex items-center gap-2 font-bold text-lg text-slate-700">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" stroke="white" strokeWidth="2" />
              </svg>
              <span>CHRONO</span>
            </div>

            <div className="flex items-center gap-2 font-bold text-lg text-slate-700">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 4h16v16H4z" />
              </svg>
              <span>NEXUS</span>
            </div>

            <div className="flex items-center gap-2 font-bold text-lg text-slate-700">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span>STELLAR</span>
            </div>

            <div className="flex items-center gap-2 font-bold text-lg text-slate-700">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm1 15h-2v-6h2zm0-8h-2V7h2z" />
              </svg>
              <span>APEX LABS</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
