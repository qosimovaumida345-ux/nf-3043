"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileCode2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  LogOut,
  Sparkles,
  Maximize2,
  X,
  BookOpen,
  Calendar,
  Lock,
  RefreshCw,
} from "lucide-react";

interface Comment {
  id: string;
  feedbackText: string;
  verdict: string;
  createdAt: string;
}

interface StudentSubmission {
  id: string;
  homeworkId?: string | null;
  imageUrl: string;
  status: "PENDING" | "CORRECT" | "INCORRECT" | "RETRY";
  submittedAt: string;
  comment?: Comment | null;
}

interface Homework {
  id: string;
  title: string;
  description: string;
  sampleImageUrl?: string | null;
  groupName?: string | null;
  createdAt: string;
  mySubmission?: StudentSubmission | null;
  canSubmit: boolean;
  isPending: boolean;
  isCorrect: boolean;
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
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);

  // Active submission drawer/state: [homeworkId]: { file, previewUrl, uploading, error, success }
  const [activeUploadHwId, setActiveUploadHwId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Zoom Modal state
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchSessionAndHomeworks();
  }, []);

  const fetchSessionAndHomeworks = async () => {
    try {
      setLoading(true);
      const [meRes, hwRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/homeworks"),
      ]);

      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      if (hwRes.ok) {
        const hwData = await hwRes.json();
        setHomeworks(hwData.homeworks || []);
      }
    } catch (err) {
      console.error("Ma'lumotlarni yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUpload = (hwId: string) => {
    setActiveUploadHwId(hwId);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
    setUploadSuccess(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadError(null);
      setUploadSuccess(null);
    }
  };

  const handleUploadSubmit = async (hwId: string, hwTitle: string) => {
    if (!selectedFile) {
      setUploadError("Iltimos, avval kodingiz suratini tanlang.");
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

      // 2. Topshiriqni bog'lab saqlash
      const subRes = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeworkId: hwId,
          imageUrl: uploadData.url,
          storageKey: uploadData.storageKey,
          taskTitle: hwTitle,
        }),
      });

      const subData = await subRes.json();
      if (!subRes.ok) {
        throw new Error(subData.error || "Topshiriqni saqlashda xatolik.");
      }

      setUploadSuccess("✅ Topshiriq muvaffaqiyatli topshirildi va ustozga yuborildi!");
      setSelectedFile(null);
      setPreviewUrl(null);
      setActiveUploadHwId(null);

      await fetchSessionAndHomeworks();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xatolik yuz berdi.";
      setUploadError(msg);
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
            O&apos;qituvchi tekshiruvida
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
      <header className="sticky top-0 z-40 bg-white/75 backdrop-blur-xl border-b border-slate-200/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Mars IT Logo"
              className="w-10 h-10 rounded-xl object-contain shadow-sm border border-slate-200/60 bg-slate-950/5"
            />
            <div>
              <h1 className="font-fustat font-bold text-lg leading-tight text-slate-900">
                Mars IT <span className="text-blue-600 text-xs font-normal">Talaba Kabineti</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">Kundalik Kod Tekshiruvi</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-slate-900">{user?.fullName || "Talaba"}</div>
              <div className="text-[11px] text-slate-400">@{user?.username}</div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors shadow-xs"
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
            background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(239,246,255,0.85) 100%)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/60 text-blue-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ustoz Tomonidan Berilgan Vazifalar</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-fustat font-bold text-slate-900 tracking-tight">
              Assalomu alaykum, {user?.fullName || "Talaba"}!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Quyida ustozingiz tomonidan e&apos;lon qilingan uy ishlari ro&apos;yxati keltirilgan. Har bir uy ishiga o&apos;z kodingiz suratini yuklab topshiring. Ustoz tekshirib natija e&apos;lon qilmaguncha bir xil vazifaga qayta rasm yuborib bo&apos;lmaydi.
            </p>
          </div>
        </div>

        {/* HOMEWORKS LIST */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h3 className="font-fustat font-bold text-xl text-slate-900">
                Mening Uy Ishlarim ({homeworks.length})
              </h3>
            </div>
            <button
              onClick={fetchSessionAndHomeworks}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-colors"
              title="Yangilash"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 bg-white/50 rounded-3xl border border-slate-200">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : homeworks.length === 0 ? (
            <div className="text-center py-20 bg-white/60 rounded-3xl border border-dashed border-slate-300 space-y-2">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-700">Hozircha faol uy ishlari yo&apos;q</h4>
              <p className="text-xs text-slate-400">Ustoz yangi topshiriq e&apos;lon qilganda shu yerda paydo bo&apos;ladi.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {homeworks.map((hw) => {
                const sub = hw.mySubmission;
                const isUploadingThis = activeUploadHwId === hw.id;

                return (
                  <div
                    key={hw.id}
                    className="rounded-3xl p-6 sm:p-7 bg-white/85 backdrop-blur-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-6"
                  >
                    {/* Top Bar: Homework Title, Group, Date, Submission Status */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h4 className="font-fustat font-bold text-base sm:text-lg text-slate-900">
                            {hw.title}
                          </h4>
                          {hw.groupName && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {hw.groupName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            E&apos;lon qilingan:{" "}
                            {new Date(hw.createdAt).toLocaleDateString("uz-UZ", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      <div>
                        {sub ? (
                          getStatusBadge(sub.status)
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Topshirilmagan
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content Section: Ustoz tavsifi va Ustoz namunasi */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60">
                      <div className={`${hw.sampleImageUrl ? "md:col-span-8" : "md:col-span-12"} space-y-2`}>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Ustoz Ko&apos;rsatmasi va Topshiriq Sharti:
                        </div>
                        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-line">
                          {hw.description}
                        </p>
                      </div>

                      {hw.sampleImageUrl && (
                        <div className="md:col-span-4">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            Ustoz Namunasi (Rasm):
                          </div>
                          <div
                            onClick={() => setZoomedImage(hw.sampleImageUrl!)}
                            className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-900/5 border border-slate-200 cursor-pointer group flex items-center justify-center shadow-xs"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={hw.sampleImageUrl}
                              alt="Teacher sample"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                              <Maximize2 className="w-4 h-4" />
                              <span>Namunani ko&apos;rish</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SUBMISSION STATE & INTERACTION */}
                    <div className="space-y-4 pt-2">
                      {/* Case 1: Talaba allaqachon topshirgan va o'qituvchi tekshiruvida (PENDING) */}
                      {sub && sub.status === "PENDING" && (
                        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                              <Lock className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="font-bold text-xs sm:text-sm text-amber-900">
                                Topshiriq yuborilgan — O&apos;qituvchi tekshiruvida!
                              </h5>
                              <p className="text-xs text-amber-700 mt-0.5">
                                Ustoz tekshirib baho yoki izoh e&apos;lon qilmaguncha qayta rasm yubora olmaysiz.
                              </p>
                              <div className="text-[11px] text-amber-600/80 mt-1">
                                Yuborilgan vaqt: {new Date(sub.submittedAt).toLocaleString("uz-UZ")}
                              </div>
                            </div>
                          </div>

                          <div
                            onClick={() => setZoomedImage(sub.imageUrl)}
                            className="relative w-24 h-16 rounded-xl overflow-hidden border border-amber-300 cursor-pointer shrink-0"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={sub.imageUrl}
                              alt="My submission"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white text-[10px] font-bold">
                              Ko&apos;rish
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Case 2: To'g'ri qabul qilingan (CORRECT) */}
                      {sub && sub.status === "CORRECT" && (
                        <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs sm:text-sm">
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              <span>Ustoz topshiriqni to&apos;g&apos;ri deb qabul qildi!</span>
                            </div>
                            <span className="text-[11px] text-emerald-600">
                              {new Date(sub.submittedAt).toLocaleDateString("uz-UZ")}
                            </span>
                          </div>

                          {sub.comment && (
                            <div className="p-3.5 rounded-xl bg-white/80 border border-emerald-100 text-xs text-slate-800 font-medium leading-relaxed">
                              Ustoz izohi: &ldquo;{sub.comment.feedbackText}&rdquo;
                            </div>
                          )}
                        </div>
                      )}

                      {/* Case 3: Xato yoki Qayta topshirish so'ralgan (INCORRECT / RETRY) */}
                      {sub && (sub.status === "INCORRECT" || sub.status === "RETRY") && (
                        <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs sm:text-sm">
                              <XCircle className="w-5 h-5 text-rose-600" />
                              <span>
                                {sub.status === "RETRY" ? "Qayta topshirish so'raldi" : "Kodingizda xatolik aniqlandi"}
                              </span>
                            </div>
                          </div>

                          {sub.comment && (
                            <div className="p-3.5 rounded-xl bg-white/90 border border-rose-100 text-xs text-rose-900 font-medium leading-relaxed">
                              Ustoz kamchiliklarni ko&apos;rsatdi: &ldquo;{sub.comment.feedbackText}&rdquo;
                            </div>
                          )}

                          <div className="pt-1">
                            <button
                              onClick={() => handleOpenUpload(hw.id)}
                              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2"
                            >
                              <UploadCloud className="w-4 h-4" />
                              <span>Xatoni to&apos;g&apos;rilab, yangi rasm yuklash</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Case 4: Hali topshirilmagan bo'lsa */}
                      {!sub && !isUploadingThis && (
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => handleOpenUpload(hw.id)}
                            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2"
                          >
                            <UploadCloud className="w-4 h-4" />
                            <span>Ushbu Uy Ishini Topshirish</span>
                          </button>
                        </div>
                      )}

                      {/* UPLOAD FORM (agar ochilgan bo'lsa) */}
                      {isUploadingThis && (
                        <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-4 animate-fade-in">
                          <div className="flex items-center justify-between border-b border-blue-200/60 pb-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                              <FileCode2 className="w-4 h-4 text-blue-600" />
                              <span>Kod Fotosuratini Yuklash ({hw.title})</span>
                            </div>
                            <button
                              onClick={() => setActiveUploadHwId(null)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {uploadError && (
                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                              <span>{uploadError}</span>
                            </div>
                          )}

                          {uploadSuccess && (
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                              <span>{uploadSuccess}</span>
                            </div>
                          )}

                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all bg-white ${
                              previewUrl ? "border-blue-400" : "border-slate-300 hover:border-blue-500"
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
                              <div className="space-y-3">
                                <div className="relative w-full h-56 rounded-xl overflow-hidden bg-slate-900/5 border border-slate-200 flex items-center justify-center">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={previewUrl}
                                    alt="Selected preview"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <p className="text-xs text-blue-600 font-medium">
                                  Boshqa rasm tanlash uchun bosing
                                </p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center space-y-2 py-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                                  <UploadCloud className="w-6 h-6" />
                                </div>
                                <div className="text-xs font-semibold text-slate-800">
                                  Kod suratini tanlash uchun bosing
                                </div>
                                <p className="text-[11px] text-slate-400">
                                  Kompyuter ekrani yoki daftardagi kod surati (PNG, JPG, WEBP, HEIC)
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setActiveUploadHwId(null)}
                              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                            >
                              Bekor qilish
                            </button>
                            <button
                              type="button"
                              disabled={uploading || !selectedFile}
                              onClick={() => handleUploadSubmit(hw.id, hw.title)}
                              className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
                            >
                              {uploading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <UploadCloud className="w-4 h-4" />
                                  <span>Ustozga topshirish</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
              alt="Zoomed preview"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
