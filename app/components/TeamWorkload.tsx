"use client";

import NiceAvatar, { genConfig } from "react-nice-avatar";
import Badge from "./Badge";

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
  assigneeIds: Member[];
  timeValue: number;
  timeUnit: "h" | "d";
}

interface TeamWorkloadProps {
  members: Member[];
  tasks: Task[];
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

export default function TeamWorkload({ members, tasks }: TeamWorkloadProps) {
  // Filter to only show members who have tasks assigned in this sprint
  const membersWithTasks = members.filter((member) =>
    tasks.some((task) =>
      task.assigneeIds?.some((assignee) => assignee._id === member._id)
    )
  );

  const getMemberWorkload = (memberId: string) => {
    const memberTasks = tasks.filter((task) =>
      task.assigneeIds?.some((a: Member) => a._id === memberId)
    );

    const totalHours = memberTasks.reduce((acc, task) => {
      const hours = task.timeUnit === "d" ? task.timeValue * 8 : task.timeValue;
      return acc + hours;
    }, 0);

    return {
      taskCount: memberTasks.length,
      totalHours,
    };
  };

  const getCapacityStatus = (hours: number) => {
    if (hours >= 100) return { label: "Overloaded", color: "red", width: "100%" };
    if (hours >= 90) return { label: "At Capacity", color: "amber", width: "100%" };
    if (hours >= 70) return { label: "Healthy", color: "indigo", width: `${hours}%` };
    return { label: "Optimal", color: "teal", width: `${Math.max(hours, 5)}%` };
  };

  const capacityColors: Record<string, string> = {
    teal: "bg-teal-500",
    indigo: "bg-indigo-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };

  const overloadedMembers = membersWithTasks.filter((m) => {
    const { totalHours } = getMemberWorkload(m._id);
    return totalHours >= 40;
  });

  return (
    <div className="space-y-4">
      <h2 className="font-manrope font-bold text-lg text-gray-900">Team Workload</h2>

      {membersWithTasks.length === 0 ? (
        <p className="text-gray-500 text-sm">
          {tasks.length === 0 
            ? "No tasks in this sprint yet" 
            : "No members assigned to tasks in this sprint"}
        </p>
      ) : (
        <div className="space-y-3">
          {membersWithTasks.map((member) => {
            const { taskCount, totalHours } = getMemberWorkload(member._id);
            const capacity = getCapacityStatus((totalHours / 40) * 100);

            return (
              <div
                key={member._id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {member.avatar.kind === "nice" ? (
                      <NiceAvatar
                        style={{ width: 48, height: 48, borderRadius: 12 }}
                        {...(member.avatar.seed ? genConfig(member.avatar.seed) : member.avatar.config)}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white bg-gradient-to-br from-indigo-500 to-purple-600">
                        {getInitials(member.name)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-500">{member.role || "No role"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {taskCount} {taskCount === 1 ? "task" : "tasks"}
                    </div>
                    <div className="text-xs text-gray-500">{totalHours}h total</div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">Capacity</span>
                    <span
                      className={`font-medium ${
                        capacity.color === "teal"
                          ? "text-teal-600"
                          : capacity.color === "indigo"
                          ? "text-indigo-600"
                          : capacity.color === "amber"
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      {capacity.label}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${capacityColors[capacity.color]} transition-all duration-500`}
                      style={{ width: capacity.width }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sprint Insight */}
      {overloadedMembers.length > 0 && (
        <div className="bg-gradient-to-br from-teal-900 to-teal-800 rounded-xl p-4 text-white">
          <div className="flex items-start gap-3">
            <span className="text-xl">✨</span>
            <div>
              <h3 className="font-medium text-sm">Sprint Insight</h3>
              <p className="text-teal-100 text-sm mt-1">
                {overloadedMembers.length} {overloadedMembers.length === 1 ? "member is" : "members are"}{" "}
                overloaded: {overloadedMembers.map((m) => m.name).join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
