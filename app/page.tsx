"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "./components/Navbar";
import ProjectModal from "./components/ProjectModal";
import ProjectBlock from "./components/ProjectBlock";
import TeamWorkload from "./components/TeamWorkload";
import Button from "./components/Button";
import Badge from "./components/Badge";
import TaskModal from "./components/TaskModal";
import SprintModal from "./components/SprintModal";
import SprintSelector from "./components/SprintSelector";

interface Member {
  _id: string;
  name: string;
  role?: string;
  department: "Frontend" | "Design" | "Backend" | "DevOps" | "Data Science" | "Scrum Master" | "Other";
  avatar: { kind: "nice"; config: any; seed?: string } | { kind: "initials" };
  gradientIndex?: number;
}

interface Task {
  _id: string;
  projectId: string | { _id: string; name: string };
  sprintId?: string;
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
  tasks?: Task[];
}

interface Sprint {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Completed" | "Planned";
}

function SprintBoardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSprintId = searchParams.get("sprint");
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [currentSprintId, setCurrentSprintId] = useState<string | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [addingTaskProjectId, setAddingTaskProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Update URL when sprint changes
  useEffect(() => {
    if (currentSprintId && currentSprintId !== urlSprintId) {
      router.replace(`/?sprint=${currentSprintId}`, { scroll: false });
    }
  }, [currentSprintId]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Refetch projects and tasks when sprint changes
    if (currentSprintId) {
      fetchSprintData();
    }
  }, [currentSprintId]);

  const fetchSprintData = async () => {
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        fetch(`/api/projects?sprintId=${currentSprintId}`),
        fetch(`/api/tasks?sprintId=${currentSprintId}`),
      ]);
      const [projectsData, tasksData] = await Promise.all([
        projectsRes.json(),
        tasksRes.json(),
      ]);
      setProjects(projectsData);
      setTasks(tasksData);
    } catch (error) {
      console.error("Failed to fetch sprint data:", error);
    }
  };

  const fetchData = async () => {
    try {
      const sprintsRes = await fetch("/api/sprints?limit=20");
      const sprintsData = await sprintsRes.json();
      setSprints(sprintsData);
      
      // Use URL sprint ID if available, otherwise use active or most recent
      let initialSprintId = urlSprintId;
      
      if (!initialSprintId) {
        const activeSprint = sprintsData.find((s: Sprint) => s.status === "Active");
        initialSprintId = activeSprint?._id || (sprintsData.length > 0 ? sprintsData[0]._id : null);
      }
      
      if (initialSprintId) {
        setCurrentSprintId(initialSprintId);
        // Fetch projects and tasks for this sprint
        const [projectsRes, tasksRes] = await Promise.all([
          fetch(`/api/projects?sprintId=${initialSprintId}`),
          fetch(`/api/tasks?sprintId=${initialSprintId}`),
        ]);
        const [projectsData, tasksData] = await Promise.all([
          projectsRes.json(),
          tasksRes.json(),
        ]);
        setProjects(projectsData);
        setTasks(tasksData);
      }
      
      const membersRes = await fetch("/api/members");
      const membersData = await membersRes.json();
      setMembers(membersData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProject = async (projectData: Omit<Project, "_id">) => {
    if (!currentSprintId) {
      alert("Please select or create a sprint first");
      return;
    }
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...projectData, sprintId: currentSprintId }),
      });
      if (res.ok) {
        await fetchSprintData();
      } else {
        const error = await res.json();
        console.error("Failed to add project:", error);
      }
    } catch (error) {
      console.error("Failed to add project:", error);
    }
  };

  const handleAddSprint = async (sprintData: Omit<Sprint, "_id">) => {
    try {
      const res = await fetch("/api/sprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sprintData),
      });
      if (res.ok) {
        const newSprint = await res.json();
        setSprints([newSprint, ...sprints]);
        setCurrentSprintId(newSprint._id);
        // Fetch data for the new sprint
        setTimeout(() => {
          fetch(`/api/projects?sprintId=${newSprint._id}`)
            .then(r => r.json())
            .then(data => setProjects(data));
          fetch(`/api/tasks?sprintId=${newSprint._id}`)
            .then(r => r.json())
            .then(data => setTasks(data));
        }, 100);
      }
    } catch (error) {
      console.error("Failed to add sprint:", error);
    }
  };

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Project | null>(null);

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsProjectModalOpen(true);
  };

  const handleUpdateProject = async (projectData: Omit<Project, "_id">) => {
    if (!editingProject?._id) return;
    try {
      const res = await fetch(`/api/projects/${editingProject._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });
      if (res.ok) {
        await fetchSprintData();
        setEditingProject(null);
      }
    } catch (error) {
      console.error("Failed to update project:", error);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    setDeleteConfirm(project);
  };

  const confirmDeleteProject = async (project: Project) => {
    try {
      const res = await fetch(`/api/projects/${project._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchSprintData();
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const handleAddTask = async (projectId: string) => {
    setAddingTaskProjectId(projectId);
    setIsTaskModalOpen(true);
  };

  const handleCreateTask = async (taskData: Omit<Task, "_id" | "projectId">) => {
    if (!addingTaskProjectId) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...taskData, projectId: addingTaskProjectId, sprintId: currentSprintId }),
      });
      if (res.ok) {
        await fetchSprintData();
        setAddingTaskProjectId(null);
      }
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      // First, get the existing task to preserve its sprintId
      const existingTask = tasks.find((t: Task) => t._id === taskId);
      if (!existingTask) {
        console.error("Task not found");
        return;
      }
      
      // Preserve the sprintId from the existing task
      const sprintId = typeof existingTask.sprintId === "string" 
        ? existingTask.sprintId 
        : existingTask.sprintId;
      
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, sprintId }),
      });
      if (res.ok) {
        await fetchSprintData();
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchSprintData();
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleGenerateReport = () => {
    if (currentSprintId) {
      router.push(`/report?sprint=${currentSprintId}`);
    } else {
      alert("Please select a sprint first");
    }
  };

  const handleEditTask = async (taskData: Omit<Task, "_id" | "projectId">) => {
    if (!editingTask?._id) return;
    const projectId = typeof editingTask.projectId === "string"
      ? editingTask.projectId
      : editingTask.projectId;
    const taskId = editingTask._id;
    const sprintId = typeof editingTask.sprintId === "string"
      ? editingTask.sprintId
      : editingTask.sprintId;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...taskData, projectId, sprintId }),
      });
      if (res.ok) {
        await fetchSprintData();
        setEditingTask(null);
      }
    } catch (error) {
      console.error("Failed to edit task:", error);
    }
  };

  // Group tasks by project
  const projectsWithTasks = projects.map((project) => ({
    ...project,
    tasks: tasks.filter((task) =>
      typeof task.projectId === "string"
        ? task.projectId === project._id
        : task.projectId._id === project._id
    ),
  }));

  const totalTasks = tasks.length;

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <Navbar variant="board" />

      <main className="pt-16">
        {/* Sprint Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SprintSelector
                sprints={sprints}
                currentSprintId={currentSprintId}
                onSelectSprint={setCurrentSprintId}
                onNewSprint={() => setIsSprintModalOpen(true)}
              />
              {currentSprintId && (
                <Badge variant="indigo">ACTIVE</Badge>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsSprintModalOpen(true)}>
                <span className="material-symbols-outlined text-sm mr-1">add</span>
                New Sprint
              </Button>
              <Button onClick={handleGenerateReport}>
                <span className="material-symbols-outlined text-sm mr-1">description</span>
                Generate Report
              </Button>
            </div>
          </div>
        </div>

        {/* Split Layout */}
        <div className="flex">
          {/* Left Column - Projects & Tasks */}
          <div className="flex-1 p-6 pr-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="font-manrope font-bold text-lg text-gray-900">
                  Projects & Tasks
                </h2>
                <Badge>{totalTasks} tasks</Badge>
              </div>
              <Button
                variant="ghost"
                onClick={() => setIsProjectModalOpen(true)}
                className="text-indigo-600 hover:bg-indigo-50"
              >
                <span className="material-symbols-outlined text-sm mr-1">add</span>
                Add Project
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl h-40 animate-pulse" />
                ))}
              </div>
            ) : projectsWithTasks.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl">
                <span className="text-6xl mb-4 block">📁</span>
                <h3 className="font-manrope font-bold text-xl text-gray-900">
                  No projects yet
                </h3>
                <p className="text-gray-500 mt-2 mb-4">
                  Create your first project to start tracking tasks
                </p>
                <Button onClick={() => setIsProjectModalOpen(true)}>
                  <span className="material-symbols-outlined text-sm mr-1">add</span>
                  Add Project
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {projectsWithTasks.map((project) => (
                  <ProjectBlock
                    key={project._id}
                    project={project}
                    members={members}
                    onEditTask={(task: Task) => { setEditingTask(task); setIsTaskModalOpen(true); }}
                    onEditProject={handleEditProject}
                    onDeleteProject={handleDeleteProject}
                    onAddTask={handleAddTask}
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Team Workload Sidebar */}
          <div className="w-[35%] p-6 pl-4">
            <div className="sticky top-20">
              <TeamWorkload members={members} tasks={tasks} />
            </div>
          </div>
        </div>
      </main>

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => { setIsProjectModalOpen(false); setEditingProject(null); }}
        onSave={editingProject ? handleUpdateProject : handleAddProject}
        editingProject={editingProject}
        existingProjectNames={projectsWithTasks.map(p => p.name).filter(name => name !== editingProject?.name)}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); setAddingTaskProjectId(null); }}
        onSave={(taskData) => {
          if (editingTask) {
            handleEditTask(taskData);
          } else {
            handleCreateTask(taskData);
          }
        }}
        editingTask={editingTask}
        members={members}
        projectId={addingTaskProjectId || undefined}
      />

      <SprintModal
        isOpen={isSprintModalOpen}
        onClose={() => setIsSprintModalOpen(false)}
        onSave={handleAddSprint}
      />

      {/* Delete Project Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-600">delete</span>
              </div>
              <div>
                <h3 className="font-manrope font-bold text-lg text-gray-900">Delete Project?</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: deleteConfirm.color }} />
                <span className="font-medium text-gray-900">{deleteConfirm.name}</span>
              </div>
              {deleteConfirm.description && (
                <p className="text-sm text-gray-500 mt-2">{deleteConfirm.description}</p>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setDeleteConfirm(null)} className="flex-1">
                Cancel
              </Button>
              <Button variant="danger" onClick={() => confirmDeleteProject(deleteConfirm)} className="flex-1">
                Delete Project
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrapper component with Suspense
function SprintBoardPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-indigo-600 animate-spin">progress_activity</span>
          <p className="mt-4 text-gray-600 font-medium">Loading sprint...</p>
        </div>
      </div>
    }>
      <SprintBoardPage />
    </Suspense>
  );
}

export default SprintBoardPageWrapper;
