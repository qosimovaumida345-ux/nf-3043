"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, Trash2, Check, Volume2 } from "lucide-react";

interface VoiceFeedbackRecorderProps {
  initialVoiceUrl?: string | null;
  onVoiceRecorded: (voiceUrl: string | null) => void;
  disabled?: boolean;
}

export default function VoiceFeedbackRecorder({
  initialVoiceUrl,
  onVoiceRecorded,
  disabled = false,
}: VoiceFeedbackRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(initialVoiceUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (initialVoiceUrl) {
      setAudioUrl(initialVoiceUrl);
    }
  }, [initialVoiceUrl]);

  // Clean up
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        // Convert to base64 data URL
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setAudioUrl(base64Audio);
          onVoiceRecorded(base64Audio);
        };

        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Mikrofonni ochishda xatolik:", err);
      alert("Mikrofon ruxsati berilmadi yoki brauzer qo'llab-quvvatlamaydi.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handlePlayPause = () => {
    if (!audioUrl) return;

    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(audioUrl);
      audioPlayerRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleDeleteAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setAudioUrl(null);
    setIsPlaying(false);
    onVoiceRecorded(null);
  };

  return (
    <div className="flex items-center gap-2 p-2.5 bg-slate-100/90 rounded-xl border border-slate-200">
      {audioUrl ? (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={handlePlayPause}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                isPlaying
                  ? "bg-amber-600 text-white animate-pulse"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            <div className="flex items-center gap-1 text-xs text-slate-700 font-semibold">
              <Volume2 className="w-4 h-4 text-purple-600" />
              <span>Ovozli sharh saqlangan</span>
            </div>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={handleDeleteAudio}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Ovozni o'chirish"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : isRecording ? (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
            <span className="text-xs font-mono font-bold text-rose-600">
              00:{recordingTime < 10 ? `0${recordingTime}` : recordingTime} / 01:00
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Ovoz yozilmoqda...</span>
          </div>

          <button
            type="button"
            onClick={stopRecording}
            className="py-1 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>To&apos;xtatish</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-500 font-medium">Ovozli tushuntirish:</span>
          <button
            type="button"
            disabled={disabled}
            onClick={startRecording}
            className="py-1.5 px-3 rounded-lg bg-white hover:bg-slate-200/80 text-purple-700 hover:text-purple-800 border border-purple-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Mic className="w-3.5 h-3.5 text-purple-600" />
            <span>Ovoz Yozish</span>
          </button>
        </div>
      )}
    </div>
  );
}
