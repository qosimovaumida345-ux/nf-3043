"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  BookOpen,
  PlusCircle,
  Plus,
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
  Clock,
  Bell,
  AlertTriangle,
} from "lucide-react";
import ImageCarousel from "@/components/ImageCarousel";
import EnhancedZoomModal from "@/components/EnhancedZoomModal";

interface Group {
  id: string;
  name: string;
}

interface Homework {
  id: string;
  title: string;
  description: string;
  sampleImageUrl?: string | null;
  sampleImageUrls?: string[] | null;
  groupId?: string | null;
  groupName?: string | null;
  deadline?: string | null;
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
  const [deadline, setDeadline] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [sampleFiles, setSampleFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Zoom Modal
  const [zoomModal, setZoomModal] = useState<{
    images: string[];
    index: number;
    title?: string;
  } | null>(null);

  useEffect(() => {
    fetchHomeworksAndGroups();

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        fetchHomeworksAndGroups();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const fetchHomeworksAndGroups = async () => {
    try {
      setLoading(true);
      const [meRes, hwRes, grpRes] = await Promise.all([
        fetch("/api/auth/me", { cache: "no-store" }),
        fetch("/api/homeworks", { cache: "no-store" }),
        fetch("/api/admin/groups", { cache: "no-store" }),
      ]);

      if (!meRes.ok) {
        window.location.replace("/login");
        return;
      }
      const meData = await meRes.json();
      if (meData.user?.role !== "ADMIN") {
        window.location.replace("/student");
        return;
      }

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
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSampleFiles((prev) => [...prev, ...files]);
      const newUrls = files.map((f) => URL.createObjectURL(f));
      setPreviewUrls((prev) => [...prev, ...newUrls]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSampleFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title.trim()) {
      setError("Iltimos, uy ishi mavzu sarlavhasini kiriting.");
      return;
    }

    setSubmitting(true);

    try {
      let sampleImageUrls: string[] = [];

      // 1. Agar namuna rasmlar tanlangan bo'lsa, barchasini birdaniga yuklaymiz
      if (sampleFiles.length > 0) {
        const uploadPromises = sampleFiles.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);

          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          const uploadData = await uploadRes.json();
          if (!uploadRes.ok) {
            throw new Error(uploadData.error || `${file.name} rasmini yuklashda xatolik.`);
          }
          return uploadData.url as string;
        });

        sampleImageUrls = await Promise.all(uploadPromises);
      }

      // 2. Uy ishini saqlash
      const res = await fetch("/api/homeworks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          sampleImageUrl: sampleImageUrls[0] || null,
          sampleImageUrls,
          groupId: selectedGroup || null,
          deadline: deadline ? new Date(deadline).toISOString() : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Uy ishini yaratishda xatolik.");
      }

      setSuccess("✅ Yangi uy ishi muvaffaqiyatli e'lon qilindi!");
      setTitle("");
      setDescription("");
      setDeadline("");
      setSelectedGroup("");
      setSampleFiles([]);
      setPreviewUrls([]);
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
    <div className="relative min-h-screen bg-slate-50 text-slate-900 pb-20 overflow-x-hidden">
      {/* Dynamic Animated Ambient Background Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-120px] left-[-100px] w-[650px] h-[650px] rounded-full bg-gradient-to-br from-[#319AFF]/25 via-[#60B1FF]/20 to-transparent blur-[140px] animate-pulse" />
        <div className="absolute top-[20%] right-[-120px] w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-[#5E0ED7]/20 via-purple-400/15 to-transparent blur-[150px]" />
        <div className="absolute bottom-[-100px] left-[25%] w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-emerald-400/15 via-sky-400/20 to-transparent blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.07]" />
      </div>

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
                    Uy Ishi Sharti va Tavsifi (Ixtiyoriy)
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Talabalar nima qilishi kerakligini, asosiy shartlar va topshiriq qoidalarini yozing..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                {/* Deadline (Topshirish muddati) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Topshirish Muddati (Deadline) - Ixtiyoriy
                    </label>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 1);
                          d.setHours(18, 0, 0, 0);
                          setDeadline(d.toISOString().slice(0, 16));
                        }}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer font-medium"
                      >
                        Ertaga 18:00
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 3);
                          d.setHours(20, 0, 0, 0);
                          setDeadline(d.toISOString().slice(0, 16));
                        }}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer font-medium"
                      >
                        3 kun
                      </button>
                    </div>
                  </div>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                {/* Sample Image upload */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Namuna / Shart Rasmlari (1 ta yoki bir nechta rasm)
                    </label>
                    {previewUrls.length > 0 && (
                      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        {previewUrls.length} ta rasm tanlandi
                      </span>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.heic,.heif,.webp,.png,.jpg,.jpeg,.gif,.bmp,.svg,.avif"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {previewUrls.length > 0 ? (
                    <div className="space-y-3 p-3 bg-slate-50/80 border border-slate-200 rounded-2xl">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {previewUrls.map((url, idx) => (
                          <div
                            key={idx}
                            className="relative group h-28 rounded-xl overflow-hidden bg-slate-900/5 border border-slate-200 flex items-center justify-center p-1"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={`Preview ${idx + 1}`}
                              className="w-full h-full object-contain"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile(idx);
                              }}
                              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md transition-transform hover:scale-110"
                              title="O'chirish"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                              #{idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Yana rasm qo&apos;shish</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSampleFiles([]);
                            setPreviewUrls([]);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="text-xs text-rose-500 hover:text-rose-600 cursor-pointer"
                        >
                          Barchasini tozalash
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-5 text-center cursor-pointer transition-all bg-white/50 hover:bg-blue-50/20"
                    >
                      <div className="flex flex-col items-center justify-center space-y-1.5">
                        <UploadCloud className="w-8 h-8 text-blue-600 mb-1" />
                        <span className="text-xs font-semibold text-slate-800">
                          Namuna rasmlarni tanlash (1 ta yoki bir nechta)
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Bir vaqtda bir nechta rasm belgilashingiz mumkin (PNG, JPG, WEBP va barcha formatlar)
                        </span>
                      </div>
                    </div>
                  )}
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
                      <div className={`${hw.sampleImageUrl ? "sm:col-span-8" : "sm:col-span-12"} space-y-2.5`}>
                        {hw.deadline && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>
                              Deadline: {new Date(hw.deadline).toLocaleString("uz-UZ", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        )}

                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                          {hw.description || "(Tavsif kiritilmagan)"}
                        </p>

                        {/* Submission Stats */}
                        <div className="flex items-center gap-4 pt-3 text-[11px] text-slate-500 font-semibold border-t border-slate-100">
                          <span>Jami topshirganlar: <strong className="text-slate-900">{hw.totalSubmissions}</strong></span>
                          <span>Kutilmoqda: <strong className="text-blue-600">{hw.pendingSubmissions}</strong></span>
                          <span>To&apos;g&apos;ri: <strong className="text-emerald-600">{hw.correctSubmissions}</strong></span>
                        </div>
                      </div>

                      {((hw.sampleImageUrls && hw.sampleImageUrls.length > 0) || hw.sampleImageUrl) && (() => {
                        const images = (hw.sampleImageUrls && hw.sampleImageUrls.length > 0)
                          ? hw.sampleImageUrls
                          : (hw.sampleImageUrl ? [hw.sampleImageUrl] : []);

                        return (
                          <div className="sm:col-span-5 space-y-2">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                              <span>Ustoz Namunalari:</span>
                              <span className="text-[10px] text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full font-bold">
                                {images.length} ta rasm
                              </span>
                            </div>
                            <ImageCarousel
                              images={images}
                              title={`${hw.title} - Namunalar`}
                              maxHeightClass="h-44 sm:h-52"
                              onZoom={(imgIdx) =>
                                setZoomModal({
                                  images,
                                  index: imgIdx,
                                  title: `${hw.title} - Ustoz namunasi`,
                                })
                              }
                            />
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Enhanced Zoom Modal */}
      {zoomModal && (
        <EnhancedZoomModal
          images={zoomModal.images}
          initialIndex={zoomModal.index}
          title={zoomModal.title}
          onClose={() => setZoomModal(null)}
        />
      )}
    </div>
  );
}
