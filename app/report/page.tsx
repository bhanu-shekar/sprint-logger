"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import Button from "../components/Button";

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

  useEffect(() => {
    if (sprintId) {
      fetchSprintData();
    }
  }, [sprintId]);

  const fetchSprintData = async () => {
    try {
      const [sprintRes, projectsRes] = await Promise.all([
        fetch(`/api/sprints/${sprintId}`),
        fetch(`/api/projects?sprintId=${sprintId}`),
      ]);
      const sprintData = await sprintRes.json();
      const projectsData = await projectsRes.json();
      setSprint(sprintData);
      setProjects(projectsData);
    } catch (error) {
      console.error("Failed to fetch sprint data:", error);
    }
  };

  const handleGenerateSummary = async () => {
    if (!sprintId) return;
    
    setIsGenerating(true);
    try {
      // Fetch sprint data
      const [sprintRes, projectsRes] = await Promise.all([
        fetch(`/api/sprints/${sprintId}`),
        fetch(`/api/projects?sprintId=${sprintId}`),
      ]);
      
      const sprint = await sprintRes.json();
      const projects = await projectsRes.json();
      
      // Fetch tasks for each project
      const tasksRes = await fetch(`/api/tasks?sprintId=${sprintId}`);
      const tasks = await tasksRes.json();
      
      // Fetch members
      const membersRes = await fetch("/api/members");
      const members = await membersRes.json();
      
      // Shape data for AI
      const sprintData = {
        sprintName: sprint.name,
        startDate: new Date(sprint.startDate).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        endDate: new Date(sprint.endDate).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t: any) => t.status === "Done").length,
        inProgressTasks: tasks.filter((t: any) => t.status === "In Progress").length,
        todoTasks: tasks.filter((t: any) => t.status === "To Do" || t.status === "Review").length,
        projects: projects.map((p: any) => ({
          name: p.name,
          status: p.status,
          tasks: tasks
            .filter((t: any) => t.projectId?.toString() === p._id.toString())
            .map((t: any) => ({
              title: t.title,
              type: t.type,
              status: t.status,
              timeValue: t.timeValue,
              timeUnit: t.timeUnit,
              assignees: (t.assigneeIds || []).map((a: any) => a.name),
            })),
        })),
        memberWorkload: members.map((m: any) => {
          const memberTasks = tasks.filter((t: any) =>
            (t.assigneeIds || []).some((a: any) => a._id?.toString() === m._id.toString())
          );
          const totalHours = memberTasks.reduce((sum: number, t: any) => {
            return sum + (t.timeUnit === "d" ? t.timeValue * 8 : t.timeValue);
          }, 0);
          return {
            name: m.name,
            role: m.role,
            taskCount: memberTasks.length,
            totalHours,
          };
        }),
      };
      
      // Call AI report API
      const aiRes = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          format: "docx", 
          sprintId,
          generateOnly: true // Flag to indicate we only want AI content, not file
        }),
      });
      
      if (!aiRes.ok) {
        throw new Error("Failed to generate AI summary. Please try again.");
      }
      
      const aiContent = await aiRes.json();
      setAiSummary(
        `${aiContent.sprintSummary || ""}\n\n` +
        `Velocity: ${aiContent.velocityNote || ""}\n\n` +
        `Highlights:\n${(aiContent.highlights || []).map((h: string) => `• ${h}`).join("\n")}\n\n` +
        `Recommendations:\n${(aiContent.recommendations || []).map((r: string) => `• ${r}`).join("\n")}`
      );
    } catch (error) {
      console.error("AI generation error:", error);
      alert("Failed to generate AI summary. Please check your API keys and try again.");
      setAiSummary("");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (format: "docx" | "pptx") => {
    if (!sprintId) return;

    setDownloadingFormat(format);
    setDownloadProgress(0);

    // Animate progress
    const progressInterval = setInterval(() => {
      setDownloadProgress((prev) => {
        // Slow down as we approach 100%
        const increment = Math.max(1, (100 - prev) * 0.1);
        const newProgress = prev + increment;
        return newProgress > 95 ? 95 : newProgress; // Cap at 95% until download completes
      });
    }, 200);

    try {
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, sprintId }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      // Complete progress
      setDownloadProgress(100);
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sprint-report-${sprint?.name?.replace(/\s+/g, "-") || "report"}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      // Small delay to show 100%
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      clearInterval(progressInterval);
      setDownloadingFormat(null);
      setDownloadProgress(0);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <Navbar variant="board" />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-[680px] mx-auto space-y-12">
          {/* Page Header */}
          <header className="flex items-start gap-4">
            <button
              onClick={() => router.push("/")}
              className="mt-1 p-2 rounded-lg hover:bg-surface-container-low text-gray-500 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-3xl font-extrabold font-manrope tracking-tight text-gray-900">
                Generate Report
              </h1>
              <p className="text-gray-600 font-medium mt-1">
                {sprint?.name || "Sprint"} Performance & Velocity Analysis
              </p>
              {sprint && (
                <p className="text-sm text-gray-500 mt-1">
                  {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                </p>
              )}
            </div>
          </header>

          {/* Section 1: AI Summary */}
          <section className="space-y-4">
            <div className="bg-white p-6 rounded-xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      auto_awesome
                    </span>
                  </div>
                  <h2 className="font-manrope font-bold text-lg text-gray-900">AI Sprint Summary</h2>
                </div>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold tracking-wider text-gray-600 flex items-center gap-1.5 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                  AI Powered
                </span>
              </div>
              <div className="relative">
                <textarea
                  value={aiSummary}
                  onChange={(e) => setAiSummary(e.target.value)}
                  className="w-full h-48 bg-gray-50 border-none rounded-lg p-4 text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans text-sm leading-relaxed resize-none"
                  placeholder="AI summary will appear here..."
                  readOnly={!aiSummary}
                />
                {isGenerating && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <div className="flex items-center gap-3 text-indigo-600">
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      <span className="font-medium">Generating AI summary...</span>
                    </div>
                  </div>
                )}
              </div>
              <Button
                onClick={handleGenerateSummary}
                disabled={isGenerating}
                className="w-full py-3 primary-gradient"
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
                {isGenerating ? "Generating..." : "Generate Summary"}
              </Button>
            </div>
          </section>

          {/* Section 2: Export Settings */}
          <section className="space-y-4">
            <h3 className="font-manrope font-bold text-sm text-gray-500 uppercase tracking-widest px-1">
              Export Configuration
            </h3>
            <div className="bg-white rounded-xl overflow-hidden divide-y divide-gray-100 shadow-sm">
              {/* Toggle Row 1 */}
              <div className="flex items-center justify-between p-5">
                <div className="space-y-0.5">
                  <p className="font-semibold text-gray-900">Include AI Summary</p>
                  <p className="text-xs text-gray-500">Append the generated summary to the header</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAISummary}
                    onChange={(e) => setIncludeAISummary(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Toggle Row 2 */}
              <div className="flex items-center justify-between p-5">
                <div className="space-y-0.5">
                  <p className="font-semibold text-gray-900">Include Blocker Notes</p>
                  <p className="text-xs text-gray-500">Detail stalled items and resolution paths</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBlockerNotes}
                    onChange={(e) => setIncludeBlockerNotes(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Section 3: Download Actions */}
          <section className="space-y-6">
            {/* Define gradient for wave animations */}
            <svg className="absolute opacity-0 pointer-events-none">
              <defs>
                <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
                  <stop offset="50%" stopColor="#6366f1" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            <div className="grid grid-cols-2 gap-4">
              {/* Word Report Button */}
              <button
                onClick={() => handleDownload("docx")}
                disabled={downloadingFormat !== null}
                className={`relative flex flex-col items-center justify-center gap-4 p-8 bg-white rounded-2xl border-2 transition-all shadow-sm overflow-hidden ${
                  downloadingFormat === "docx"
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-transparent hover:border-indigo-200 group"
                }`}
              >
                {/* Fluid background animation */}
                {downloadingFormat === "docx" && (
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-indigo-600/10 to-indigo-500/5 animate-pulse" />
                    {/* Flowing wave effect */}
                    <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
                          <stop offset="50%" stopColor="#6366f1" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z"
                        fill="url(#waveGradient)"
                        className="animate-pulse"
                      >
                        <animate
                          attributeName="d"
                          dur="2s"
                          repeatCount="indefinite"
                          values="
                            M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z;
                            M0,50 Q25,70 50,50 T100,50 L100,100 L0,100 Z;
                            M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z
                          "
                        />
                      </path>
                    </svg>
                  </div>
                )}

                {/* Circular Progress */}
                <div className="relative">
                  {downloadingFormat === "docx" ? (
                    <div className="relative w-20 h-20">
                      {/* Background circle */}
                      <svg className="w-20 h-20 transform -rotate-90">
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          className="text-indigo-100"
                        />
                        {/* Progress circle with smooth transition */}
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          strokeDasharray={2 * Math.PI * 36}
                          strokeDashoffset={2 * Math.PI * 36 * (1 - downloadProgress / 100)}
                          strokeLinecap="round"
                          className="text-indigo-600 transition-all duration-300 ease-out"
                        />
                      </svg>
                      {/* Percentage in center */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-indigo-600 tabular-nums">
                          {Math.round(downloadProgress)}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shadow-sm">
                      <span className="material-symbols-outlined text-3xl">description</span>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <p className={`font-bold ${downloadingFormat === "docx" ? "text-indigo-700" : "text-gray-900"}`}>
                    {downloadingFormat === "docx" ? "Generating..." : "Word Report"}
                  </p>
                  <p className="text-xs text-gray-500">.docx format</p>
                </div>
              </button>

              {/* Presentation Button */}
              <button
                onClick={() => handleDownload("pptx")}
                disabled={downloadingFormat !== null}
                className={`relative flex flex-col items-center justify-center gap-4 p-8 bg-white rounded-2xl border-2 transition-all shadow-sm overflow-hidden ${
                  downloadingFormat === "pptx"
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-transparent hover:border-indigo-200 group"
                }`}
              >
                {/* Fluid background animation */}
                {downloadingFormat === "pptx" && (
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-indigo-600/10 to-indigo-500/5 animate-pulse" />
                    {/* Flowing wave effect */}
                    <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path
                        d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z"
                        fill="url(#waveGradient)"
                        className="animate-pulse"
                      >
                        <animate
                          attributeName="d"
                          dur="2s"
                          repeatCount="indefinite"
                          values="
                            M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z;
                            M0,50 Q25,70 50,50 T100,50 L100,100 L0,100 Z;
                            M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z
                          "
                        />
                      </path>
                    </svg>
                  </div>
                )}

                {/* Circular Progress */}
                <div className="relative">
                  {downloadingFormat === "pptx" ? (
                    <div className="relative w-20 h-20">
                      {/* Background circle */}
                      <svg className="w-20 h-20 transform -rotate-90">
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          className="text-indigo-100"
                        />
                        {/* Progress circle with smooth transition */}
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          strokeDasharray={2 * Math.PI * 36}
                          strokeDashoffset={2 * Math.PI * 36 * (1 - downloadProgress / 100)}
                          strokeLinecap="round"
                          className="text-indigo-600 transition-all duration-300 ease-out"
                        />
                      </svg>
                      {/* Percentage in center */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-indigo-600 tabular-nums">
                          {Math.round(downloadProgress)}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform shadow-sm">
                      <span className="material-symbols-outlined text-3xl">present_to_all</span>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <p className={`font-bold ${downloadingFormat === "pptx" ? "text-indigo-700" : "text-gray-900"}`}>
                    {downloadingFormat === "pptx" ? "Generating..." : "Presentation"}
                  </p>
                  <p className="text-xs text-gray-500">.pptx format</p>
                </div>
              </button>
            </div>

            {/* Status indicator */}
            {downloadingFormat && (
              <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-50 to-indigo-100/50 rounded-full border border-indigo-200 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <p className="text-sm font-medium text-indigo-700">
                    Generating {downloadingFormat === "docx" ? "Word document" : "PowerPoint presentation"}...
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  {downloadProgress < 30 && "Preparing your report..."}
                  {downloadProgress >= 30 && downloadProgress < 70 && "Compiling sprint data..."}
                  {downloadProgress >= 70 && downloadProgress < 95 && "Finalizing document..."}
                  {downloadProgress >= 95 && "Almost ready..."}
                </p>
              </div>
            )}

            {!downloadingFormat && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                  <p className="text-xs font-medium text-gray-600">Last generated today at 09:42 AM</p>
                </div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                  Auto-saves to cloud storage
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer Decorative */}
      <footer className="mt-20 py-10 border-t border-gray-200/50">
        <div className="max-w-[680px] mx-auto px-6 flex justify-between items-center text-gray-400">
          <p className="text-xs font-medium">Sprint Logger © 2026</p>
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-lg cursor-pointer hover:text-gray-600">security</span>
            <span className="material-symbols-outlined text-lg cursor-pointer hover:text-gray-600">help_outline</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
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
