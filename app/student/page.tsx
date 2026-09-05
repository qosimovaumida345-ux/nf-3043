"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  UploadCloud,
  FileCode2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LogOut,
  Sparkles,
  Maximize2,
  X,
} from "lucide-react";

interface Submission {
  id: string;
  imageUrl: string;
  taskTitle: string;
  status: "PENDING" | "CORRECT" | "INCORRECT" | "RETRY";
  submittedAt: string;
  comment?: {
    id: string;
    feedbackText: string;
    verdict: string;
    createdAt: string;
  } | null;
}

interface StudentUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<StudentUser | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Zoom Modal state
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchSessionAndSubmissions();
  }, []);

  const fetchSessionAndSubmissions = async () => {
    try {
      setLoading(true);
      // 1. Foydalanuvchi ma'lumotlarini olish
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      // 2. Faqat ushbu talabaning topshiriqlarini olish
      const subRes = await fetch("/api/submissions");
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubmissions(subData.submissions || []);
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
      if (!file.type.startsWith("image/")) {
        setUploadError("Faqat rasm fayllarini (PNG, JPG, WEBP) tanlang.");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadError(null);
      setUploadSuccess(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Iltimos, avval kod rasmini tanlang.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // 1. Rasmni yuklash
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "Rasm yuklash muvaffaqiyatsiz bo'ldi.");
      }

      // 2. Topshiriqni ro'yxatga olish (avtomatik server vaqt tamg'asi bilan)
      const subRes = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: uploadData.url,
          storageKey: uploadData.storageKey,
          taskTitle: taskTitle.trim() || "Kundalik kod topshirig'i",
        }),
      });

      if (!subRes.ok) {
        const subError = await subRes.json();
        throw new Error(subError.error || "Topshiriqni saqlashda xatolik.");
      }

      // Tozalash va yangilash
      setSelectedFile(null);
      setPreviewUrl(null);
      setTaskTitle("");
      setUploadSuccess(true);
      if (fileInputRef.current) fileInputRef.current.value = "";

      await fetchSessionAndSubmissions();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Xatolik yuz berdi.";
      setUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CORRECT":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            To&apos;g&apos;ri bajarildi
          </span>
        );
      case "INCORRECT":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Xatolik mavjud
          </span>
        );
      case "RETRY":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Qayta topshirish
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            Tekshirilmoqda
          </span>
        );
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Background glow */}
      <div className="absolute top-[-80px] left-[-80px] w-[500px] h-[500px] rounded-full bg-[#60B1FF]/20 blur-[130px] -z-10" />
      <div className="absolute top-[200px] right-[-100px] w-[450px] h-[450px] rounded-full bg-[#319AFF]/15 blur-[120px] -z-10" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-slate-200/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold text-base shadow-sm">
              M
            </div>
            <div>
              <h1 className="font-fustat font-bold text-lg leading-tight text-slate-900">
                Mars IT <span className="text-blue-600 text-xs font-normal">Talaba Kabineti</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">NF-3043 Guruhi</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-slate-900">{user?.fullName || "Talaba"}</div>
              <div className="text-[11px] text-slate-400">@{user?.username}</div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 bg-white/80 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Chiqish</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Welcome banner */}
        <div
          className="rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-lg border border-white/60"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(239,246,255,0.85) 100%)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/60 text-blue-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Kundalik Kod Tekshiruvi</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-fustat font-bold text-slate-900 tracking-tight">
              Xush kelibsiz, {user?.fullName || "Talaba"}!
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Bugungi bajargan vazifangiz yoki konspektingiz kodining suratini yuklang. O&apos;qituvchi uni tekshirib, izoh va baho qoldiradi. Siz faqat o&apos;z topshiriqlaringizni ko&apos;ra olasiz.
            </p>
          </div>
        </div>

        {/* Grid: Left = Upload Card, Right = Submissions History */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* UPLOAD CARD (4 Columns) */}
          <div className="lg:col-span-5">
            <div
              className="rounded-3xl p-6 shadow-xl border border-white/80 bg-white/75 backdrop-blur-2xl space-y-5 sticky top-24"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <FileCode2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">Yangi Kod Rasmini Yuklash</h3>
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>Topshiriq muvaffaqiyatli yuklandi va o&apos;qituvchiga yuborildi!</span>
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                {/* Task Title / Topic */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mavzu yoki Masala nomi
                  </label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="masalan: 5-masala: Massivlar va Sikllar"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                {/* Dropzone File Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Kod surati (Monitor yoki Daftar)
                  </label>
                  
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                      previewUrl
                        ? "border-blue-400 bg-blue-50/20"
                        : "border-slate-300 hover:border-blue-500 hover:bg-slate-50/50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {previewUrl ? (
                      <div className="space-y-3">
                        <div className="relative w-full h-48 rounded-xl overflow-hidden bg-slate-900/5 border border-slate-200">
                          <Image
                            src={previewUrl}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <p className="text-xs text-blue-600 font-medium hover:underline">
                          Rasmni o&apos;zgartirish uchun bosing
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-2 py-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <div className="text-xs font-semibold text-slate-700">
                          Rasm faylini tanlash uchun bosing
                        </div>
                        <p className="text-[11px] text-slate-400">
                          PNG, JPG, WEBP (maksimal 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="w-full py-3 px-4 rounded-xl text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "rgba(0, 132, 255, 0.9)",
                    boxShadow: "0 4px 14px rgba(0, 132, 255, 0.35)",
                  }}
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>O&apos;qituvchiga yuborish</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* SUBMISSIONS HISTORY (7 Columns) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-fustat font-bold text-lg text-slate-900">
                Mening Kod Topshiriqlarim ({submissions.length})
              </h3>
              <span className="text-xs text-slate-400">
                Faqat sizning shaxsiy yuklamalaringiz
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 bg-white/50 rounded-3xl border border-slate-200">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-16 px-6 bg-white/60 rounded-3xl border border-dashed border-slate-300 space-y-3">
                <FileCode2 className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-700">Hali topshiriq yuklamagansiz</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Chap tomondagi yuklash oynasi orqali bugungi kodingiz suratini yuklang va o&apos;qituvchi tahlilini kuting.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="rounded-2xl p-5 bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-4"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{sub.taskTitle}</h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(sub.submittedAt).toLocaleString("uz-UZ", {
                              day: "2-digit",
                              month: "long",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      <div>{getStatusBadge(sub.status)}</div>
                    </div>

                    {/* Image and Content */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Image Thumbnail with zoom trigger */}
                      <div
                        onClick={() => setZoomedImage(sub.imageUrl)}
                        className="relative w-full sm:w-48 h-36 rounded-xl overflow-hidden bg-slate-900/5 border border-slate-200 cursor-pointer group shrink-0"
                      >
                        <Image
                          src={sub.imageUrl}
                          alt="Code submission"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                          <Maximize2 className="w-4 h-4" />
                          <span>Kattalashtirish</span>
                        </div>
                      </div>

                      {/* Admin's Comment Feedback Section */}
                      <div className="flex-1 rounded-xl p-4 bg-slate-50/80 border border-slate-200/60 flex flex-col justify-between">
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            O&apos;qituvchi Fikri va Bahosi:
                          </div>

                          {sub.comment ? (
                            <div className="space-y-2">
                              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                                &ldquo;{sub.comment.feedbackText}&rdquo;
                              </p>
                              <div className="text-[10px] text-slate-400">
                                Tekshirilgan sana:{" "}
                                {new Date(sub.comment.createdAt).toLocaleDateString("uz-UZ", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">
                              O&apos;qituvchi hali izoh qoldirmadi. Tez orada tekshirib baholaydi.
                            </p>
                          )}
                        </div>

                        <div className="text-[10px] text-slate-400 pt-3 mt-2 border-t border-slate-200/40">
                          🛡️ Boshqa talabalar ushbu yuklama va izohni ko&apos;ra olmaydi.
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Image Full-screen Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="relative max-w-5xl max-h-[85vh] w-full h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={zoomedImage}
              alt="Zoomed code preview"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
