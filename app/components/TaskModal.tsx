"use client";

import { useState, useEffect } from "react";
import NiceAvatar, { genConfig } from "react-nice-avatar";
import Modal from "./Modal";
import Button from "./Button";

interface Member {
  _id: string;
  name: string;
  department: "Frontend" | "Design" | "Backend" | "DevOps" | "Data Science" | "Scrum Master" | "Other";
  avatar: { kind: "nice"; config: any; seed?: string } | { kind: "initials" };
  gradientIndex?: number;
}

interface Task {
  _id: string;
  projectId: string | { _id: string; name: string };
  title: string;
  type?: "Feature" | "Bug" | "Design" | "DevOps" | "Other";
  assigneeIds: Member[];
  timeValue: number;
  timeUnit: "h" | "d";
  status: "To Do" | "In Progress" | "Review" | "Done";
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, "_id" | "projectId">) => void;
  editingTask?: Task | null;
  members: Member[];
  projectId?: string;
}

function avatarUrl(style: string, seed: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=solid`;
}

export default function TaskModal({ isOpen, onClose, onSave, editingTask, members, projectId }: TaskModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    type: "Feature" as Task["type"],
    assigneeIds: [] as string[],
    timeValue: 0,
    timeUnit: "h" as "h" | "d",
    status: "To Do" as Task["status"],
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: editingTask?.title || "",
        type: editingTask?.type || "Feature",
        assigneeIds: editingTask?.assigneeIds?.map((a: Member) => a._id) || [],
        timeValue: editingTask?.timeValue || 0,
        timeUnit: editingTask?.timeUnit || "h",
        status: editingTask?.status || "To Do",
      });
    }
  }, [isOpen, editingTask]);

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    onSave({
      ...formData,
      assigneeIds: formData.assigneeIds.map(id => members.find(m => m._id === id)!),
    });
    setFormData({
      title: "",
      type: "Feature",
      assigneeIds: [],
      timeValue: 0,
      timeUnit: "h",
      status: "To Do",
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTask ? "Edit Task" : "Add Task"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>
            {editingTask ? "Save Changes" : "Add Task"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Task Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Enter task title..."
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as Task["type"] })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              <option value="Feature">Feature</option>
              <option value="Bug">Bug</option>
              <option value="Design">Design</option>
              <option value="DevOps">DevOps</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Task["status"] })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Done">Done</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assignees
          </label>
          <div className="border border-gray-300 rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto">
            {members.map((member) => (
              <label
                key={member._id}
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
              >
                <input
                  type="checkbox"
                  checked={formData.assigneeIds.includes(member._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({ ...formData, assigneeIds: [...formData.assigneeIds, member._id] });
                    } else {
                      setFormData({ ...formData, assigneeIds: formData.assigneeIds.filter(id => id !== member._id) });
                    }
                  }}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0">
                  {member.avatar.kind === "nice" ? (
                    <NiceAvatar
                      style={{ width: "100%", height: "100%" }}
                      {...(member.avatar.seed ? genConfig(member.avatar.seed) : member.avatar.config)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-indigo-500 to-purple-600">
                      {member.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                  )}
                </div>
                <span className="text-sm text-gray-700">{member.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time Estimate
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={formData.timeValue || ""}
              onChange={(e) => setFormData({ ...formData, timeValue: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  formData.timeUnit === "h" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
                }`}
                onClick={() => setFormData({ ...formData, timeUnit: "h" })}
              >
                Hours
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  formData.timeUnit === "d" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
                }`}
                onClick={() => setFormData({ ...formData, timeUnit: "d" })}
              >
                Days
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
