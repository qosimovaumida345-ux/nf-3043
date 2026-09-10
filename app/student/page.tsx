"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  MessageSquare,
  Send,
  Users,
  Volume2,
  BellRing,
} from "lucide-react";
import { playNotificationSound, playSuccessSound, playWarningSound } from "@/lib/sound";

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
  deadline?: string | null;
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
  groupId?: string | null;
  groupName?: string | null;
}

interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderRole: string;
  message: string;
  createdAt: string;
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

  // Group Chat Modal state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatText, setChatText] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const lastMsgCountRef = useRef(0);

  useEffect(() => {
    fetchSessionAndHomeworks();

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        fetchSessionAndHomeworks();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // Guruh xabarlarini avtomatik yangilab turish (har 3 soniyada)
  useEffect(() => {
    if (!chatOpen || !user?.groupId) return;

    let isMounted = true;
    const fetchChat = async (silent = false) => {
      if (!silent) setLoadingChat(true);
      try {
        const res = await fetch(`/api/groups/${user.groupId}/messages`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            const msgs: ChatMessage[] = data.messages || [];
            if (silent && msgs.length > lastMsgCountRef.current) {
              // Yangi xabar kelganda bildirishnoma ovozi
              playNotificationSound();
            }
            lastMsgCountRef.current = msgs.length;
            setChatMessages(msgs);
          }
        }
      } catch (err) {
        console.error("Guruh chatini yuklashda xatolik:", err);
      } finally {
        if (isMounted && !silent) setLoadingChat(false);
      }
    };

    fetchChat();
    const timer = setInterval(() => fetchChat(true), 3000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [chatOpen, user?.groupId]);

  useEffect(() => {
    if (chatOpen && chatMessages.length > 0) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatOpen]);

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatText.trim() || !user?.groupId || sendingChat) return;

    const text = chatText.trim();
    setSendingChat(true);
    try {
      const res = await fetch(`/api/groups/${user.groupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [...prev, data.message]);
        setChatText("");
        playSuccessSound();
        setTimeout(() => {
          chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 80);
      } else {
        alert("Xabarni yuborib bo'lmadi.");
      }
    } catch {
      alert("Serverga ulanishda xatolik.");
    } finally {
      setSendingChat(false);
    }
  };

  const fetchSessionAndHomeworks = async () => {
    try {
      setLoading(true);
      const [meRes, hwRes] = await Promise.all([
        fetch("/api/auth/me", { cache: "no-store" }),
        fetch("/api/homeworks", { cache: "no-store" }),
      ]);

      if (!meRes.ok) {
        window.location.replace("/login");
        return;
      }
      const meData = await meRes.json();
      if (meData.user?.role === "ADMIN") {
        window.location.replace("/admin");
        return;
      }
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

  const getDeadlineInfo = (deadlineStr?: string | null) => {
    if (!deadlineStr) return null;
    const now = new Date();
    const d = new Date(deadlineStr);
    if (isNaN(d.getTime())) return null;

    const diffMs = d.getTime() - now.getTime();
    const isExpired = diffMs <= 0;
    const hoursLeft = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
    const daysLeft = Math.floor(hoursLeft / 24);

    let statusText = "";
    if (isExpired) {
      statusText = "Muddati o'tgan";
    } else if (daysLeft > 0) {
      statusText = `${daysLeft} kun qoldi`;
    } else if (hoursLeft > 0) {
      statusText = `${hoursLeft} soat qoldi`;
    } else {
      const minutesLeft = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      statusText = `${minutesLeft} daqiqa qoldi`;
    }

    const formattedDate = d.toLocaleString("uz-UZ", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      isExpired,
      isNear: !isExpired && hoursLeft < 24,
      formattedDate,
      statusText,
    };
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
      playSuccessSound();
      setSelectedFile(null);
      setPreviewUrl(null);
      setActiveUploadHwId(null);

      await fetchSessionAndHomeworks();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xatolik yuz berdi.";
      setUploadError(msg);
      playWarningSound();
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.replace("/login");
    }
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
    <div className="relative min-h-screen bg-slate-50 text-slate-900 pb-20 overflow-x-hidden">
      {/* Dynamic Animated Ambient Background Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-120px] left-[-100px] w-[650px] h-[650px] rounded-full bg-gradient-to-br from-[#319AFF]/25 via-[#60B1FF]/20 to-transparent blur-[140px] animate-pulse" />
        <div className="absolute top-[20%] right-[-120px] w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-[#5E0ED7]/20 via-purple-400/15 to-transparent blur-[150px]" />
        <div className="absolute bottom-[-100px] left-[25%] w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-emerald-400/15 via-sky-400/20 to-transparent blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.07]" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-6 py-4 shadow-xs">
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

          <div className="flex items-center gap-3">
            {/* Ovozli bildirishnomani sinab ko'rish */}
            <button
              type="button"
              onClick={() => playNotificationSound()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer"
              title="Bildirishnoma ovozini sinab ko'rish"
            >
              <Volume2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Ovozni sinash</span>
            </button>

            {user?.groupId && (
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Guruh Chati</span>
                <span className="inline sm:hidden">Chat</span>
                {user.groupName && (
                  <span className="hidden md:inline text-[10px] px-1.5 py-0.5 rounded-md bg-white/20 text-white font-medium">
                    {user.groupName}
                  </span>
                )}
              </button>
            )}

            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-slate-900">{user?.fullName || "Talaba"}</div>
              <div className="text-[11px] text-slate-400">@{user?.username}</div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Chiqish</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Welcome banner with Framer Motion */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl border border-white/80 flex flex-col md:flex-row md:items-center justify-between gap-6"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(239,246,255,0.85) 50%, rgba(243,232,255,0.75) 100%)",
            backdropFilter: "blur(24px)",
          }}
        >
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 text-blue-700 text-xs font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Ustoz Tomonidan Berilgan Vazifalar</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-fustat font-bold text-slate-900 tracking-tight">
              Assalomu alaykum, {user?.fullName || "Talaba"}! 👋
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Quyida ustozingiz tomonidan e&apos;lon qilingan uy ishlari ro&apos;yxati keltirilgan. Har bir uy ishiga o&apos;z kodingiz suratini yuklab topshiring. Ustoz tekshirib natija e&apos;lon qilmaguncha bir xil vazifaga qayta rasm yuborib bo&apos;lmaydi.
            </p>
          </div>

          {user?.groupId && (
            <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2">
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Guruh Chatini Ochish</span>
              </button>
              {user.groupName && (
                <p className="text-[11px] text-slate-500 text-center font-medium">
                  Guruh: <span className="font-bold text-slate-700">{user.groupName}</span>
                </p>
              )}
            </div>
          )}
        </motion.div>

        {/* Animated KPI Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/90 shadow-md flex items-center justify-between hover:scale-[1.02] transition-transform"
          >
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Jami Vazifalar</p>
              <h4 className="text-2xl font-bold text-slate-900 mt-1">{homeworks.length}</h4>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/90 shadow-md flex items-center justify-between hover:scale-[1.02] transition-transform"
          >
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Qabul Qilingan</p>
              <h4 className="text-2xl font-bold text-emerald-600 mt-1">
                {homeworks.filter((h) => h.isCorrect).length}
              </h4>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/90 shadow-md flex items-center justify-between hover:scale-[1.02] transition-transform"
          >
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tekshirilmoqda</p>
              <h4 className="text-2xl font-bold text-amber-600 mt-1">
                {homeworks.filter((h) => h.isPending).length}
              </h4>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/90 shadow-md flex items-center justify-between hover:scale-[1.02] transition-transform"
          >
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Topshirilmagan</p>
              <h4 className="text-2xl font-bold text-indigo-600 mt-1">
                {homeworks.filter((h) => !h.mySubmission).length}
              </h4>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
              <FileCode2 className="w-5 h-5" />
            </div>
          </motion.div>
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
              {homeworks.map((hw, idx) => {
                const sub = hw.mySubmission;
                const isUploadingThis = activeUploadHwId === hw.id;

                return (
                  <motion.div
                    key={hw.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * idx, duration: 0.4 }}
                    className="rounded-3xl p-6 sm:p-7 bg-white/85 backdrop-blur-xl border border-white/90 shadow-sm hover:shadow-xl hover:border-blue-300/60 transition-all space-y-6"
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

                        {hw.deadline && (() => {
                          const dl = getDeadlineInfo(hw.deadline);
                          if (!dl) return null;
                          return (
                            <div
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border mt-2 ${
                                dl.isExpired
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : dl.isNear
                                  ? "bg-amber-50 text-amber-900 border-amber-300 animate-pulse font-bold"
                                  : "bg-blue-50 text-blue-800 border-blue-200"
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Topshirish muddati: {dl.formattedDate}</span>
                              <span className="font-bold ml-1">({dl.statusText})</span>
                            </div>
                          );
                        })()}
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
                          {hw.description || "(Ustoz tomonidan qo'shimcha tavsif kiritilmagan)"}
                        </p>
                      </div>

                      {hw.sampleImageUrl && (
                        <div className="md:col-span-4">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            Ustoz Namunasi (Rasm):
                          </div>
                          <div
                            onClick={() => setZoomedImage(hw.sampleImageUrl!)}
                            className="relative w-full h-40 rounded-xl overflow-hidden bg-slate-900/5 border border-slate-200 cursor-pointer group flex items-center justify-center shadow-xs p-1"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={hw.sampleImageUrl}
                              alt="Teacher sample"
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform"
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
                            className="relative w-24 h-16 rounded-xl overflow-hidden border border-amber-300 cursor-pointer shrink-0 bg-slate-900/10 flex items-center justify-center p-1"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={sub.imageUrl}
                              alt="My submission"
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity rounded-xl">
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
                                <div className="relative w-full h-56 rounded-xl overflow-hidden bg-slate-950/5 border border-slate-200 flex items-center justify-center p-2">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={previewUrl}
                                    alt="Selected preview"
                                    className="max-h-52 w-auto object-contain rounded-lg shadow-xs"
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
                  </motion.div>
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

      {/* Floating Group Chat Button */}
      {user?.groupId && !chatOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-2xl hover:scale-105 transition-all text-xs font-bold border-2 border-white/80 cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Guruh Chati</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        </motion.button>
      )}

      {/* Group Chat Drawer/Modal */}
      <AnimatePresence>
        {chatOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setChatOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="bg-white w-full sm:max-w-2xl h-[90vh] sm:h-[680px] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shadow-md shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-blue-400 border border-white/10">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-fustat font-bold text-base leading-tight flex items-center gap-2">
                      <span>{user?.groupName || "Guruh Chati"}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                        Jonli muloqot
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 font-medium">
                      Ustoz va guruhdoshlar bilan savol-javoblar
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat messages stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50/70">
                {loadingChat && chatMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2 text-slate-400">
                    <MessageSquare className="w-10 h-10 stroke-1 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">Hozircha xabarlar yo&apos;q</p>
                    <p className="text-[11px] text-slate-400 max-w-xs">
                      Ustozingiz yoki guruhdoshlaringizga birinchi xabarni yozib muloqotni boshlang!
                    </p>
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    const isTeacher = msg.senderRole === "ADMIN";

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[11px] font-bold text-slate-600">
                            {isMe ? "Siz" : msg.senderName}
                          </span>
                          {isTeacher && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                              🎓 Ustoz
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed break-words whitespace-pre-wrap ${
                            isMe
                              ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-xs"
                              : isTeacher
                              ? "bg-white text-slate-900 border-2 border-purple-200 shadow-sm rounded-tl-xs"
                              : "bg-white text-slate-900 border border-slate-200/90 rounded-tl-xs"
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input form */}
              <form
                onSubmit={handleSendChatMessage}
                className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="Xabaringizni yozing... (Enter bosing)"
                  className="flex-1 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
                <button
                  type="submit"
                  disabled={sendingChat || !chatText.trim()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
                >
                  {sendingChat ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Yuborish</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
