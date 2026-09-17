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
  UserX,
  BookOpen,
  Settings,
  Volume2,
  History,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Check,
  Search,
  Copy,
  Layers,
  Sparkles,
  Play,
  GitCompare,
  Mic,
  Download,
  Cpu,
  Zap,
  Code2,
  Trash2,
  Edit3,
  CheckCheck,
} from "lucide-react";
import EnhancedZoomModal from "@/components/EnhancedZoomModal";
import AIReviewModal from "@/components/AIReviewModal";
import CodeSandboxModal from "@/components/CodeSandboxModal";
import DiffViewerModal from "@/components/DiffViewerModal";
import AIModelManagerModal from "@/components/AIModelManagerModal";
import VoiceFeedbackRecorder from "@/components/VoiceFeedbackRecorder";
import { AIReviewResult } from "@/lib/openrouter";

interface Submission {
  id: string;
  homeworkId?: string | null;
  homeworkTitle?: string | null;
  studentId: string;
  studentName: string;
  studentUsername: string;
  studentGroupId?: string | null;
  studentGroupName?: string | null;
  imageUrl: string;
  imageUrls?: string[] | string | null;
  codeSnippet?: string | null;
  taskTitle: string;
  status: "PENDING" | "CORRECT" | "INCORRECT" | "RETRY";
  submittedAt: string;
  comment?: {
    id: string;
    feedbackText: string;
    voiceUrl?: string | null;
    verdict: string;
    createdAt: string;
  } | null;
}

interface StudentOption {
  id: string;
  username: string;
  fullName: string;
  groupId?: string | null;
  groupName?: string | null;
  initialPassword?: string | null;
  isActive?: boolean;
}

interface GroupOption {
  id: string;
  name: string;
  description?: string | null;
  studentCount?: number;
}

interface HomeworkOption {
  id: string;
  title: string;
  description?: string | null;
  groupId?: string | null;
  groupName?: string | null;
  deadline?: string | null;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; username: string; role: string; fullName: string } | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [homeworks, setHomeworks] = useState<HomeworkOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtrlar va Tablar
  // "PENDING": Tekshirish kutilayotganlar (birlamchi)
  // "CORRECT": Bajarilgan va to'g'ri deb qabul qilinganlar
  // "RETRY_INCORRECT": Xato yoki qayta topshirish so'ralganlar
  // "ALL_SUBMITTED": Barcha yuklanganlar
  // "NOT_SUBMITTED": Topshirmaganlar
  const [activeTab, setActiveTab] = useState<
    "PENDING" | "CORRECT" | "RETRY_INCORRECT" | "ALL_SUBMITTED" | "NOT_SUBMITTED"
  >("PENDING");
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");
  const [selectedHomework, setSelectedHomework] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedStudent, setSelectedStudent] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Tahrirlanayotgan sharh ID si (avval tekshirilgan topshiriqni qayta tahrirlash uchun)
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  // Muvaffaqiyatli saqlanganlik bildirishnomasi ID si
  const [saveSuccessId, setSaveSuccessId] = useState<string | null>(null);

  // O'chirish modali va yuklanish holati
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    subId: string;
    studentName: string;
    taskTitle: string;
  } | null>(null);
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null);

  // Sharh draftlari: [submissionId]: { feedbackText, verdict, isSaving }
  const [reviewDrafts, setReviewDrafts] = useState<
    Record<string, { feedbackText: string; verdict: "CORRECT" | "INCORRECT" | "RETRY"; saving?: boolean }>
  >({});

  const [sseConnected, setSseConnected] = useState(false);

  // Eski urinishlar tarixi (Akkordeon)
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});

  // Kattalashtirish (Zoom) Modali
  const [zoomModal, setZoomModal] = useState<{
    images: string[];
    index: number;
    title?: string;
  } | null>(null);

  // Nusxa olinganlik xabari
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // OpenRouter AI & Yangi Imkoniyatlar State lari
  const [currentAIModel, setCurrentAIModel] = useState<string>("inclusionai/ling-3.0-flash-vl:free");
  const [aiModelModalOpen, setAiModelModalOpen] = useState(false);

  // AI Review Modal
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiReview, setAiReview] = useState<AIReviewResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiActiveSubId, setAiActiveSubId] = useState<string | null>(null);
  const [aiStudentName, setAiStudentName] = useState("");
  const [aiTaskTitle, setAiTaskTitle] = useState("");

  // Live Code Sandbox Modal
  const [sandboxModalOpen, setSandboxModalOpen] = useState(false);
  const [sandboxCode, setSandboxCode] = useState("");
  const [sandboxTitle, setSandboxTitle] = useState("Live Kod Sandbox");

  // Diff Viewer Modal
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [diffStudentName, setDiffStudentName] = useState("");
  const [diffTaskTitle, setDiffTaskTitle] = useState("");
  const [diffCurrentAttempt, setDiffCurrentAttempt] = useState<any>(null);
  const [diffPreviousAttempts, setDiffPreviousAttempts] = useState<any[]>([]);

  // Ovozli sharhlar (voiceNotes): [submissionId]: audioBase64String | null
  const [voiceNotes, setVoiceNotes] = useState<Record<string, string | null>>({});

  // OCR yuklanish holati: [submissionId]: boolean
  const [ocrLoading, setOcrLoading] = useState<Record<string, boolean>>({});

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
      const [meRes, subRes, stRes, grpRes, hwRes] = await Promise.all([
        fetch("/api/auth/me", { cache: "no-store" }),
        fetch("/api/submissions", { cache: "no-store" }),
        fetch("/api/admin/students", { cache: "no-store" }),
        fetch("/api/admin/groups", { cache: "no-store" }),
        fetch("/api/homeworks", { cache: "no-store" }),
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

      if (!subRes.ok && subRes.status === 401) {
        window.location.replace("/login");
        return;
      }
      const subData = await subRes.json();
      setSubmissions(subData.submissions || []);

      const drafts: typeof reviewDrafts = {};
      subData.submissions?.forEach((s: Submission) => {
        drafts[s.id] = {
          feedbackText: s.comment?.feedbackText || "",
          verdict: (s.comment?.verdict as "CORRECT" | "INCORRECT" | "RETRY") || "CORRECT",
        };
      });
      setReviewDrafts(drafts);

      if (stRes.ok) {
        const stData = await stRes.json();
        setStudents(stData.students || []);
      }

      if (grpRes.ok) {
        const grpData = await grpRes.json();
        setGroups(grpData.groups || []);
      }

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

  // Real-time SSE ulanishi
  const setupSSE = () => {
    try {
      const eventSource = new EventSource("/api/admin/notifications/stream");

      eventSource.onopen = () => {
        setSseConnected(true);
      };

      eventSource.addEventListener("new-submission", (event) => {
        const payload = JSON.parse(event.data);

        let incomingUrls: string[] = [];
        if (Array.isArray(payload.imageUrls) && payload.imageUrls.length > 0) {
          incomingUrls = payload.imageUrls;
        } else if (payload.imageUrl) {
          incomingUrls = [payload.imageUrl];
        }

        setSubmissions((prev) => [
          {
            id: payload.submissionId,
            homeworkId: payload.homeworkId || null,
            homeworkTitle: payload.taskTitle,
            studentId: payload.studentId,
            studentName: payload.studentName,
            studentUsername: payload.studentId,
            imageUrl: incomingUrls[0] || payload.imageUrl,
            imageUrls: incomingUrls,
            taskTitle: payload.taskTitle,
            status: "PENDING",
            submittedAt: payload.submittedAt,
            comment: null,
          },
          ...prev,
        ]);

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
    const voiceUrl = voiceNotes[submissionId];

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
          voiceUrl: voiceUrl !== undefined ? voiceUrl : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Sharhni saqlab bo'lmadi.");
      }

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? {
                ...s,
                status: verdict,
                comment: {
                  id: s.comment?.id || "temp",
                  feedbackText,
                  voiceUrl: voiceUrl !== undefined ? voiceUrl : s.comment?.voiceUrl,
                  verdict,
                  createdAt: new Date().toISOString(),
                },
              }
            : s
        )
      );

      // Tahrirlash rejimini yopish va muvaffaqiyat belgisini yoqish
      setEditingReviewId(null);
      setSaveSuccessId(submissionId);
      setTimeout(() => setSaveSuccessId(null), 3500);
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

  // Topshiriqni o'chirish (DELETE)
  const handleDeleteSubmission = async (submissionId: string) => {
    setDeletingSubId(submissionId);
    try {
      const res = await fetch(`/api/submissions/${submissionId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Topshiriqni o'chirishda xatolik yuz berdi.");
      }

      // Lokal ro'yxatdan tozalash
      setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
      setReviewDrafts((prev) => {
        const copy = { ...prev };
        delete copy[submissionId];
        return copy;
      });
      setVoiceNotes((prev) => {
        const copy = { ...prev };
        delete copy[submissionId];
        return copy;
      });
      setConfirmDeleteModal(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Topshiriqni o'chirib bo'lmadi.";
      alert(msg);
    } finally {
      setDeletingSubId(null);
    }
  };

  // 1. AI bilan tekshirish (OpenRouter Vision / Text)
  const handleAICheck = async (sub: Submission, card: any) => {
    setAiActiveSubId(sub.id);
    setAiStudentName(card.studentName);
    setAiTaskTitle(card.taskTitle);
    setAiReview(null);
    setAiLoading(true);
    setAiModalOpen(true);

    try {
      const res = await fetch("/api/ai/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrls: card.images,
          codeSnippet: sub.codeSnippet,
          taskTitle: card.taskTitle,
          studentName: card.studentName,
          model: currentAIModel,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "AI tahlilida xatolik yuz berdi.");
      }

      setAiReview(data.review);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "AI bilan bog'lanishda xatolik";
      alert(msg);
      setAiModalOpen(false);
    } finally {
      setAiLoading(false);
    }
  };

  // AI sharhini formaga qo'yish
  const handleApplyFeedbackFromAI = (
    feedbackText: string,
    verdict: "CORRECT" | "INCORRECT" | "RETRY"
  ) => {
    if (!aiActiveSubId) return;
    setReviewDrafts((prev) => ({
      ...prev,
      [aiActiveSubId]: {
        ...prev[aiActiveSubId],
        feedbackText,
        verdict,
      },
    }));
  };

  // 2. OCR - Skrinshotdan kodni ajratish
  const handleOCR = async (sub: Submission, card: any) => {
    setOcrLoading((prev) => ({ ...prev, [sub.id]: true }));
    try {
      const res = await fetch("/api/ai/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrls: card.images,
          model: currentAIModel,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Kodni ajratishda xatolik yuz berdi.");
      }

      setSandboxCode(data.result.code);
      setSandboxTitle(`${card.studentName} — Ajratilgan Kod (${data.result.language})`);
      setSandboxModalOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "OCR da xatolik";
      alert(msg);
    } finally {
      setOcrLoading((prev) => ({ ...prev, [sub.id]: false }));
    }
  };

  // 3. Diff Viewer - Eski va yangi urinishlarni solishtirish
  const handleOpenDiff = (card: any) => {
    setDiffStudentName(card.studentName);
    setDiffTaskTitle(card.taskTitle);
    setDiffCurrentAttempt({
      id: card.latest.id,
      submittedAt: card.latest.submittedAt,
      status: card.latest.status,
      imageUrls: card.images,
      comment: card.latest.comment,
    });

    const parsedPrev = card.previousAttempts.map((att: any) => {
      let pImgs: string[] = [];
      if (Array.isArray(att.imageUrls)) pImgs = att.imageUrls;
      else if (typeof att.imageUrls === "string" && att.imageUrls.trim()) {
        try {
          const parsed = JSON.parse(att.imageUrls);
          if (Array.isArray(parsed)) pImgs = parsed;
        } catch {
          pImgs = [];
        }
      }
      if (pImgs.length === 0 && att.imageUrl) pImgs = [att.imageUrl];

      return {
        id: att.id,
        submittedAt: att.submittedAt,
        status: att.status,
        imageUrls: pImgs,
        comment: att.comment,
      };
    });

    setDiffPreviousAttempts(parsedPrev);
    setDiffModalOpen(true);
  };

  // 4. Hisobotni CSV yuklab olish
  const handleDownloadReport = () => {
    const url = `/api/admin/reports?groupId=${encodeURIComponent(selectedGroup)}`;
    window.open(url, "_blank");
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.replace("/login");
    }
  };

  const handleCopyCredentials = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // 1. Talaba va uy ishi bo'yicha guruhlangan cardlar
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
    const sorted = [...subs].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
    const latest = sorted[0];
    const previousAttempts = sorted.slice(1);

    let latestImages: string[] = [];
    if (Array.isArray(latest.imageUrls) && latest.imageUrls.length > 0) {
      latestImages = latest.imageUrls;
    } else if (typeof latest.imageUrls === "string" && latest.imageUrls.trim()) {
      try {
        const parsed = JSON.parse(latest.imageUrls);
        if (Array.isArray(parsed)) latestImages = parsed;
      } catch {
        latestImages = [];
      }
    }
    if (latestImages.length === 0 && latest.imageUrl) {
      latestImages = [latest.imageUrl];
    }

    return {
      groupKey,
      submissionId: latest.id,
      homeworkId: latest.homeworkId,
      studentId: latest.studentId,
      studentName: latest.studentName,
      studentUsername: latest.studentUsername,
      studentGroupId: latest.studentGroupId,
      studentGroupName: latest.studentGroupName,
      taskTitle: latest.taskTitle || latest.homeworkTitle || "Uy ishi topshirig'i",
      latest,
      previousAttempts,
      totalAttempts: sorted.length,
      images: latestImages,
    };
  });

  // Tanlangan guruhdagi barcha o'quvchilar
  const currentGroupStudents = students.filter((st) => {
    if (selectedGroup !== "ALL" && st.groupId !== selectedGroup) return false;
    return true;
  });

  // Tanlangan guruhdagi faol uy ishlari
  const filteredHomeworks = homeworks.filter((hw) => {
    if (selectedGroup !== "ALL" && hw.groupId && hw.groupId !== selectedGroup) return false;
    return true;
  });

  // Topshirgan o'quvchilar ID lari
  const submittedStudentIds = new Set<string>();
  submissions.forEach((s) => {
    if (selectedHomework !== "ALL" && s.homeworkId !== selectedHomework) return;
    submittedStudentIds.add(s.studentId);
  });

  // 2. Guruh, uy ishi va qidiruv bo'yicha saralangan baza cardlar
  const baseCards = groupedCards.filter((card) => {
    // Guruh filtri
    if (selectedGroup !== "ALL") {
      const st = students.find((s) => s.id === card.studentId);
      const studentGroupId = card.studentGroupId || st?.groupId;
      if (studentGroupId !== selectedGroup) return false;
    }

    // Uy ishi filtri
    if (selectedHomework !== "ALL" && card.homeworkId !== selectedHomework) {
      return false;
    }

    // Talaba filtri
    if (selectedStudent !== "ALL" && card.studentId !== selectedStudent) {
      return false;
    }

    // Qidiruv so'zi
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = card.studentName.toLowerCase().includes(q);
      const matchUser = card.studentUsername.toLowerCase().includes(q);
      const matchTask = card.taskTitle.toLowerCase().includes(q);
      if (!matchName && !matchUser && !matchTask) return false;
    }

    return true;
  });

  // Holatlar bo'yicha hisoblangan toifalar
  const pendingCards = baseCards.filter((c) => c.latest.status === "PENDING");
  const correctCards = baseCards.filter((c) => c.latest.status === "CORRECT");
  const retryIncorrectCards = baseCards.filter(
    (c) => c.latest.status === "INCORRECT" || c.latest.status === "RETRY"
  );

  // 3. Topshirmagan o'quvchilar (YUKLAMAGANLAR)
  const unsubmittedStudents = currentGroupStudents.filter((st) => {
    // Talaba filtri
    if (selectedStudent !== "ALL" && st.id !== selectedStudent) return false;

    // Qidiruv so'zi
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = st.fullName.toLowerCase().includes(q);
      const matchUser = st.username.toLowerCase().includes(q);
      if (!matchName && !matchUser) return false;
    }

    return !submittedStudentIds.has(st.id);
  });

  // Hozirgi tanlangan tab bo'yicha ko'rsatiladigan topshiriqlar
  let filteredSubmittedCards = baseCards;
  if (activeTab === "PENDING") {
    filteredSubmittedCards = pendingCards;
  } else if (activeTab === "CORRECT") {
    filteredSubmittedCards = correctCards;
  } else if (activeTab === "RETRY_INCORRECT") {
    filteredSubmittedCards = retryIncorrectCards;
  } else if (activeTab === "ALL_SUBMITTED") {
    if (selectedStatus !== "ALL") {
      filteredSubmittedCards = baseCards.filter((c) => c.latest.status === selectedStatus);
    } else {
      filteredSubmittedCards = baseCards;
    }
  }

  // Guruhdagi talabalardan qanchasi topshirdi
  const groupSubmittedCount = currentGroupStudents.filter((st) => submittedStudentIds.has(st.id)).length;
  const groupUnsubmittedCount = currentGroupStudents.filter((st) => !submittedStudentIds.has(st.id)).length;

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
    <div className="relative min-h-screen bg-slate-50 text-slate-900 pb-24 overflow-x-hidden">
      {/* Dynamic Animated Ambient Background Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-120px] right-[-100px] w-[650px] h-[650px] rounded-full bg-gradient-to-br from-[#319AFF]/25 via-[#60B1FF]/20 to-transparent blur-[140px] animate-pulse" />
        <div className="absolute top-[25%] left-[-120px] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#5E0ED7]/20 via-purple-400/15 to-transparent blur-[150px]" />
        <div className="absolute bottom-[-100px] right-[25%] w-[650px] h-[650px] rounded-full bg-gradient-to-bl from-emerald-400/15 via-sky-400/20 to-transparent blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.07]" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 px-6 py-4 shadow-xs">
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
                <p className="text-xs text-slate-500 font-medium">Kod Tekshirish & Guruhlar Nazorati</p>
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

          <div className="flex items-center gap-2.5">
            {/* OpenRouter AI Model Switcher Button */}
            <button
              type="button"
              onClick={() => setAiModelModalOpen(true)}
              className="hidden lg:flex items-center gap-2 px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 rounded-xl transition-all shadow-xs cursor-pointer"
              title="OpenRouter bepul AI modellari"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-mono text-[11px] truncate max-w-[150px]">
                {currentAIModel.split("/")[1] || currentAIModel}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500 text-white font-bold">
                FREE
              </span>
            </button>

            {/* CSV Export Button */}
            <button
              type="button"
              onClick={handleDownloadReport}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-700 bg-white border border-slate-200 rounded-xl hover:bg-emerald-50 transition-all shadow-xs cursor-pointer"
              title="Topshiriqlar hisobotini Excel/CSV yuklab olish"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span className="hidden md:inline">CSV Hisobot</span>
            </button>

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
              <span>Guruhlar & O&apos;quvchilar</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* KPI Stats Bar: Guruh o'quvchilari, Kutilmoqda, Bajarilgan, Yuklamaganlar */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Guruhdagi jami talabalar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onClick={() => {
              setActiveTab("ALL_SUBMITTED");
              setSelectedStatus("ALL");
            }}
            className={`p-4 sm:p-5 rounded-2xl bg-white/85 backdrop-blur-xl border shadow-xs flex items-center justify-between hover:scale-[1.02] transition-transform cursor-pointer ${
              activeTab === "ALL_SUBMITTED" ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/40" : "border-white/90"
            }`}
          >
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {selectedGroup === "ALL" ? "Barcha O'quvchilar" : "Guruh O'quvchilari"}
              </div>
              <div className="text-2xl font-fustat font-bold text-slate-900 mt-1">
                {currentGroupStudents.length}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Ro&apos;yxatga olingan</div>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </motion.div>

          {/* KUTILMOQDA (Tekshirish kerak bo'lganlar - Birlamchi) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => {
              setActiveTab("PENDING");
              setSelectedStatus("ALL");
            }}
            className={`p-4 sm:p-5 rounded-2xl bg-white/85 backdrop-blur-xl border shadow-xs flex items-center justify-between hover:scale-[1.02] transition-transform cursor-pointer ${
              activeTab === "PENDING" ? "border-amber-500 ring-2 ring-amber-500/25 bg-amber-50/60" : "border-white/90"
            }`}
          >
            <div>
              <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
                🟡 Kutilmoqda
              </div>
              <div className="text-2xl font-fustat font-bold text-amber-700 mt-1">
                {pendingCards.length}
              </div>
              <div className="text-[10px] text-amber-600 mt-0.5 font-medium">Tekshirish kerak</div>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </motion.div>

          {/* BAJARILGAN / TO'G'RI QABUL */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => {
              setActiveTab("CORRECT");
              setSelectedStatus("ALL");
            }}
            className={`p-4 sm:p-5 rounded-2xl bg-white/85 backdrop-blur-xl border shadow-xs flex items-center justify-between hover:scale-[1.02] transition-transform cursor-pointer ${
              activeTab === "CORRECT" ? "border-emerald-500 ring-2 ring-emerald-500/25 bg-emerald-50/60" : "border-white/90"
            }`}
          >
            <div>
              <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                🟢 Bajarilgan
              </div>
              <div className="text-2xl font-fustat font-bold text-emerald-700 mt-1">
                {correctCards.length}
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">To&apos;g&apos;ri qabul</div>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </motion.div>

          {/* JAMI YUKLAGANLAR (Topshirganlar) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => {
              setActiveTab("ALL_SUBMITTED");
              setSelectedStatus("ALL");
            }}
            className={`p-4 sm:p-5 rounded-2xl bg-white/85 backdrop-blur-xl border shadow-xs flex items-center justify-between hover:scale-[1.02] transition-transform cursor-pointer ${
              activeTab === "ALL_SUBMITTED" ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50" : "border-white/90"
            }`}
          >
            <div>
              <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
                📋 Yuklaganlar
              </div>
              <div className="text-2xl font-fustat font-bold text-blue-700 mt-1">
                {groupSubmittedCount}
              </div>
              <div className="text-[10px] text-blue-600 mt-0.5 font-medium">Jami topshirgan</div>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-500/15 text-blue-600 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
          </motion.div>

          {/* YUKLAMAGANLAR (Topshirmaganlar) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            onClick={() => {
              setActiveTab("NOT_SUBMITTED");
            }}
            className={`p-4 sm:p-5 rounded-2xl bg-white/85 backdrop-blur-xl border shadow-xs flex items-center justify-between hover:scale-[1.02] transition-transform cursor-pointer col-span-2 sm:col-span-1 ${
              activeTab === "NOT_SUBMITTED" ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/50" : "border-white/90"
            }`}
          >
            <div>
              <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
                🔴 Yuklamaganlar
              </div>
              <div className="text-2xl font-fustat font-bold text-rose-700 mt-1">
                {groupUnsubmittedCount}
              </div>
              <div className="text-[10px] text-rose-600 mt-0.5 font-medium">Hali topshirmadi</div>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-rose-500/15 text-rose-600 flex items-center justify-center font-bold">
              <UserX className="w-5 h-5" />
            </div>
          </motion.div>
        </div>

        {/* FILTERS SECTION: Guruh, Uy ishi, Yuklagan/Yuklamagan, Status va Qidiruv */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Filter className="w-4 h-4 text-blue-600" />
              <span>Guruh va Topshirish Filtrlari:</span>
            </div>

            {/* Reset filters button */}
            {(selectedGroup !== "ALL" || selectedHomework !== "ALL" || activeTab !== "PENDING" || selectedStatus !== "ALL" || selectedStudent !== "ALL" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedGroup("ALL");
                  setSelectedHomework("ALL");
                  setActiveTab("PENDING");
                  setSelectedStatus("ALL");
                  setSelectedStudent("ALL");
                  setSearchQuery("");
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Filtrlarni tozalash</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Guruh tanlash filtri */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Guruh bo&apos;yicha:</span>
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => {
                  setSelectedGroup(e.target.value);
                  setSelectedStudent("ALL");
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="ALL">👥 Barcha guruhlar ({students.length} o&apos;quvchi)</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.studentCount || 0} ta o&apos;quvchi)
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Uy ishi tanlash filtri */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Uy ishi (Vazifa):</span>
              </label>
              <select
                value={selectedHomework}
                onChange={(e) => setSelectedHomework(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="ALL">📚 Barcha uy ishlari</option>
                {filteredHomeworks.map((hw) => (
                  <option key={hw.id} value={hw.id}>
                    {hw.title} {hw.groupName ? `(${hw.groupName})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. ASOSIY TOIFA TANLASH (Kutilmoqda, Bajarilgan, Barchasi, Yuklamaganlar) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tekshirish Bo&apos;limi:</span>
              </label>
              <select
                value={activeTab}
                onChange={(e) => {
                  setActiveTab(e.target.value as any);
                  setSelectedStatus("ALL");
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="PENDING">🟡 Tekshirish kerak — Kutilmoqda ({pendingCards.length} ta)</option>
                <option value="CORRECT">🟢 Bajarilgan — To&apos;g&apos;ri deb qabul qilingan ({correctCards.length} ta)</option>
                <option value="RETRY_INCORRECT">🟠 Xato yoki qayta topshirish ({retryIncorrectCards.length} ta)</option>
                <option value="ALL_SUBMITTED">📋 Barcha topshirganlar ({baseCards.length} ta)</option>
                <option value="NOT_SUBMITTED">🔴 Hali topshirmaganlar ({unsubmittedStudents.length} ta)</option>
              </select>
            </div>

            {/* 4. Tekshiruv statusi */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Natija filtri:</span>
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="ALL">📁 Barcha statuslar</option>
                <option value="PENDING">🟡 Faqat kutilayotganlar</option>
                <option value="CORRECT">🟢 To&apos;g&apos;ri deb baholanganlar</option>
                <option value="INCORRECT">🔴 Xato deb baholanganlar</option>
                <option value="RETRY">🟠 Qayta topshirish so&apos;ralganlar</option>
              </select>
            </div>
          </div>

          {/* Pastki qatordagi filtr: Aniq o'quvchi va Qidiruv qatori */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <div className="w-full sm:w-1/2">
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
              >
                <option value="ALL">👤 Aniq o&apos;quvchini tanlash (Barchasi)</option>
                {currentGroupStudents.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.fullName} (@{st.username}) {st.groupName ? `• ${st.groupName}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-1/2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ism, familiya, username yoki vazifa nomi bo'yicha qidirish..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Navigation Segment Tabs */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/60 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab("PENDING");
              setSelectedStatus("ALL");
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "PENDING"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-[1.02]"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Tekshirish kerak (Kutilmoqda)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === "PENDING" ? "bg-white/25 text-white" : "bg-amber-100 text-amber-800"
              }`}
            >
              {pendingCards.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("CORRECT");
              setSelectedStatus("ALL");
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "CORRECT"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-[1.02]"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Bajarilgan / Qabul Qilingan</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === "CORRECT" ? "bg-white/25 text-white" : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {correctCards.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("RETRY_INCORRECT");
              setSelectedStatus("ALL");
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "RETRY_INCORRECT"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/25 scale-[1.02]"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Xato / Qayta topshirish</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === "RETRY_INCORRECT" ? "bg-white/25 text-white" : "bg-rose-100 text-rose-800"
              }`}
            >
              {retryIncorrectCards.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("ALL_SUBMITTED");
              setSelectedStatus("ALL");
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "ALL_SUBMITTED"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/25 scale-[1.02]"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Barcha topshirganlar</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === "ALL_SUBMITTED" ? "bg-white/25 text-white" : "bg-blue-100 text-blue-800"
              }`}
            >
              {baseCards.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("NOT_SUBMITTED");
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "NOT_SUBMITTED"
                ? "bg-slate-800 text-white shadow-md shadow-slate-800/25 scale-[1.02]"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <UserX className="w-4 h-4" />
            <span>Topshirmaganlar</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === "NOT_SUBMITTED" ? "bg-white/25 text-white" : "bg-slate-300 text-slate-800"
              }`}
            >
              {unsubmittedStudents.length}
            </span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* YUKLAMAGANLAR BO'LIMI (Agar NOT_SUBMITTED bo'lsa) */}
        {/* ========================================================= */}
        {activeTab === "NOT_SUBMITTED" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <UserX className="w-4 h-4" />
                </div>
                <h3 className="font-fustat font-bold text-base text-slate-900">
                  🔴 Uy Ishini Yuklamagan O&apos;quvchilar:
                </h3>
                <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                  {unsubmittedStudents.length} ta o&apos;quvchi
                </span>
              </div>
              <span className="text-xs text-slate-400 hidden sm:inline">
                {selectedGroup === "ALL" ? "Barcha guruhlar bo'yicha" : "Tanlangan guruh bo'yicha"}
              </span>
            </div>

            {unsubmittedStudents.length === 0 ? (
              <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                <h4 className="text-sm font-bold text-emerald-900">
                  Ajoyib! Barcha o&apos;quvchilar uy ishini topshirgan!
                </h4>
                <p className="text-xs text-emerald-700">
                  Ushbu tanlov bo&apos;yicha birorta ham uy ishini yuklamagan talaba qolmadi.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {unsubmittedStudents.map((st) => (
                  <motion.div
                    key={st.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-white/95 border border-rose-200/80 shadow-xs hover:shadow-md hover:border-rose-300 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Top: Avatar, Name, Group */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                            {st.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 leading-snug">{st.fullName}</h4>
                            <div className="text-[11px] font-mono text-slate-400">@{st.username}</div>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                          <XCircle className="w-3 h-3 text-rose-500" />
                          Topshirmagan
                        </span>
                      </div>

                      {/* Details */}
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-400">Guruh:</span>
                          <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                            {st.groupName || "Guruh biriktirilmagan"}
                          </span>
                        </div>

                        {selectedHomework !== "ALL" && (
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="text-slate-400">Vazifa:</span>
                            <span className="font-semibold text-rose-700 text-[11px] truncate max-w-[180px]">
                              {homeworks.find((h) => h.id === selectedHomework)?.title || "Tanlangan vazifa"}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-400">Holat:</span>
                          <span className="text-[11px] text-amber-700 font-medium">Hali kod surati yuklamadi</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer with initial password & quick copy */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <div className="text-slate-400 flex items-center gap-1">
                        <span>Parol:</span>
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                          {st.initialPassword || st.username + "123"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleCopyCredentials(
                            `Login: ${st.username}\nParol: ${st.initialPassword || st.username + "123"}`,
                            st.id
                          )
                        }
                        className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedId === st.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Nusxalandi!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Loginni nusxalash</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* YUKLAGANLAR BO'LIMI (Agar NOT_SUBMITTED bo'lmasa) */}
        {/* ========================================================= */}
        {activeTab !== "NOT_SUBMITTED" && (
          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="font-fustat font-bold text-base text-slate-900">
                  🟢 Kod Yuklagan O&apos;quvchilar Topshiriqlari:
                </h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {filteredSubmittedCards.length} ta topshiriq
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24 bg-white/50 rounded-3xl border border-slate-200">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredSubmittedCards.length === 0 ? (
              <div className="text-center py-16 bg-white/60 rounded-3xl border border-dashed border-slate-300">
                <Radio className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-700">Topshiriqlar topilmadi</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Ushbu filtr bo&apos;yicha hali o&apos;quvchilar kod yuklamagan.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredSubmittedCards.map((card, idx) => {
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
                      transition={{ delay: 0.04 * idx, duration: 0.35 }}
                      className="rounded-3xl p-6 sm:p-7 bg-white/95 backdrop-blur-xl border border-white/90 shadow-sm hover:shadow-xl hover:border-blue-300/60 transition-all space-y-6"
                    >
                      {/* Top Bar: Talaba ma'lumotlari, guruh, urinishlar soni, vaqt, status */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base shadow-xs border border-blue-100">
                            {card.studentName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-sm sm:text-base text-slate-900">{card.studentName}</h4>
                              <span className="text-[11px] font-mono text-slate-400">@{card.studentUsername}</span>
                              {card.studentGroupName && (
                                <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md">
                                  {card.studentGroupName}
                                </span>
                              )}
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

                      {/* AI & Smart Tools Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-blue-50/90 border border-indigo-100 shadow-2xs">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* 1. AI Review Button */}
                          <button
                            type="button"
                            disabled={aiLoading && aiActiveSubId === sub.id}
                            onClick={() => handleAICheck(sub, card)}
                            className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
                          >
                            {aiLoading && aiActiveSubId === sub.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            )}
                            <span>🧠 AI Tekshirish</span>
                          </button>

                          {/* 2. OCR Code Extract Button */}
                          <button
                            type="button"
                            disabled={ocrLoading[sub.id]}
                            onClick={() => handleOCR(sub, card)}
                            className="py-2 px-3.5 rounded-xl bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                          >
                            {ocrLoading[sub.id] ? (
                              <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Zap className="w-3.5 h-3.5 text-amber-600" />
                            )}
                            <span>⚡ Kodni ajratish (OCR)</span>
                          </button>

                          {/* 3. Live Sandbox Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSandboxCode(sub.codeSnippet || "");
                              setSandboxTitle(`${card.studentName} — ${card.taskTitle}`);
                              setSandboxModalOpen(true);
                            }}
                            className="py-2 px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                          >
                            <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/30" />
                            <span>▶ Live Sandbox</span>
                          </button>
                        </div>

                        {/* 4. Diff Viewer (if previous attempts exist) */}
                        {card.previousAttempts.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleOpenDiff(card)}
                            className="py-2 px-3.5 rounded-xl bg-purple-100 hover:bg-purple-200/90 text-purple-900 border border-purple-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                          >
                            <GitCompare className="w-3.5 h-3.5 text-purple-600" />
                            <span>🔍 Versiyalar farqi (Diff - {card.previousAttempts.length} ta eski)</span>
                          </button>
                        )}
                      </div>

                      {/* Body: Chap tomonda BARCHA YUKLANGAN RASMLAR ALOHIDA-ALOHIDA KO'RINISHDA! */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Chap tomon: Barcha rasmlar alohida kartochkalar bo'lib ko'rinadi */}
                        <div className="lg:col-span-6 space-y-3">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                            <span className="flex items-center gap-1.5">
                              <ImageIcon className="w-4 h-4 text-blue-600" />
                              <span>Yuklangan fotosuratlar:</span>
                            </span>
                            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-0.5 rounded-full">
                              {card.images.length} ta rasm topshirilgan
                            </span>
                          </div>

                          {/* 1 ta rasm bo'lsa: Katta toza rasm */}
                          {card.images.length === 1 ? (
                            <div
                              onClick={() =>
                                setZoomModal({
                                  images: card.images,
                                  index: 0,
                                  title: `${card.studentName} - ${card.taskTitle}`,
                                })
                              }
                              className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden bg-slate-950/5 border border-slate-200 cursor-pointer group flex items-center justify-center p-2 shadow-xs hover:border-blue-500 hover:shadow-md transition-all"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={card.images[0]}
                                alt={`${card.studentName} kodi`}
                                className="w-full h-full object-contain group-hover:scale-[1.01] transition-transform duration-200"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-2 pointer-events-none rounded-2xl">
                                <Maximize2 className="w-4 h-4 text-blue-400" />
                                <span>Kattalashtirish (Zoom)</span>
                              </div>
                            </div>
                          ) : (
                            /* KO'P RASMLAR YUKLANGANDA: PASTIDA HAR BIRI ALOHIDA-ALOHIDA BO'LIB KO'RINADI! */
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {card.images.map((imgUrl, imgIdx) => (
                                  <div
                                    key={imgIdx}
                                    onClick={() =>
                                      setZoomModal({
                                        images: card.images,
                                        index: imgIdx,
                                        title: `${card.studentName} - ${card.taskTitle} (#${imgIdx + 1}-rasm)`,
                                      })
                                    }
                                    className="relative group rounded-2xl overflow-hidden bg-slate-950/5 border border-slate-200 hover:border-blue-500 cursor-pointer p-2 flex flex-col items-center justify-center shadow-2xs hover:shadow-md transition-all"
                                  >
                                    <div className="w-full h-48 sm:h-52 flex items-center justify-center overflow-hidden rounded-xl bg-slate-900/5">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={imgUrl}
                                        alt={`#${imgIdx + 1}-rasm`}
                                        className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-200"
                                        loading="lazy"
                                      />
                                    </div>

                                    {/* Rasm tartib raqami nishoni */}
                                    <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white text-[11px] font-bold border border-white/20 shadow-md">
                                      <ImageIcon className="w-3 h-3 text-blue-400" />
                                      <span>#{imgIdx + 1}-rasm</span>
                                    </div>

                                    {/* Zoom overlay */}
                                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5 pointer-events-none rounded-2xl">
                                      <Maximize2 className="w-4 h-4 text-blue-400" />
                                      <span>Zoom (#{imgIdx + 1})</span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Barcha rasmlarni bitta slayderda ko'rish imkoni */}
                              <button
                                type="button"
                                onClick={() =>
                                  setZoomModal({
                                    images: card.images,
                                    index: 0,
                                    title: `${card.studentName} - ${card.taskTitle}`,
                                  })
                                }
                                className="w-full py-2.5 px-4 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                                <span>Barcha {card.images.length} ta rasmni to&apos;liq ekranda ko&apos;rish (Zoom)</span>
                              </button>
                            </div>
                          )}

                          {/* Agar talaba avval ham topshirgan bo'lsa - Eski urinishlar tarixi */}
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
                                    let prevImages: string[] = [];
                                    if (Array.isArray(prevAtt.imageUrls) && prevAtt.imageUrls.length > 0) {
                                      prevImages = prevAtt.imageUrls;
                                    } else if (typeof prevAtt.imageUrls === "string" && prevAtt.imageUrls.trim()) {
                                      try {
                                        const p = JSON.parse(prevAtt.imageUrls);
                                        if (Array.isArray(p)) prevImages = p;
                                      } catch {
                                        prevImages = [];
                                      }
                                    }
                                    if (prevImages.length === 0 && prevAtt.imageUrl) {
                                      prevImages = [prevAtt.imageUrl];
                                    }

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
                                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                                            {prevImages.map((pImg, pIdx) => (
                                              <div
                                                key={pIdx}
                                                onClick={() =>
                                                  setZoomModal({
                                                    images: prevImages,
                                                    index: pIdx,
                                                    title: `${card.studentName} (${card.totalAttempts - 1 - prevIdx}-urinish)`,
                                                  })
                                                }
                                                className="relative h-28 rounded-lg overflow-hidden bg-slate-900/5 border border-slate-200 cursor-pointer group flex items-center justify-center p-1"
                                              >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                  src={pImg}
                                                  alt={`Eski rasm ${pIdx + 1}`}
                                                  className="w-full h-full object-contain"
                                                />
                                                <span className="absolute bottom-1 left-1 bg-black/65 text-white text-[9px] px-1 rounded font-bold">
                                                  #{pIdx + 1}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* O'ng tomon: Sharh va Baholash formasi / Natija kartochkasi */}
                        <div className="lg:col-span-6 flex flex-col justify-between bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                          {sub.status !== "PENDING" && editingReviewId !== sub.id ? (
                            /* ======================================================== */
                            /* 1. BAJARILGAN VA BAHOLANGAN NATIJA (O'qish rejimi)       */
                            /* ======================================================== */
                            <div className="flex flex-col justify-between h-full space-y-4">
                              <div className="space-y-3.5">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                                  <div className="flex items-center gap-2">
                                    <CheckCheck className="w-4 h-4 text-emerald-600" />
                                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                      Ustoz tekshiruvi natijasi
                                    </span>
                                  </div>
                                  {getStatusBadge(sub.status)}
                                </div>

                                {saveSuccessId === sub.id && (
                                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                                    <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Baholash muvaffaqiyatli saqlandi!</span>
                                  </div>
                                )}

                                {/* Matnli sharh */}
                                <div className="space-y-1">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Qoldirilgan izoh:
                                  </div>
                                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 font-medium leading-relaxed">
                                    {sub.comment?.feedbackText ? (
                                      <p className="whitespace-pre-line">{sub.comment.feedbackText}</p>
                                    ) : (
                                      <p className="italic text-slate-400">Matnli izoh kiritilmagan</p>
                                    )}
                                  </div>
                                </div>

                                {/* Ovozli sharh */}
                                {sub.comment?.voiceUrl && (
                                  <div className="space-y-1">
                                    <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                                      <Volume2 className="w-3 h-3 text-indigo-600" />
                                      <span>Ovozli tushuntirish:</span>
                                    </div>
                                    <div className="p-2.5 bg-white rounded-xl border border-indigo-100 shadow-2xs">
                                      <audio controls src={sub.comment.voiceUrl} className="w-full h-8" />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Amallar tugmalari: Tahrirlash va O'chirish */}
                              <div className="pt-3 border-t border-slate-200/70 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingReviewId(sub.id)}
                                  className="flex-1 py-2.5 px-3.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Sharhni tahrirlash</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmDeleteModal({
                                      subId: sub.id,
                                      studentName: card.studentName,
                                      taskTitle: card.taskTitle,
                                    })
                                  }
                                  className="py-2.5 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                  title="Ushbu topshiriqni o'chirish"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                  <span>O&apos;chirish</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* ======================================================== */
                            /* 2. TEKSHIRISH VA SHARH YOZISH FORMASI (Kutilmoqda/Edit)  */
                            /* ======================================================== */
                            <>
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    {editingReviewId === sub.id
                                      ? "✏️ Sharh va Bahoni Tahrirlash:"
                                      : "O'qituvchi Sharhi va Izohi:"}
                                  </label>
                                  {editingReviewId === sub.id && (
                                    <button
                                      type="button"
                                      onClick={() => setEditingReviewId(null)}
                                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                                    >
                                      Bekor qilish
                                    </button>
                                  )}
                                </div>
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

                                {/* Voice Feedback Recorder */}
                                <div className="mt-2.5">
                                  <VoiceFeedbackRecorder
                                    initialVoiceUrl={
                                      voiceNotes[sub.id] !== undefined ? voiceNotes[sub.id] : sub.comment?.voiceUrl
                                    }
                                    onVoiceRecorded={(url) => setVoiceNotes((prev) => ({ ...prev, [sub.id]: url }))}
                                    disabled={draft.saving}
                                  />
                                </div>
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
                                    className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                                      draft.verdict === "CORRECT"
                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]"
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
                                    className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                                      draft.verdict === "INCORRECT"
                                        ? "bg-rose-600 text-white border-rose-600 shadow-md scale-[1.02]"
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
                                    className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                                      draft.verdict === "RETRY"
                                        ? "bg-amber-600 text-white border-amber-600 shadow-md scale-[1.02]"
                                        : "bg-white text-amber-700 border-amber-200 hover:bg-amber-50"
                                    }`}
                                  >
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Qayta</span>
                                  </button>
                                </div>
                              </div>

                              {/* Submit Review & Delete Buttons */}
                              <div className="pt-2 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmDeleteModal({
                                      subId: sub.id,
                                      studentName: card.studentName,
                                      taskTitle: card.taskTitle,
                                    })
                                  }
                                  className="py-3 px-3.5 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-600 transition-all flex items-center justify-center cursor-pointer shadow-xs"
                                  title="Ushbu topshiriqni o'chirish"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  disabled={draft.saving}
                                  onClick={() => handleSaveReview(sub.id)}
                                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                  {draft.saving ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      <span>Saqlanmoqda...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-4 h-4" />
                                      <span>Sharhni Yuborish & Saqlash</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Enhanced Zoom Modal (1x - 3x kattalashtirish, harakatlanish va rasmlar almashinuvi) */}
      {zoomModal && (
        <EnhancedZoomModal
          images={zoomModal.images}
          initialIndex={zoomModal.index}
          title={zoomModal.title}
          onClose={() => setZoomModal(null)}
        />
      )}

      {/* AI Review Modal */}
      <AIReviewModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        review={aiReview}
        loading={aiLoading}
        studentName={aiStudentName}
        taskTitle={aiTaskTitle}
        onApplyFeedback={handleApplyFeedbackFromAI}
        onOpenSandbox={(code) => {
          setSandboxCode(code);
          setSandboxTitle(`${aiStudentName} — Kod Sandbox`);
          setSandboxModalOpen(true);
        }}
      />

      {/* Code Sandbox Modal */}
      <CodeSandboxModal
        isOpen={sandboxModalOpen}
        onClose={() => setSandboxModalOpen(false)}
        initialCode={sandboxCode}
        title={sandboxTitle}
      />

      {/* Diff Viewer Modal */}
      {diffCurrentAttempt && (
        <DiffViewerModal
          isOpen={diffModalOpen}
          onClose={() => setDiffModalOpen(false)}
          studentName={diffStudentName}
          taskTitle={diffTaskTitle}
          currentAttempt={diffCurrentAttempt}
          previousAttempts={diffPreviousAttempts}
        />
      )}

      {/* OpenRouter AI Model Manager Modal */}
      <AIModelManagerModal
        isOpen={aiModelModalOpen}
        onClose={() => setAiModelModalOpen(false)}
        currentModel={currentAIModel}
        onSelectModel={(m) => {
          setCurrentAIModel(m);
          setAiModelModalOpen(false);
        }}
      />

      {/* Topshiriqni o'chirishni tasdiqlash modali */}
      <AnimatePresence>
        {confirmDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-rose-100 space-y-5"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-fustat font-bold text-lg text-slate-900">
                  Topshiriqni o&apos;chirishni tasdiqlaysizmi?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  <span className="font-bold text-slate-800">{confirmDeleteModal.studentName}</span> ning{" "}
                  <span className="font-bold text-slate-800">«{confirmDeleteModal.taskTitle}»</span> topshirig&apos;i va unga tegishli barcha sharhlar o&apos;chiriladi. O&apos;quvchi uy ishini qaytadan topshirish imkoniyatiga ega bo&apos;ladi.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={Boolean(deletingSubId)}
                  onClick={() => setConfirmDeleteModal(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  disabled={Boolean(deletingSubId)}
                  onClick={() => handleDeleteSubmission(confirmDeleteModal.subId)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {deletingSubId ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>O&apos;chirilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Ha, o&apos;chirilsin</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
