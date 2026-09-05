"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  BookOpen,
  PlusCircle,
  ArrowLeft,
  UploadCloud,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  X,
  Users,
  Calendar,
  Layers,
} from "lucide-react";

interface Group {
  id: string;
  name: string;
}

interface Homework {
  id: string;
  title: string;
  description: string;
  sampleImageUrl?: string | null;
  groupId?: string | null;
  groupName?: string | null;
  createdAt: string;
  totalSubmissions: number;
  pendingSubmissions: number;
  correctSubmissions: number;
}

export default function AdminHomeworksPage() {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Zoom Modal
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchHomeworksAndGroups();
  }, []);

  const fetchHomeworksAndGroups = async () => {
    try {
      setLoading(true);
      const [hwRes, grpRes] = await Promise.all([
        fetch("/api/homeworks"),
        fetch("/api/admin/groups"),
      ]);

      if (hwRes.ok) {
        const hwData = await hwRes.json();
        setHomeworks(hwData.homeworks || []);
      }
      if (grpRes.ok) {
        const grpData = await grpRes.json();
        setGroups(grpData.groups || []);
      }
    } catch (err) {
      console.error("Ma'lumotlarni yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSampleFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      let sampleImageUrl: string | null = null;

      // 1. Agar namuna rasm tanlangan bo'lsa, yuklaymiz
      if (sampleFile) {
        const formData = new FormData();
        formData.append("file", sampleFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Namuna rasmni yuklashda xatolik.");
        }
        sampleImageUrl = uploadData.url;
      }

      // 2. Uy ishini saqlash
      const res = await fetch("/api/homeworks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          sampleImageUrl,
          groupId: selectedGroup || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Uy ishini yaratishda xatolik.");
      }

      setSuccess("✅ Yangi uy ishi muvaffaqiyatli yaratildi va talabalar uchun e'lon qilindi!");
      setTitle("");
      setDescription("");
      setSelectedGroup("");
      setSampleFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      await fetchHomeworksAndGroups();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xatolik yuz berdi.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHomework = async (id: string) => {
    if (!confirm("Haqiqatan ham ushbu uy ishini o'chirmoqchimisiz? Unga tegishli topshiriqlar ham o'chiriladi.")) {
      return;
    }

    try {
      const res = await fetch(`/api/homeworks/${id}`, { method: "DELETE" });
      if (res.ok) {
        setHomeworks((prev) => prev.filter((h) => h.id !== id));
      } else {
        alert("Uy ishini o'chirib bo'lmadi.");
      }
    } catch {
      alert("Serverga ulanishda xatolik.");
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Glow backgrounds */}
      <div className="absolute top-[-80px] left-[-80px] w-[500px] h-[500px] rounded-full bg-[#60B1FF]/20 blur-[130px] -z-10" />
      <div className="absolute top-[200px] right-[-100px] w-[450px] h-[450px] rounded-full bg-[#319AFF]/15 blur-[120px] -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/75 backdrop-blur-xl border-b border-slate-200/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Mars IT Logo"
              className="w-10 h-10 rounded-xl object-contain shadow-sm border border-slate-200/60 bg-slate-950/5"
            />
            <div>
              <h1 className="font-fustat font-bold text-lg leading-tight text-slate-900">
                Uy Ishlari Boshqaruvi
              </h1>
              <p className="text-xs text-slate-500 font-medium">Ustoz Topshiriqlari</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/students"
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-xs"
            >
              Guruhlar va Talabalar
            </Link>
            <Link
              href="/admin"
              className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-semibold transition-colors"
            >
              ← Tekshirishga Qaytish
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CREATE HOMEWORK FORM (5 Columns) */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl p-6 bg-white/80 backdrop-blur-2xl border border-white/80 shadow-xl space-y-5 sticky top-24">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">Yangi Uy Ishi Yaratish</h3>
              </div>

              <p className="text-xs text-slate-500">
                Talabalar faqat siz yaratgan ushbu uy ishlari bo&apos;yicha topshiriq yuborishadi.
              </p>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs leading-relaxed flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleCreateHomework} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mavzu / Masala Sarlavhasi
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="masalan: 12-dars: For sikli va massivlarni saralash"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                {/* Target Group */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Qaysi guruh uchun?
                  </label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">Barcha guruhlar (Umumiy topshiriq)</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Uy Ishi Sharti va Tavsifi
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Talabalar nima qilishi kerakligini, asosiy shartlar va topshiriq qoidalarini yozing..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                {/* Sample Image upload */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Namuna / Shart Rasmi (Ustoz kodi yoki topshiriq surati)
                  </label>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                      previewUrl ? "border-blue-400 bg-blue-50/20" : "border-slate-300 hover:border-blue-500"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.heic,.heif,.webp,.png,.jpg,.jpeg,.gif,.bmp,.svg,.avif"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {previewUrl ? (
                      <div className="space-y-2">
                        <div className="relative w-full h-40 rounded-xl overflow-hidden bg-slate-900/5 border border-slate-200 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={previewUrl}
                            alt="Sample preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs text-blue-600 font-medium">
                          Namuna rasmni o&apos;zgartirish uchun bosing
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-1.5 py-3">
                        <UploadCloud className="w-8 h-8 text-blue-600 mb-1" />
                        <span className="text-xs font-semibold text-slate-700">
                          Namuna rasm yuklash (ixtiyoriy)
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Skrinshot, daftar yoki kod namunasi fotosi
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4" />
                      <span>Uy ishini e&apos;lon qilish</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* HOMEWORKS LIST (7 Columns) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="font-fustat font-bold text-lg text-slate-900">
                  E&apos;lon qilingan Uy Ishlari ({homeworks.length})
                </h3>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 bg-white/50 rounded-3xl border border-slate-200">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : homeworks.length === 0 ? (
              <div className="text-center py-16 px-6 bg-white/60 rounded-3xl border border-dashed border-slate-300 space-y-2">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-700">Hali uy ishlari yaratilmagan</h4>
                <p className="text-xs text-slate-400">
                  Chap tarafdagi shakl orqali birinchi uy ishini e&apos;lon qiling.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {homeworks.map((hw) => (
                  <div
                    key={hw.id}
                    className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-slate-200/90 shadow-sm space-y-4"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">{hw.title}</h4>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {hw.groupName ? `Guruh: ${hw.groupName}` : "Barcha guruhlar"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(hw.createdAt).toLocaleDateString("uz-UZ", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteHomework(hw.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Description and Image */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                      <div className={`${hw.sampleImageUrl ? "sm:col-span-8" : "sm:col-span-12"} space-y-2`}>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                          {hw.description}
                        </p>

                        {/* Submission Stats */}
                        <div className="flex items-center gap-4 pt-3 text-[11px] text-slate-500 font-semibold border-t border-slate-100">
                          <span>Jami topshirganlar: <strong className="text-slate-900">{hw.totalSubmissions}</strong></span>
                          <span>Kutilmoqda: <strong className="text-blue-600">{hw.pendingSubmissions}</strong></span>
                          <span>To&apos;g&apos;ri: <strong className="text-emerald-600">{hw.correctSubmissions}</strong></span>
                        </div>
                      </div>

                      {hw.sampleImageUrl && (
                        <div className="sm:col-span-4">
                          <div
                            onClick={() => setZoomedImage(hw.sampleImageUrl!)}
                            className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-900/5 border border-slate-200 cursor-pointer group flex items-center justify-center"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={hw.sampleImageUrl}
                              alt="Sample image"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-semibold gap-1">
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span>Ko&apos;rish</span>
                            </div>
                          </div>
                          <div className="text-[10px] text-slate-400 text-center mt-1">
                            Ustoz namunasi
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-6 right-6 p-2.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="relative max-w-5xl max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoomedImage}
              alt="Zoomed sample preview"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
