"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";

interface Sprint {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Completed" | "Planned";
}

interface Project {
  _id: string;
  name: string;
  color: string;
  status: "Active" | "On Hold" | "Completed";
  tasks?: Task[];
}

interface Task {
  _id: string;
  title: string;
  type?: string;
  status: string;
  timeValue: number;
  timeUnit: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sprintId = searchParams.get("sprint");

  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [aiSummary, setAiSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [includeAISummary, setIncludeAISummary] = useState(true);
  const [includeBlockerNotes, setIncludeBlockerNotes] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<"docx" | "pptx" | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStage, setDownloadStage] = useState("");

  // Chat state
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isChatLoading]);

  useEffect(() => {
    if (sprintId) fetchSprintData();
  }, [sprintId]);

  const fetchSprintData = async () => {
    try {
      const [sprintRes, projectsRes] = await Promise.all([
        fetch(`/api/sprints/${sprintId}`),
        fetch(`/api/projects?sprintId=${sprintId}`),
      ]);
      setSprint(await sprintRes.json());
      setProjects(await projectsRes.json());
    } catch (error) {
      console.error("Failed to fetch sprint data:", error);
    }
  };

  const handleGenerateSummary = async () => {
    if (!sprintId) return;
    setIsGenerating(true);
    try {
      const aiRes = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "docx", sprintId, generateOnly: true }),
      });
      if (!aiRes.ok) throw new Error("Failed to generate AI summary.");
      const aiContent = await aiRes.json();
      const summary =
        `${aiContent.sprintSummary || ""}\n\n` +
        `Velocity: ${aiContent.velocityNote || ""}\n\n` +
        `Highlights:\n${(aiContent.highlights || []).map((h: string) => `• ${h}`).join("\n")}\n\n` +
        `Recommendations:\n${(aiContent.recommendations || []).map((r: string) => `• ${r}`).join("\n")}`;
      setAiSummary(summary);
      setChatMessages([
        {
          role: "assistant",
          content: "Summary generated! Ask me to refine tone, add context, highlight specific projects, or adjust any section.",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("AI generation error:", error);
      alert("Failed to generate AI summary.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (format: "docx" | "pptx") => {
    if (!sprintId) return;
    setDownloadingFormat(format);
    setDownloadProgress(0);
    setDownloadStage("Initializing...");
    try {
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format, sprintId, stream: true,
          includeAISummary, includeBlockerNotes,
          aiSummary: includeAISummary ? aiSummary : undefined,
        }),
      });
      if (!response.ok) throw new Error("Failed to generate report");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let buffer = "";
      let fileData: string | null = null;
      let fileFormat: string | null = null;
      let filename: string | null = null;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "progress") { setDownloadProgress(data.percent); setDownloadStage(data.stage); }
              else if (data.type === "file") { fileData = data.data; fileFormat = data.format; filename = data.filename; }
            } catch {}
          }
        }
      }
      if (fileData && fileFormat && filename) {
        setDownloadStage("Downloading...");
        const byteCharacters = atob(fileData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
        const blob = new Blob([new Uint8Array(byteNumbers)], {
          type: fileFormat === "docx"
            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); window.URL.revokeObjectURL(url);
        setDownloadStage("Complete!"); setDownloadProgress(100);
        await new Promise((r) => setTimeout(r, 800));
      }
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setDownloadingFormat(null); setDownloadProgress(0); setDownloadStage("");
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !sprintId || !aiSummary) return;
    const userMessage = chatInput.trim();
    setChatInput("");
    setIsChatLoading(true);
    
    // Add user message to chat
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage, timestamp: new Date() }]);
    
    try {
      const response = await fetch("/api/chat-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sprintId,
          currentSummary: aiSummary,
          message: userMessage,
          conversationHistory: chatMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!response.ok) throw new Error("Failed to get response");
      const data = await response.json();
      
      // Apply the AI response directly to the center summary
      if (data.response) {
        setAiSummary(data.response);
      }
      
      // Show compact confirmation in chat
      setChatMessages((prev) => [...prev, {
        role: "assistant",
        content: "✓ I've updated the summary. Try these:",
        timestamp: new Date(),
      }]);
    } catch {
      setChatMessages((prev) => [...prev, {
        role: "assistant",
        content: "Sorry, I ran into an error. Please try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const wordCount = aiSummary.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#f0f2f7] flex flex-col">
      <Navbar variant="board" />

      {/* Three-panel layout */}
      <div className="flex flex-1 pt-16 h-screen overflow-hidden">

        {/* ── LEFT SIDEBAR ─────────────────────────────── */}
        <aside className="w-72 flex-shrink-0 flex flex-col bg-white border-r border-gray-100 overflow-y-auto">
          {/* Back + Sprint Header */}
          <div className="p-5 border-b border-gray-100">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back
            </button>
            <h1 className="font-manrope font-extrabold text-gray-900 text-lg leading-tight">
              Generate Report
            </h1>
            {sprint && (
              <>
                <p className="text-sm font-semibold text-indigo-600 mt-1">{sprint.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}
                </p>
              </>
            )}
          </div>

          {/* Generate Summary Button */}
          <div className="p-5 border-b border-gray-100">
            <button
              onClick={handleGenerateSummary}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-bold shadow-sm hover:shadow-md hover:from-indigo-700 hover:to-indigo-600 disabled:opacity-60 transition-all"
            >
              {isGenerating ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  Generating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  Generate AI Summary
                </>
              )}
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              Chat on the right to refine
            </p>
          </div>

          {/* Export Settings */}
          <div className="p-5 border-b border-gray-100 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Export Options</p>

            <Toggle
              label="Include AI Summary"
              description="Append generated summary"
              checked={includeAISummary}
              onChange={setIncludeAISummary}
            />
            <Toggle
              label="Include Blocker Notes"
              description="Detail stalled items"
              checked={includeBlockerNotes}
              onChange={setIncludeBlockerNotes}
            />
          </div>

          {/* Download Buttons */}
          <div className="p-5 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Download</p>

            <DownloadButton
              format="docx"
              label="Word Document"
              ext=".docx"
              icon="description"
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
              isActive={downloadingFormat === "docx"}
              isDisabled={downloadingFormat !== null}
              progress={downloadProgress}
              stage={downloadStage}
              onClick={() => handleDownload("docx")}
            />
            <DownloadButton
              format="pptx"
              label="Presentation"
              ext=".pptx"
              icon="present_to_all"
              iconColor="text-orange-500"
              iconBg="bg-orange-50"
              isActive={downloadingFormat === "pptx"}
              isDisabled={downloadingFormat !== null}
              progress={downloadProgress}
              stage={downloadStage}
              onClick={() => handleDownload("pptx")}
            />
          </div>

          {/* Footer */}
          <div className="mt-auto px-5 py-4 border-t border-gray-100">
            <p className="text-[10px] text-gray-300 font-medium">Sprint Logger © 2026</p>
          </div>
        </aside>

        {/* ── CENTER — SUMMARY EDITOR ───────────────────── */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#f5f6fa]">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-8 py-3 bg-white border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-sm text-teal-700" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
              </div>
              <span className="text-sm font-bold text-gray-700">AI Sprint Summary</span>
              <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-bold uppercase tracking-wider">
                AI Powered
              </span>
            </div>
            <div className="flex items-center gap-3">
              {aiSummary && (
                <span className="text-xs text-gray-400">{wordCount} words</span>
              )}
              {aiSummary && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                  Editable
                </span>
              )}
            </div>
          </div>

          {/* Summary Area */}
          <div className="flex-1 overflow-y-auto px-8 py-8">
            {isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-400">
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-indigo-600 animate-spin">progress_activity</span>
                </div>
                <p className="text-sm font-medium text-gray-500">Generating your AI summary...</p>
              </div>
            ) : aiSummary ? (
              <div className="max-w-2xl mx-auto">
                {/* Paper-style card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Card header */}
                  <div className="px-8 py-5 border-b border-gray-50 flex items-center justify-between">
                    <div>
                      <h2 className="font-manrope font-extrabold text-gray-900 text-lg">
                        {sprint?.name} — Sprint Report
                      </h2>
                      {sprint && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Click to edit</p>
                    </div>
                  </div>

                  {/* Editable content */}
                  <textarea
                    ref={textareaRef}
                    value={aiSummary}
                    onChange={(e) => setAiSummary(e.target.value)}
                    className="w-full px-8 py-6 text-sm leading-7 text-gray-700 bg-transparent border-none outline-none resize-none font-sans"
                    style={{ minHeight: "480px" }}
                    placeholder="Your AI summary will appear here after generation..."
                  />
                </div>
                <p className="text-center text-[11px] text-gray-400 mt-4">
                  You can edit directly, or use the chat to ask for changes →
                </p>
              </div>
            ) : (
              /* Empty state */
              <div className="h-full flex flex-col items-center justify-center gap-6 text-center">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-100 to-teal-50 flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-3xl text-indigo-400" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </div>
                <div>
                  <p className="font-manrope font-bold text-gray-700 text-lg">No summary yet</p>
                  <p className="text-sm text-gray-400 mt-1 max-w-xs">
                    Click <strong className="text-indigo-600">Generate AI Summary</strong> in the left panel to get started
                  </p>
                </div>
                <div className="flex items-center gap-6 text-xs text-gray-300">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Editable
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">chat</span>
                    Chat-driven
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">download</span>
                    Exportable
                  </span>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ── RIGHT SIDEBAR — CHAT ─────────────────────── */}
        <aside className="w-80 flex-shrink-0 flex flex-col bg-white border-l border-gray-100">
          {/* Chat header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-sm text-indigo-600" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
              </div>
              <span className="text-sm font-bold text-gray-800">Refine with AI</span>
            </div>
            {chatMessages.length > 0 && (
              <button
                onClick={() => setChatMessages([])}
                className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors font-medium"
              >
                Clear
              </button>
            )}
          </div>

          {/* Prompt chips */}
          {chatMessages.length === 0 && (
            <div className="px-4 pt-4 space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold px-1">Try asking</p>
              {[
                "Make the tone more executive-friendly",
                "Highlight risks and blockers",
                "Shorten to 3 bullet points",
                "Add a velocity trend note",
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => { setChatInput(chip); }}
                  className="w-full text-left text-xs text-gray-600 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-100 hover:border-indigo-200 rounded-lg px-3 py-2 transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Dynamic suggestions after AI response */}
          {chatMessages.length > 0 && chatMessages[chatMessages.length - 1]?.role === "assistant" && (
            <div className="px-4 pb-2 space-y-2">
              {[
                "Make it more concise",
                "Add specific project details",
                "Emphasize team achievements",
                "Rewrite as bullet points",
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => { setChatInput(chip); }}
                  className="w-full text-left text-xs text-gray-600 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-100 hover:border-indigo-200 rounded-lg px-3 py-2 transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
          >
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-gray-50 text-gray-700 border border-gray-100 rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.timestamp && (
                    <p className={`text-[9px] mt-1.5 ${msg.role === "user" ? "text-indigo-200" : "text-gray-400"}`}>
                      {msg.timestamp.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-100">
            {!aiSummary && (
              <p className="text-[10px] text-gray-400 text-center mb-2">
                Generate a summary first to start chatting
              </p>
            )}
            <div className="flex gap-2 items-end">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChat();
                  }
                }}
                placeholder={aiSummary ? "Ask me to refine the summary..." : "Generate summary first..."}
                disabled={isChatLoading || !aiSummary}
                rows={2}
                className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 disabled:opacity-50 resize-none transition-all leading-relaxed"
              />
              <button
                onClick={handleSendChat}
                disabled={isChatLoading || !chatInput.trim() || !aiSummary}
                className="flex-shrink-0 w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isChatLoading ? (
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">send</span>
                )}
              </button>
            </div>
            <p className="text-[9px] text-gray-300 mt-1.5 text-center">
              Enter to send · Shift+Enter for newline
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function Toggle({
  label, description, checked, onChange,
}: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-semibold text-gray-800">{label}</p>
        <p className="text-[10px] text-gray-400">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
        <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
      </label>
    </div>
  );
}

function DownloadButton({
  label, ext, icon, iconColor, iconBg,
  isActive, isDisabled, progress, stage, onClick,
}: {
  format: string; label: string; ext: string; icon: string;
  iconColor: string; iconBg: string;
  isActive: boolean; isDisabled: boolean; progress: number; stage: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
        isActive
          ? "border-indigo-300 bg-indigo-50"
          : "border-gray-100 bg-gray-50 hover:border-indigo-200 hover:bg-indigo-50/40"
      } disabled:cursor-not-allowed`}
    >
      {isActive ? (
        <div className="relative w-9 h-9 flex-shrink-0">
          <svg className="w-9 h-9 transform -rotate-90">
            <circle cx="18" cy="18" r="14" stroke="currentColor" strokeWidth="3" fill="none" className="text-indigo-100" />
            <circle
              cx="18" cy="18" r="14"
              stroke="currentColor" strokeWidth="3" fill="none"
              strokeDasharray={2 * Math.PI * 14}
              strokeDashoffset={2 * Math.PI * 14 * (1 - progress / 100)}
              strokeLinecap="round"
              className="text-indigo-600 transition-all duration-300 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[9px] font-bold text-indigo-600">{Math.round(progress)}%</span>
          </div>
        </div>
      ) : (
        <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <span className={`material-symbols-outlined text-lg ${iconColor}`}>{icon}</span>
        </div>
      )}
      <div className="text-left">
        <p className={`text-xs font-bold ${isActive ? "text-indigo-700" : "text-gray-800"}`}>
          {isActive ? stage || "Generating..." : label}
        </p>
        <p className="text-[10px] text-gray-400">{ext}</p>
      </div>
    </button>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f0f2f7] flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-indigo-600 animate-spin">progress_activity</span>
          <p className="mt-4 text-gray-600 font-medium">Loading report...</p>
        </div>
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}