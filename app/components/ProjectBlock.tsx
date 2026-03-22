"use client";

import { useState } from "react";
import NiceAvatar, { genConfig } from "react-nice-avatar";
import Badge from "./Badge";
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

interface Project {
  _id: string;
  name: string;
  color: string;
  status: "Active" | "On Hold" | "Completed";
  description?: string;
}

interface ProjectBlockProps {
  project: Project & { tasks?: Task[] };
  members: Member[];
  onEditTask: (task: Task) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onAddTask: (projectId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
}

function avatarUrl(style: string, seed: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=solid`;
}

const typeColors: Record<string, "indigo" | "red" | "purple" | "slate"> = {
  Feature: "indigo",
  Bug: "red",
  Design: "purple",
  DevOps: "slate",
  Other: "slate",
};

const statusColors: Record<string, "default" | "indigo" | "amber" | "green"> = {
  "To Do": "default",
  "In Progress": "indigo",
  "Review": "amber",
  "Done": "green",
};

export default function ProjectBlock({
  project,
  members,
  onEditTask,
  onEditProject,
  onDeleteProject,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}: ProjectBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Project Header */}
      <div className="flex items-center gap-3 p-4 border-l-4" style={{ borderLeftColor: project.color }}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-gray-500">
            {isExpanded ? "expand_more" : "chevron_right"}
          </span>
        </button>
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
        <h3 className="font-manrope font-bold text-gray-900 flex-1">{project.name}</h3>
        <Badge>{project.tasks?.length || 0} tasks</Badge>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-gray-500">more_vert</span>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 min-w-[150px]">
              <button 
                onClick={() => {
                  onEditProject(project);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Edit Project
              </button>
              <button 
                onClick={() => {
                  onDeleteProject(project);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Delete Project
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Task Table */}
      {isExpanded && (
        <>
          <div className="px-4 py-2 bg-gray-50 border-t border-b border-gray-100">
            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <div className="col-span-4">Task Title</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-3">Assignees</div>
              <div className="col-span-1">Time</div>
              <div className="col-span-2">Status</div>
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {project.tasks?.map((task) => (
              <div
                key={task._id}
                className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-gray-50 group"
              >
                <div className="col-span-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-gray-300 cursor-grab opacity-0 group-hover:opacity-100">
                    drag_indicator
                  </span>
                  <span className="text-gray-900 font-medium truncate">{task.title}</span>
                </div>
                <div className="col-span-2">
                  {task.type && (
                    <Badge variant={typeColors[task.type] || "slate"}>{task.type}</Badge>
                  )}
                </div>
                <div className="col-span-3 flex -space-x-2">
                  {task.assigneeIds?.map((assignee: Member) => (
                    <div
                      key={assignee._id}
                      className="w-8 h-8 rounded-xl ring-2 ring-white overflow-hidden flex-shrink-0"
                      title={assignee.name}
                    >
                      {assignee.avatar.kind === "nice" ? (
                        <NiceAvatar
                          style={{ width: "100%", height: "100%" }}
                          {...(assignee.avatar.seed ? genConfig(assignee.avatar.seed) : assignee.avatar.config)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-indigo-500 to-purple-600">
                          {assignee.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="col-span-1 text-sm text-gray-600">
                  {task.timeValue > 0 ? `${task.timeValue}${task.timeUnit}` : "-"}
                </div>
                <div className="col-span-2 flex items-center justify-between">
                  <select
                    value={task.status}
                    onChange={(e) => onUpdateTask(task._id, { status: e.target.value as Task["status"] })}
                    className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${
                      task.status === "To Do" ? "bg-gray-100 text-gray-700" :
                      task.status === "In Progress" ? "bg-indigo-100 text-indigo-700" :
                      task.status === "Review" ? "bg-amber-100 text-amber-700" :
                      "bg-green-100 text-green-700"
                    }`}
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Done">Done</option>
                  </select>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditTask(task)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-indigo-50 rounded transition-all"
                    >
                      <span className="material-symbols-outlined text-sm text-indigo-600">edit</span>
                    </button>
                    <button
                      onClick={() => onDeleteTask(task._id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
                    >
                      <span className="material-symbols-outlined text-sm text-red-500">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Task Row */}
          <div className="px-4 py-3 border-t border-gray-100">
            <button
              onClick={() => onAddTask(project._id)}
              className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors text-sm"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Add a task...
            </button>
          </div>
        </>
      )}
    </div>
  );
}
