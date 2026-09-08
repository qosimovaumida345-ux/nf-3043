"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, User, ArrowRight, Eye, EyeOff, AlertCircle, Sparkles } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login yoki parol noto'g'ri.");
        setLoading(false);
        return;
      }

      // Rol bo'yicha mos panelga yo'naltirish
      if (redirectPath) {
        router.push(redirectPath);
      } else if (data.user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/student");
      }
      router.refresh();
    } catch {
      setError("Serverga ulanishda xatolik yuz berdi.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-3 mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Mars IT Logo"
            className="w-12 h-12 rounded-2xl object-contain shadow-md border border-slate-200/60 bg-slate-950/5"
          />
          <span className="font-fustat font-bold text-2xl tracking-tight text-slate-900">
            Mars IT <span className="text-blue-600 text-sm font-normal">Code Review</span>
          </span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Tizimga kirish
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          O&apos;qituvchi tomonidan berilgan login va parolingizni kiriting
        </p>
      </div>

      {/* Liquid Glass Login Card */}
      <div
        className="rounded-[24px] p-8 shadow-2xl relative"
        style={{
          background: "rgba(255, 255, 255, 0.75)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          border: "1px solid rgba(255, 255, 255, 0.8)",
          boxShadow:
            "0 20px 50px -10px rgba(0, 132, 255, 0.1), inset 0 2px 4px 0 rgba(255, 255, 255, 0.9)",
        }}
      >
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50/90 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Login (Foydalanuvchi nomi)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="masalan: admin yoki ali_valiyev"
                className="w-full pl-10 pr-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Parol
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 bg-white/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl text-white font-semibold text-sm shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "rgba(0, 132, 255, 0.9)",
              backdropFilter: "blur(4px)",
              boxShadow: "inset 0 2px 3px rgba(255, 255, 255, 0.35), 0 8px 20px -4px rgba(0, 132, 255, 0.4)",
            }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Kirish</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Notice regarding closed registration */}
        <div className="mt-6 pt-5 border-t border-slate-200/60 text-center">
          <p className="text-xs text-slate-500 leading-relaxed">
            Ommaviy ro&apos;yxatdan o&apos;tish yopiq. Talabalar hisobini faqat o&apos;qituvchi o&apos;z panelidan ochib beradi.
          </p>
        </div>
      </div>

      <div className="text-center mt-6">
        <Link href="/" className="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors">
          ← Asosiy sahifaga qaytish
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-slate-50 overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full bg-[#60B1FF]/30 blur-[130px] -z-10" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-[#319AFF]/25 blur-[120px] -z-10" />

      <Suspense fallback={<div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
