"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import Button from "./Button";

interface Sprint {
  _id?: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Completed" | "Planned";
  description?: string;
}

interface SprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sprint: Omit<Sprint, "_id">) => void;
  editingSprint?: Sprint | null;
}

export default function SprintModal({ isOpen, onClose, onSave, editingSprint }: SprintModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    status: "Planned" as "Active" | "Completed" | "Planned",
    description: "",
  });

  useEffect(() => {
    if (isOpen) {
      if (editingSprint) {
        setFormData({
          name: editingSprint.name,
          startDate: editingSprint.startDate.split("T")[0],
          endDate: editingSprint.endDate.split("T")[0],
          status: editingSprint.status,
          description: editingSprint.description || "",
        });
      } else {
        // Default to next Monday as start date, Sunday as end date (1-week sprint)
        const nextMonday = getNextMonday();
        const sunday = getSundayAfter(nextMonday, 6); // 1 week
        setFormData({
          name: `Sprint ${getSprintNumber()}`,
          startDate: nextMonday,
          endDate: sunday,
          status: "Planned",
          description: "",
        });
      }
    }
  }, [isOpen, editingSprint]);

  const getSprintNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const week = getWeekNumber(now);
    return `${year}-W${week.toString().padStart(2, "0")}`;
  };

  const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  };

  const getNextMonday = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() + (day === 0 ? 1 : 8 - day); // Next Monday
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split("T")[0];
  };

  const getSundayAfter = (startDate: string, days: number) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startDate = e.target.value;
    const endDate = getSundayAfter(startDate, 6); // 1 week = 7 days total
    setFormData({ ...formData, startDate, endDate });
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.startDate || !formData.endDate) return;
    onSave(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSprint ? "Edit Sprint" : "Create New Sprint"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>
            {editingSprint ? "Save Changes" : "Create Sprint"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sprint Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g. Sprint 2026-12"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={handleStartDateChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              readOnly
            />
          </div>
        </div>

        <div className="p-4 bg-indigo-50 rounded-xl">
          <div className="flex items-center gap-2 text-indigo-700">
            <span className="material-symbols-outlined text-sm">calendar_month</span>
            <span className="text-sm font-medium">
              {formData.startDate && formData.endDate
                ? `${Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days sprint`
                : "Select start date"}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className="flex bg-gray-100 rounded-xl p-1">
            {(["Planned", "Active", "Completed"] as const).map((status) => (
              <button
                key={status}
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  formData.status === status
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setFormData({ ...formData, status })}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            rows={3}
            placeholder="Sprint goals, focus areas..."
          />
        </div>
      </div>
    </Modal>
  );
}
