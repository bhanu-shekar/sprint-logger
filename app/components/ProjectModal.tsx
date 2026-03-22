"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import Button from "./Button";

interface Project {
  _id?: string;
  name: string;
  color: string;
  status: "Active" | "On Hold" | "Completed";
  description?: string;
}

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Omit<Project, "_id">) => void;
  editingProject?: Project | null;
  existingProjectNames?: string[];
}

const colors = [
  "#3525cd", "#dc2626", "#059669", "#d97706", "#7c3aed",
  "#db2777", "#0891b2", "#475569", "#7f1d1d", "#1e40af",
];

export default function ProjectModal({ isOpen, onClose, onSave, editingProject, existingProjectNames = [] }: ProjectModalProps) {
  const [mode, setMode] = useState<"new" | "import">("new");
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
  const [selectedArchivedProject, setSelectedArchivedProject] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    color: colors[0],
    status: "Active" as "Active" | "On Hold" | "Completed",
    description: "",
  });

  useEffect(() => {
    if (isOpen && mode === "import") {
      fetchArchivedProjects();
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: editingProject?.name || "",
        color: editingProject?.color || colors[0],
        status: editingProject?.status || "Active",
        description: editingProject?.description || "",
      });
    }
  }, [isOpen, editingProject]);

  const fetchArchivedProjects = async () => {
    try {
      const res = await fetch("/api/projects?all=true");
      const data: Project[] = await res.json();
      // Filter out projects with names that already exist in current sprint
      const filtered = data.filter((p: Project) => !existingProjectNames.includes(p.name));
      setArchivedProjects(filtered);
    } catch (error) {
      console.error("Failed to fetch archived projects:", error);
    }
  };

  const handleImportProject = () => {
    const project = archivedProjects.find(p => p._id === selectedArchivedProject);
    if (project) {
      setFormData({
        name: project.name,
        color: project.color,
        status: "Active",
        description: project.description || "",
      });
      setMode("new");
    }
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    onSave(formData);
    setFormData({ name: "", color: colors[0], status: "Active", description: "" });
    setMode("new");
    setSelectedArchivedProject("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingProject ? "Edit Project" : "Create Project"}
      footer={
        <>
          <Button variant="ghost" onClick={() => { setMode("new"); setSelectedArchivedProject(""); onClose(); }}>Cancel</Button>
          {mode === "import" ? (
            <Button onClick={handleImportProject} disabled={!selectedArchivedProject}>
              Import This Project
            </Button>
          ) : (
            <Button onClick={handleSubmit}>
              {editingProject ? "Save Changes" : "Create Project"}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        {!editingProject && (
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === "new"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setMode("new")}
            >
              New Project
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === "import"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setMode("import")}
            >
              Import Previous
            </button>
          </div>
        )}

        {mode === "import" && !editingProject ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Previous Project to Import
            </label>
            {archivedProjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
                <span className="text-3xl block mb-2">📦</span>
                {existingProjectNames.length > 0
                  ? "All previous projects already exist in this sprint"
                  : "No previous projects found"}
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {archivedProjects.map((project) => (
                  <label
                    key={project._id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="radio"
                      name="archivedProject"
                      value={project._id}
                      checked={selectedArchivedProject === project._id}
                      onChange={(e) => setSelectedArchivedProject(e.target.value)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{project.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {project.status === "Completed" ? "✓ Completed" : project.status}
                        {project.description && ` • ${project.description}`}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="My Awesome Project"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand Tag Color
              </label>
              <div className="flex gap-3">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full transition-all ${
                      formData.color === color ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Status
              </label>
              <div className="flex bg-gray-100 rounded-xl p-1">
                {(["Active", "On Hold", "Completed"] as const).map((status) => (
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
                placeholder="Brief description of the project..."
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
