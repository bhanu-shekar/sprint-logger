"use client";

import { useState } from "react";
import NiceAvatar from "react-nice-avatar";
import { AvatarDisplay } from "./MemberDrawer";
import Badge from "./Badge";
import Button from "./Button";

interface Member {
  _id: string;
  name: string;
  role?: string;
  department: "Frontend" | "Design" | "Backend" | "DevOps" | "Data Science" | "Scrum Master" | "Other";
  avatar: { kind: "nice"; config: any; seed?: string } | { kind: "initials" };
  gradientIndex?: number;
}

interface MemberCardProps {
  member: Member;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
}

const departmentColors: Record<string, { bg: string; badge: "indigo" | "red" | "teal" | "slate" | "purple" | "green" | "orange" }> = {
  Frontend:        { bg: "bg-indigo-50",  badge: "indigo"  },
  Design:          { bg: "bg-red-50",     badge: "red"     },
  Backend:         { bg: "bg-teal-50",    badge: "teal"    },
  DevOps:          { bg: "bg-slate-100",  badge: "slate"   },
  "Data Science":  { bg: "bg-green-50",   badge: "green"   },
  "Scrum Master":  { bg: "bg-orange-50",  badge: "orange"  },
  Other:           { bg: "bg-gray-100",   badge: "purple"  },
};

export default function MemberCard({ member, onEdit, onDelete }: MemberCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const colors = departmentColors[member.department] ?? departmentColors.Other;

  return (
    <div className="group relative bg-white rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-lg">
      {/* Header with avatar */}
      <div className={`h-40 flex items-center justify-center ${colors.bg} relative overflow-hidden`}>

        {/* Avatar — uses AvatarDisplay which handles both "nice" and "initials" via "kind" */}
        <AvatarDisplay
          avatar={member.avatar}
          name={member.name}
          gradientIndex={member.gradientIndex ?? 0}
          size={96}
        />

        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white/20 to-transparent" />

        {/* Hover actions */}
        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(member)}
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-700 hover:bg-indigo-600 hover:text-white transition-colors shadow-sm">
            <span className="material-symbols-outlined text-sm">edit</span>
          </button>
          <button onClick={() => setShowDeleteConfirm(true)}
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-700 hover:bg-red-500 hover:text-white transition-colors shadow-sm">
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>

        {/* Delete confirm popover */}
        {showDeleteConfirm && (
          <div className="absolute bottom-4 left-4 right-16 bg-white rounded-xl shadow-lg p-3 z-10 animate-in fade-in zoom-in duration-200">
            <p className="text-sm text-gray-700 mb-2">
              Delete <strong>{member.name.split(" ")[0]}</strong>? This can&apos;t be undone.
            </p>
            <div className="flex gap-2">
              <Button variant="danger" size="sm"
                onClick={() => { onDelete(member); setShowDeleteConfirm(false); }}>
                Confirm
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 text-center">
        <h3 className="font-manrope font-bold text-lg text-gray-900 mb-1">{member.name}</h3>
        <p className="text-gray-500 text-sm mb-4">{member.role || "No role specified"}</p>
        <Badge variant={colors.badge}>{member.department}</Badge>
      </div>
    </div>
  );
}