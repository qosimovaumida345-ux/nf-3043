"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LogOut,
  Bell,
  Maximize2,
  X,
  Filter,
  Send,
  Radio,
  UserCheck,
  BookOpen,
  Settings,
  Volume2,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { playNotificationSound, playSuccessSound } from "@/lib/sound";
import ImageCarousel from "@/components/ImageCarousel";
import EnhancedZoomModal from "@/components/EnhancedZoomModal";

interface Submission {
  id: string;
  homeworkId?: string | null;
  homeworkTitle?: string | null;
  studentId: string;
  studentName: string;
  studentUsername: string;
  imageUrl: string;
  imageUrls?: string[] | null;
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

interface StudentOption {
  id: string;
  username: string;
  fullName: string;
}

interface LiveNotification {
  id: string;
  title: string;
  message: string;
  time: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; username: string; role: string; fullName: string } | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters: default to PENDING so reviewed submissions don't clutter the teacher's view
  const [selectedStudent, setSelectedStudent] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("PENDING");

  // Review state per submission: [submissionId]: { feedbackText, verdict, isSaving }
  const [reviewDrafts, setReviewDrafts] = useState<
    Record<string, { feedbackText: string; verdict: "CORRECT" | "INCORRECT" | "RETRY"; saving?: boolean }>
  >({});

  // Real-time notification banners
  const [liveAlerts, setLiveAlerts] = useState<LiveNotification[]>([]);
  const [sseConnected, setSseConnected] = useState(false);

  // Accordion state for previous attempts per groupKey
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});

  // Zoom Modal state
  const [zoomModal, setZoomModal] = useState<{
    images: string[];
    index: number;
    title?: string;
  } | null>(null);

  useEffect(() => {
    fetchData();
    const cleanupSSE = setupSSE();

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        fetchData();
      }
    };
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      cleanupSSE?.();
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [meRes, subRes] = await Promise.all([
        fetch("/api/auth/me", { cache: "no-store" }),
        fetch("/api/submissions", { cache: "no-store" }),
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
      setUser(meData.user);

      if (!subRes.ok) {
        if (subRes.status === 401) {
          window.location.replace("/login");
          return;
        }
      }
      const subData = await subRes.json();
      setSubmissions(subData.submissions || []);

      // Boshlang'ich sharh draftlarini to'ldirish
      const drafts: typeof reviewDrafts = {};
      subData.submissions?.forEach((s: Submission) => {
        drafts[s.id] = {
          feedbackText: s.comment?.feedbackText || "",
          verdict: (s.comment?.verdict as "CORRECT" | "INCORRECT" | "RETRY") || "CORRECT",
        };
      });
      setReviewDrafts(drafts);

      // Talabalar ro'yxatini yuklash (filtrlash uchun)
      const stRes = await fetch("/api/admin/students");
      if (stRes.ok) {
        const stData = await stRes.json();
        setStudents(stData.students || []);
      }
    } catch (err) {
      console.error("Ma'lumotlarni yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time Server-Sent Events (SSE) ulanishi
  const setupSSE = () => {
    try {
      const eventSource = new EventSource("/api/admin/notifications/stream");

      eventSource.onopen = () => {
        setSseConnected(true);
      };

      eventSource.addEventListener("new-submission", (event) => {
        const payload = JSON.parse(event.data);

        // Ovozli bildirishnoma ijro etish
        playNotificationSound();

        // O'qituvchiga jonli xabar chiqarish
        const newAlert: LiveNotification = {
          id: Math.random().toString(36).substring(2, 9),
          title: "Yangi kod topshirig'i!",
          message: `${payload.studentName} (@${payload.studentId}) hozirgina yangi kod yukladi.`,
          time: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
        };

        setLiveAlerts((prev) => [newAlert, ...prev.slice(0, 4)]);

        // Yangi topshiriqni sahifani refresh qilmasdan ro'yxat boshiga qo'shish
        setSubmissions((prev) => [
          {
            id: payload.submissionId,
            studentId: payload.studentId,
            studentName: payload.studentName,
            studentUsername: payload.studentId,
            imageUrl: payload.imageUrl,
            taskTitle: payload.taskTitle,
            status: "PENDING",
            submittedAt: payload.submittedAt,
            comment: null,
          },
          ...prev,
        ]);

        // Yangi topshiriq uchun draft yaratish
        setReviewDrafts((prev) => ({
          ...prev,
          [payload.submissionId]: { feedbackText: "", verdict: "CORRECT" },
        }));
      });

      eventSource.onerror = () => {
        setSseConnected(false);
      };

      return () => {
        eventSource.close();
      };
    } catch (err) {
      console.error("SSE sozlashda xatolik:", err);
    }
  };

  const handleSaveReview = async (submissionId: string) => {
    const draft = reviewDrafts[submissionId] || {
      feedbackText: "",
      verdict: "CORRECT",
    };
    const verdict = draft.verdict || "CORRECT";
    const feedbackText = draft.feedbackText ? draft.feedbackText.trim() : "";

    setReviewDrafts((prev) => ({
      ...prev,
      [submissionId]: { ...prev[submissionId], feedbackText, verdict, saving: true },
    }));

    try {
      const res = await fetch(`/api/submissions/${submissionId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackText,
          verdict,
        }),
      });

      if (!res.ok) {
        throw new Error("Sharhni saqlab bo'lmadi.");
      }

      // Muvaffaqiyat ovozi
      playSuccessSound();

      // Topshiriq statusini yangilash
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? {
                ...s,
                status: verdict,
                comment: {
                  id: "temp",
                  feedbackText,
                  verdict,
                  createdAt: new Date().toISOString(),
                },
              }
            : s
        )
      );

      // O'qituvchiga tasdiq bildirishnomasi (Topshiriq tekshirildi va navbatdan chiqarildi)
      const reviewAlert: LiveNotification = {
        id: Math.random().toString(36).substring(2, 9),
        title: "Topshiriq baholandi!",
        message: `Topshiriq "${verdict === "CORRECT" ? "To'g'ri" : verdict === "INCORRECT" ? "Xato" : "Qayta topshirish"}" deb belgilandi va kutilayotganlar ro'yxatidan olib tashlandi.`,
        time: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
      };
      setLiveAlerts((prev) => [reviewAlert, ...prev.slice(0, 4)]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Xatolik yuz berdi.";
      alert(errorMessage);
    } finally {
      setReviewDrafts((prev) => ({
        ...prev,
        [submissionId]: { ...prev[submissionId], saving: false },
      }));
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.replace("/login");
    }
  };

  // 1. Talabaning uy ishlari bo'yicha guruhlash:
  // Bir talaba bitta vazifani necha marta qayta topshirgan bo'lmasin, hammasi BITTA CARD ichida jamlanadi!
  const groupedMap = new Map<string, Submission[]>();

  submissions.forEach((s) => {
    const key = s.homeworkId
      ? `${s.studentId}_${s.homeworkId}`
      : `${s.studentId}_${(s.taskTitle || "vazifa").trim().toLowerCase()}`;
    const list = groupedMap.get(key) || [];
    list.push(s);
    groupedMap.set(key, list);
  });

  const groupedCards = Array.from(groupedMap.entries()).map(([groupKey, subs]) => {
    // Eng oxirgi urinish birinchi qilib saralanadi
    const sorted = [...subs].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
    const latest = sorted[0];
    const previousAttempts = sorted.slice(1);

    const latestImages = (latest.imageUrls && latest.imageUrls.length > 0)
      ? latest.imageUrls
      : (latest.imageUrl ? [latest.imageUrl] : []);

    return {
      groupKey,
      studentId: latest.studentId,
      studentName: latest.studentName,
      studentUsername: latest.studentUsername,
      taskTitle: latest.taskTitle || latest.homeworkTitle || "Uy ishi topshirig'i",
      latest,
      previousAttempts,
      totalAttempts: sorted.length,
      images: latestImages,
    };
  });

  // Filtrlash (student va status bo'yicha)
  const filteredCards = groupedCards.filter((card) => {
    if (selectedStudent !== "ALL" && card.studentId !== selectedStudent) return false;
    if (selectedStatus !== "ALL" && card.latest.status !== selectedStatus) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CORRECT":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            To&apos;g&apos;ri
          </span>
        );
      case "INCORRECT":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Xato
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
            Kutilmoqda
          </span>
        );
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 pb-20 overflow-x-hidden">
      {/* Dynamic Animated Ambient Background Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-120px] right-[-100px] w-[650px] h-[650px] rounded-full bg-gradient-to-br from-[#319AFF]/25 via-[#60B1FF]/20 to-transparent blur-[140px] animate-pulse" />
        <div className="absolute top-[25%] left-[-120px] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#5E0ED7]/20 via-purple-400/15 to-transparent blur-[150px]" />
        <div className="absolute bottom-[-100px] right-[25%] w-[650px] h-[650px] rounded-full bg-gradient-to-bl from-emerald-400/15 via-sky-400/20 to-transparent blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.07]" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Mars IT Logo"
                className="w-10 h-10 rounded-xl object-contain shadow-sm border border-slate-200/60 bg-slate-950/5"
              />
              <div>
                <h1 className="font-fustat font-bold text-lg leading-tight text-slate-900">
                  Mars IT <span className="text-blue-600 text-xs font-normal">O&apos;qituvchi Paneli</span>
                </h1>
                <p className="text-xs text-slate-500 font-medium">Kod Tekshirish Platformasi</p>
              </div>
            </Link>

            {/* Live SSE Status Badge */}
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium">
              <span className={`w-2 h-2 rounded-full ${sseConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
              <span className="text-slate-600">
                {sseConnected ? "SSE Jonli Rejimda Ulandi" : "Ulanmoqda..."}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/homeworks"
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-xs"
            >
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Uy Ishlari</span>
            </Link>

            <Link
              href="/admin/students"
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-xs"
            >
              <Settings className="w-4 h-4 text-blue-600" />
              <span>Sozlamalar & Guruhlar</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 rounded-xl transition-colors shadow-xs"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          </div>
        </div>
      </header>

      {/* Floating Live Real-Time Alerts */}
      {liveAlerts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-sm w-full animate-slide-up">
          {liveAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 rounded-2xl bg-white border border-blue-200 shadow-2xl flex items-start gap-3 relative"
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{alert.title}</h4>
                  <span className="text-[10px] text-slate-400">{alert.time}</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{alert.message}</p>
              </div>
              <button
                onClick={() => setLiveAlerts((prev) => prev.filter((a) => a.id !== alert.id))}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Animated KPI Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/90 shadow-md flex items-center justify-between hover:scale-[1.02] transition-transform"
          >
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Jami Topshiriqlar</div>
              <div className="text-2xl font-fustat font-bold text-slate-900 mt-1">{groupedCards.length}</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/90 shadow-md flex items-center justify-between hover:scale-[1.02] transition-transform"
          >
            <div>
              <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">Kutilmoqda (Pending)</div>
              <div className="text-2xl font-fustat font-bold text-blue-600 mt-1">
                {groupedCards.filter((c) => c.latest.status === "PENDING").length}
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/90 shadow-md flex items-center justify-between hover:scale-[1.02] transition-transform"
          >
            <div>
              <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">To&apos;g&apos;ri Qabul Qilingan</div>
              <div className="text-2xl font-fustat font-bold text-emerald-600 mt-1">
                {groupedCards.filter((c) => c.latest.status === "CORRECT").length}
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/90 shadow-md flex items-center justify-between hover:scale-[1.02] transition-transform"
          >
            <div>
              <div className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Qayta Topshirish</div>
              <div className="text-2xl font-fustat font-bold text-amber-600 mt-1">
                {groupedCards.filter((c) => c.latest.status === "RETRY").length}
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </motion.div>
        </div>

        {/* Filters Section */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Filter className="w-4 h-4 text-blue-600" />
              <span>Filtrlash:</span>
            </div>

            {/* Student Dropdown Filter */}
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="ALL">Barcha talabalar</option>
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.fullName} (@{st.username})
                </option>
              ))}
            </select>

            {/* Status Dropdown Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="PENDING">🟡 Faqat tekshirilmaganlar (Kutilmoqda)</option>
              <option value="ALL">📁 Barcha topshiriqlar tarixi (Arxiv)</option>
              <option value="CORRECT">🟢 To&apos;g&apos;ri deb baholanganlar</option>
              <option value="INCORRECT">🔴 Xato deb baholanganlar</option>
              <option value="RETRY">🟠 Qayta topshirish so&apos;ralganlar</option>
            </select>
          </div>

          <div className="text-xs text-slate-500">
            Ko&apos;rsatilmoqda: <span className="font-bold text-slate-900">{filteredCards.length}</span> ta topshiriq card
          </div>
        </div>

        {/* Submissions List: 1 Card per Student + Homework */}
        {loading ? (
          <div className="flex items-center justify-center py-24 bg-white/50 rounded-3xl border border-slate-200">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-20 bg-white/60 rounded-3xl border border-dashed border-slate-300">
            <Radio className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-700">Topshiriqlar topilmadi</h4>
            <p className="text-xs text-slate-400 mt-1">
              Hali talabalar topshiriq yuklamagan yoki tanlangan filtr bo&apos;yicha ma&apos;lumot yo&apos;q.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredCards.map((card, idx) => {
              const sub = card.latest;
              const draft = reviewDrafts[sub.id] || {
                feedbackText: sub.comment?.feedbackText || "",
                verdict: (sub.comment?.verdict as "CORRECT" | "INCORRECT" | "RETRY") || "CORRECT",
              };

              return (
                <motion.div
                  key={card.groupKey}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * idx, duration: 0.4 }}
                  className="rounded-3xl p-6 sm:p-7 bg-white/90 backdrop-blur-xl border border-white/90 shadow-sm hover:shadow-xl hover:border-blue-300/60 transition-all space-y-6"
                >
                  {/* Top Bar: Student info, task, resubmission badge, date, status */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base shadow-xs border border-blue-100">
                        {card.studentName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-sm sm:text-base text-slate-900">{card.studentName}</h4>
                          <span className="text-[11px] font-mono text-slate-400">@{card.studentUsername}</span>
                          {card.totalAttempts > 1 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
                              <History className="w-3.5 h-3.5 text-purple-600" />
                              <span>Qayta topshirilgan ({card.totalAttempts}-urinish)</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-blue-600 font-semibold mt-0.5">{card.taskTitle}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {new Date(sub.submittedAt).toLocaleString("uz-UZ", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div>{getStatusBadge(sub.status)}</div>
                    </div>
                  </div>

                  {/* Body: Left = Carousel & Previous attempts, Right = Feedback Form */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Code Photo Carousel */}
                    <div className="lg:col-span-6 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                        <span>Eng so&apos;nggi topshirilgan fotosuratlar:</span>
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                          {card.images.length} ta rasm
                        </span>
                      </div>

                      <ImageCarousel
                        images={card.images}
                        title={`${card.studentName} - ${card.taskTitle}`}
                        maxHeightClass="h-64 sm:h-72"
                        onZoom={(imgIdx) =>
                          setZoomModal({
                            images: card.images,
                            index: imgIdx,
                            title: `${card.studentName} - ${card.taskTitle}`,
                          })
                        }
                      />

                      {/* Agar talaba oldin ham topshirgan bo'lsa - Avvalgi urinishlar tarixi (Akkordeon) */}
                      {card.previousAttempts.length > 0 && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedHistory((prev) => ({
                                ...prev,
                                [card.groupKey]: !prev[card.groupKey],
                              }))
                            }
                            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-bold text-slate-700 flex items-center justify-between transition-colors cursor-pointer border border-slate-200"
                          >
                            <span className="flex items-center gap-2">
                              <History className="w-4 h-4 text-purple-600" />
                              <span>Avvalgi urinishlar tarixi ({card.previousAttempts.length} ta eski versiya)</span>
                            </span>
                            {expandedHistory[card.groupKey] ? (
                              <ChevronUp className="w-4 h-4 text-slate-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            )}
                          </button>

                          {expandedHistory[card.groupKey] && (
                            <div className="mt-2.5 space-y-3 p-3.5 bg-slate-100/70 rounded-2xl border border-slate-200 animate-fade-in">
                              {card.previousAttempts.map((prevAtt, prevIdx) => {
                                const prevImages =
                                  prevAtt.imageUrls && prevAtt.imageUrls.length > 0
                                    ? prevAtt.imageUrls
                                    : prevAtt.imageUrl
                                    ? [prevAtt.imageUrl]
                                    : [];

                                return (
                                  <div
                                    key={prevAtt.id}
                                    className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 shadow-2xs"
                                  >
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-bold text-slate-700">
                                        {card.totalAttempts - 1 - prevIdx}-urinish
                                      </span>
                                      <span className="text-[11px] text-slate-400">
                                        {new Date(prevAtt.submittedAt).toLocaleString("uz-UZ")}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {getStatusBadge(prevAtt.status)}
                                      {prevAtt.comment?.feedbackText && (
                                        <span className="text-xs text-slate-600 italic">
                                          &ldquo;{prevAtt.comment.feedbackText}&rdquo;
                                        </span>
                                      )}
                                    </div>
                                    {prevImages.length > 0 && (
                                      <ImageCarousel
                                        images={prevImages}
                                        title={`${card.studentName} (${card.totalAttempts - 1 - prevIdx}-urinish)`}
                                        maxHeightClass="h-40 sm:h-48"
                                        onZoom={(imgIdx) =>
                                          setZoomModal({
                                            images: prevImages,
                                            index: imgIdx,
                                            title: `${card.studentName} (${card.totalAttempts - 1 - prevIdx}-urinish)`,
                                          })
                                        }
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Review & Verdict Form */}
                    <div className="lg:col-span-6 flex flex-col justify-between bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          O&apos;qituvchi Sharhi va Izohi:
                        </label>
                        <textarea
                          rows={4}
                          value={draft.feedbackText}
                          onChange={(e) =>
                            setReviewDrafts((prev) => ({
                              ...prev,
                              [sub.id]: { ...draft, feedbackText: e.target.value },
                            }))
                          }
                          placeholder="Koddagi kamchiliklar, xatolar yoki maqtovlarni yozing..."
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                        />
                      </div>

                      {/* Verdict Selector Buttons */}
                      <div className="space-y-2">
                        <div className="text-[11px] font-semibold text-slate-500">Baholash natijasi:</div>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setReviewDrafts((prev) => ({
                                ...prev,
                                [sub.id]: { ...draft, verdict: "CORRECT" },
                              }))
                            }
                            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                              draft.verdict === "CORRECT"
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>To&apos;g&apos;ri</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setReviewDrafts((prev) => ({
                                ...prev,
                                [sub.id]: { ...draft, verdict: "INCORRECT" },
                              }))
                            }
                            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                              draft.verdict === "INCORRECT"
                                ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                                : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
                            }`}
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Xato</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setReviewDrafts((prev) => ({
                                ...prev,
                                [sub.id]: { ...draft, verdict: "RETRY" },
                              }))
                            }
                            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                              draft.verdict === "RETRY"
                                ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                : "bg-white text-amber-700 border-amber-200 hover:bg-amber-50"
                            }`}
                          >
                            <AlertTriangle className="w-4 h-4" />
                            <span>Qayta</span>
                          </button>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          disabled={draft.saving}
                          onClick={() => handleSaveReview(sub.id)}
                          className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {draft.saving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Bahoni saqlash va talabaga yuborish</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
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
