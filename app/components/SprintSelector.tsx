"use client";

import { useState, useEffect } from "react";

interface Sprint {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Completed" | "Planned";
}

interface SprintSelectorProps {
  sprints: Sprint[];
  currentSprintId: string | null;
  onSelectSprint: (sprintId: string) => void;
  onNewSprint: () => void;
}

export default function SprintSelector({ sprints, currentSprintId, onSelectSprint, onNewSprint }: SprintSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const currentSprint = sprints.find((s) => s._id === currentSprintId);

  // Group sprints by month/year
  const groupedSprints = sprints.reduce((acc, sprint) => {
    const date = new Date(sprint.startDate);
    const key = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(sprint);
    return acc;
  }, {} as Record<string, Sprint[]>);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-700";
      case "Completed": return "bg-gray-100 text-gray-600";
      default: return "bg-indigo-100 text-indigo-700";
    }
  };

  return (
    <div className="relative">
      {/* Sprint Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
      >
        <div className="text-left">
          <div className="text-xs text-gray-500 font-medium">Current Sprint</div>
          <div className="text-sm font-semibold text-gray-900">
            {currentSprint?.name || "Select Sprint"}
          </div>
        </div>
        <span className="material-symbols-outlined text-gray-400">
          {isOpen ? "expand_less" : "expand_more"}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-manrope font-bold text-gray-900">Select Sprint</h3>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === "list" ? "bg-white shadow-sm" : "text-gray-500"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">list</span>
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === "calendar" ? "bg-white shadow-sm" : "text-gray-500"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">calendar_month</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-80 overflow-y-auto">
              {viewMode === "list" ? (
                <div className="p-2">
                  {Object.entries(groupedSprints).map(([month, monthSprints]) => (
                    <div key={month} className="mb-3">
                      <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {month}
                      </div>
                      {monthSprints.map((sprint) => (
                        <button
                          key={sprint._id}
                          onClick={() => {
                            onSelectSprint(sprint._id);
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                            currentSprintId === sprint._id
                              ? "bg-indigo-50 border-2 border-indigo-200"
                              : "hover:bg-gray-50 border-2 border-transparent"
                          }`}
                        >
                          <div className="text-left">
                            <div className="font-medium text-gray-900">{sprint.name}</div>
                            <div className="text-xs text-gray-500">
                              {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sprint.status)}`}>
                            {sprint.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  ))}
                  {sprints.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <span className="material-symbols-outlined text-3xl mb-2 block">calendar_today</span>
                      No sprints yet
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4">
                  {/* Calendar View - Simplified */}
                  <div className="space-y-3">
                    {sprints.map((sprint) => {
                      const startDate = new Date(sprint.startDate);
                      const endDate = new Date(sprint.endDate);
                      const today = new Date();
                      const isCurrent = currentSprintId === sprint._id;
                      const isActive = sprint.status === "Active" || 
                        (today >= startDate && today <= endDate);

                      return (
                        <button
                          key={sprint._id}
                          onClick={() => {
                            onSelectSprint(sprint._id);
                            setIsOpen(false);
                          }}
                          className={`w-full p-3 rounded-xl border-2 transition-all ${
                            isCurrent
                              ? "border-indigo-500 bg-indigo-50"
                              : isActive
                              ? "border-green-300 bg-green-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{sprint.name}</span>
                            {isActive && (
                              <span className="flex items-center gap-1 text-xs text-green-700">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                Active
                              </span>
                            )}
                          </div>
                          {/* Timeline bar */}
                          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`absolute h-full ${
                                isCurrent ? "bg-indigo-500" : isActive ? "bg-green-500" : "bg-gray-400"
                              }`}
                              style={{
                                left: "0%",
                                width: "100%",
                              }}
                            />
                          </div>
                          <div className="flex justify-between mt-1 text-xs text-gray-500">
                            <span>{formatDate(sprint.startDate)}</span>
                            <span>{formatDate(sprint.endDate)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => {
                  onNewSprint();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Create New Sprint
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
