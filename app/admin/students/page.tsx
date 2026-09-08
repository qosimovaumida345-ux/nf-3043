"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  ArrowLeft,
  KeyRound,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Layers,
  FolderPlus,
  Pencil,
  Eye,
  EyeOff,
  Copy,
  Check,
  X,
} from "lucide-react";

interface Group {
  id: string;
  name: string;
  description?: string | null;
  studentCount?: number;
  createdAt: string;
}

interface Student {
  id: string;
  username: string;
  fullName: string;
  groupId?: string | null;
  groupName?: string | null;
  isActive: boolean;
  createdAt: string;
  initialPassword?: string | null;
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"STUDENTS" | "GROUPS">("STUDENTS");
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Student Form state
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [studentGroup, setStudentGroup] = useState("");
  const [submittingStudent, setSubmittingStudent] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [studentSuccess, setStudentSuccess] = useState<string | null>(null);

  // Group Form state
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [submittingGroup, setSubmittingGroup] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [groupSuccess, setGroupSuccess] = useState<string | null>(null);

  // Password visibility & clipboard state
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit Student Modal state
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editGroupId, setEditGroupId] = useState("");
  const [editNewPassword, setEditNewPassword] = useState("");
  const [savingEditStudent, setSavingEditStudent] = useState(false);
  const [editStudentError, setEditStudentError] = useState<string | null>(null);

  // Edit Group Modal state
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupDesc, setEditGroupDesc] = useState("");
  const [savingEditGroup, setSavingEditGroup] = useState(false);
  const [editGroupError, setEditGroupError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stRes, grpRes] = await Promise.all([
        fetch("/api/admin/students"),
        fetch("/api/admin/groups"),
      ]);

      if (stRes.ok) {
        const stData = await stRes.json();
        setStudents(stData.students || []);
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

  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$";
    let pass = "";
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const generateEditPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$";
    let pass = "";
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEditNewPassword(pass);
  };

  const toggleShowPassword = (id: string) => {
    setShowPassword((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError(null);
    setStudentSuccess(null);
    setSubmittingStudent(true);

    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          fullName,
          password,
          groupId: studentGroup || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Talaba yaratishda xatolik.");
      }

      setStudentSuccess(`✅ Yangi talaba hisobi yaratildi: login: ${username}, parol: ${password}`);
      setUsername("");
      setFullName("");
      setPassword("");
      setStudentGroup("");
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xatolik yuz berdi.";
      setStudentError(msg);
    } finally {
      setSubmittingStudent(false);
    }
  };

  const openEditStudent = (st: Student) => {
    setEditingStudent(st);
    setEditFullName(st.fullName);
    setEditUsername(st.username);
    setEditGroupId(st.groupId || "");
    setEditNewPassword("");
    setEditStudentError(null);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setEditStudentError(null);
    setSavingEditStudent(true);

    try {
      const payload: Record<string, unknown> = {
        fullName: editFullName,
        username: editUsername,
        groupId: editGroupId || null,
      };
      if (editNewPassword.trim()) {
        payload.password = editNewPassword.trim();
      }

      const res = await fetch(`/api/admin/students/${editingStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Talabani yangilashda xatolik yuz berdi.");
      }

      setEditingStudent(null);
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xatolik yuz berdi.";
      setEditStudentError(msg);
    } finally {
      setSavingEditStudent(false);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`Haqiqatan ham "${name}" talaba hisobini o'chirmoqchimisiz? Barcha topshiriqlari ham o'chiriladi.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/students/${id}`, { method: "DELETE" });
      if (res.ok) {
        setStudents((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert("Talabani o'chirib bo'lmadi.");
      }
    } catch {
      alert("Serverga ulanishda xatolik.");
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setGroupError(null);
    setGroupSuccess(null);
    setSubmittingGroup(true);

    try {
      const res = await fetch("/api/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName,
          description: groupDesc,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Guruh yaratishda xatolik.");
      }

      setGroupSuccess(`✅ "${groupName}" guruhi muvaffaqiyatli yaratildi!`);
      setGroupName("");
      setGroupDesc("");
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xatolik yuz berdi.";
      setGroupError(msg);
    } finally {
      setSubmittingGroup(false);
    }
  };

  const openEditGroup = (grp: Group) => {
    setEditingGroup(grp);
    setEditGroupName(grp.name);
    setEditGroupDesc(grp.description || "");
    setEditGroupError(null);
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;
    setEditGroupError(null);
    setSavingEditGroup(true);

    try {
      const res = await fetch(`/api/admin/groups/${editingGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editGroupName,
          description: editGroupDesc,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Guruhni yangilashda xatolik yuz berdi.");
      }

      setEditingGroup(null);
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xatolik yuz berdi.";
      setEditGroupError(msg);
    } finally {
      setSavingEditGroup(false);
    }
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    if (!confirm(`Haqiqatan ham "${name}" guruhini o'chirmoqchimisiz?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/groups/${id}`, { method: "DELETE" });
      if (res.ok) {
        setGroups((prev) => prev.filter((g) => g.id !== id));
      } else {
        alert("Guruhni o'chirib bo'lmadi.");
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
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-6 py-4">
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
                Sozlamalar va Boshqaruv
              </h1>
              <p className="text-xs text-slate-500 font-medium">Talabalar va Guruhlar</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/homeworks"
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-xs"
            >
              Uy Ishlari
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
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/80 border border-slate-200 max-w-fit shadow-xs">
          <button
            onClick={() => setActiveTab("STUDENTS")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "STUDENTS"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Talabalar ({students.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("GROUPS")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "GROUPS"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Guruhlar ({groups.length})</span>
          </button>
        </div>

        {/* TAB 1: TALABALAR BOSHQARUVI */}
        {activeTab === "STUDENTS" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Create Student Card (5 Columns) */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl p-6 bg-white/85 backdrop-blur-2xl border border-white/80 shadow-xl space-y-5 sticky top-24">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-base text-slate-900">Yangi Talaba Qo&apos;shish</h3>
                </div>

                {studentError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{studentError}</span>
                  </div>
                )}

                {studentSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs leading-relaxed flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{studentSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleCreateStudent} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      To&apos;liq Ismi (Familiya Ism)
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="masalan: Alisher Navoiy"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Login (Foydalanuvchi nomi)
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="masalan: alisher_dev"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  {/* Group Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Qaysi guruhga tegishli?
                    </label>
                    <select
                      value={studentGroup}
                      onChange={(e) => setStudentGroup(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="">Guruhsiz (Biriktirilmagan)</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Password with Generator */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Boshlang&apos;ich Parol
                      </label>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Avto Parol</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="masalan: Mars2026!"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all font-mono"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submittingStudent}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {submittingStudent ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Talaba hisobini yaratish</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Students List Table (7 Columns) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-fustat font-bold text-lg text-slate-900">
                    Mavjud Talabalar Ro&apos;yxati ({students.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Talabalarning login va parollarini istalgan payt ko&apos;rish va tahrirlash mumkin
                  </p>
                </div>
                <button
                  onClick={fetchData}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-colors"
                  title="Yangilash"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20 bg-white/50 rounded-3xl border border-slate-200">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-16 px-6 bg-white/60 rounded-3xl border border-dashed border-slate-300 space-y-2">
                  <Users className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-semibold text-slate-700">Hali talabalar mavjud emas</h4>
                  <p className="text-xs text-slate-400">Chapdagi forma orqali talaba qo&apos;shing.</p>
                </div>
              ) : (
                <div className="bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs">
                  <div className="divide-y divide-slate-100">
                    {students.map((st) => (
                      <div
                        key={st.id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 font-bold text-sm flex items-center justify-center shrink-0">
                            {st.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-slate-900">{st.fullName}</span>
                              {st.groupName ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  {st.groupName}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                                  Guruhsiz
                                </span>
                              )}
                            </div>

                            {/* Credentials info row */}
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                              <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <span className="text-slate-400">Login:</span>
                                <strong>@{st.username}</strong>
                                <button
                                  type="button"
                                  onClick={() => copyText(st.username, `user-${st.id}`)}
                                  className="text-slate-400 hover:text-slate-700 ml-1"
                                  title="Loginni nusxalash"
                                >
                                  {copiedId === `user-${st.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </span>

                              {st.initialPassword ? (
                                <span className="font-mono bg-amber-50 border border-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                                  <span className="text-amber-700 text-[11px] font-semibold">Parol:</span>
                                  <span className="font-bold">
                                    {showPassword[st.id] ? st.initialPassword : "••••••••"}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => toggleShowPassword(st.id)}
                                    className="text-amber-700 hover:text-amber-900"
                                    title={showPassword[st.id] ? "Yashirish" : "Parolni ko'rish"}
                                  >
                                    {showPassword[st.id] ? (
                                      <EyeOff className="w-3.5 h-3.5" />
                                    ) : (
                                      <Eye className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => copyText(st.initialPassword!, `pass-${st.id}`)}
                                    className="text-amber-700 hover:text-amber-900"
                                    title="Parolni nusxalash"
                                  >
                                    {copiedId === `pass-${st.id}` ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  Parol shifrlangan
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => openEditStudent(st)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-200"
                            title="Talabani tahrirlash"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(st.id, st.fullName)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Talabani o'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: GURUHLAR BOSHQARUVI */}
        {activeTab === "GROUPS" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Create Group Form (5 Columns) */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl p-6 bg-white/85 backdrop-blur-2xl border border-white/80 shadow-xl space-y-5 sticky top-24">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FolderPlus className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-base text-slate-900">Yangi Guruh Ochish</h3>
                </div>

                {groupError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{groupError}</span>
                  </div>
                )}

                {groupSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs leading-relaxed flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{groupSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleCreateGroup} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Guruh Nomi
                    </label>
                    <input
                      type="text"
                      required
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="masalan: Frontend-101 yoki Backend-Pro"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Guruh Tavsifi (Ixtiyoriy)
                    </label>
                    <textarea
                      rows={3}
                      value={groupDesc}
                      onChange={(e) => setGroupDesc(e.target.value)}
                      placeholder="masalan: Dushanba-Chorshanba-Juma soat 18:00 guruhi"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingGroup}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {submittingGroup ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <FolderPlus className="w-4 h-4" />
                        <span>Guruhni yaratish</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Groups List (7 Columns) */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-fustat font-bold text-lg text-slate-900">
                Mavjud Guruhlar ({groups.length})
              </h3>

              {loading ? (
                <div className="flex items-center justify-center py-20 bg-white/50 rounded-3xl border border-slate-200">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center py-16 px-6 bg-white/60 rounded-3xl border border-dashed border-slate-300 space-y-2">
                  <Layers className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-semibold text-slate-700">Hali guruhlar mavjud emas</h4>
                  <p className="text-xs text-slate-400">Chap tarafdagi shakl orqali birinchi guruhni yarating.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groups.map((grp) => (
                    <div
                      key={grp.id}
                      className="p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-slate-200/90 shadow-xs flex items-center justify-between hover:bg-slate-50/70 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">{grp.name}</h4>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {grp.studentCount || 0} ta talaba
                          </span>
                        </div>
                        {grp.description && (
                          <p className="text-xs text-slate-500 mt-1">{grp.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditGroup(grp)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-200"
                          title="Guruhni tahrirlash"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(grp.id, grp.name)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Guruhni o'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* EDIT STUDENT MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-blue-600">
                <Pencil className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900">Talaba ma&apos;lumotlarini tahrirlash</h3>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editStudentError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{editStudentError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  To&apos;liq Ismi
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Login (Username)
                </label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guruh
                </label>
                <select
                  value={editGroupId}
                  onChange={(e) => setEditGroupId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="">Guruhsiz</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Yangi Parol o&apos;rnatish (Ixtiyoriy)
                  </label>
                  <button
                    type="button"
                    onClick={generateEditPassword}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Tasodifiy</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  placeholder="Agar o'zgartirmoqchi bo'lmasangiz bo'sh qoldiring"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={savingEditStudent}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {savingEditStudent ? "Saqlanmoqda..." : "O'zgarishlarni saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT GROUP MODAL */}
      {editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-blue-600">
                <Pencil className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900">Guruhni tahrirlash</h3>
              </div>
              <button
                onClick={() => setEditingGroup(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editGroupError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{editGroupError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guruh Nomi
                </label>
                <input
                  type="text"
                  required
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guruh Tavsifi
                </label>
                <textarea
                  rows={3}
                  value={editGroupDesc}
                  onChange={(e) => setEditGroupDesc(e.target.value)}
                  placeholder="Guruh haqida ma'lumot"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={savingEditGroup}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {savingEditGroup ? "Saqlanmoqda..." : "O'zgarishlarni saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
