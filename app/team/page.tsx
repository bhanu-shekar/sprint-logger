"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import MemberCard from "../components/MemberCard";
import MemberDrawer from "../components/MemberDrawer";
import Button from "../components/Button";
import Badge from "../components/Badge";

interface Member {
  _id: string;
  name: string;
  role?: string;
  department: "Frontend" | "Design" | "Backend" | "DevOps" | "Data Science" | "Scrum Master" | "Other";
  avatar: { kind: "nice"; config: any; seed?: string } | { kind: "initials" };
  gradientIndex?: number;
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/members");
      const data = await res.json();
      setMembers(data);
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async (memberData: Omit<Member, "_id">) => {
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberData),
      });
      if (res.ok) {
        await fetchMembers();
      }
    } catch (error) {
      console.error("Failed to add member:", error);
    }
  };

  const handleEditMember = async (memberData: Omit<Member, "_id">) => {
    if (!editingMember?._id) return;
    try {
      const res = await fetch(`/api/members/${editingMember._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberData),
      });
      if (res.ok) {
        await fetchMembers();
        setEditingMember(null);
      }
    } catch (error) {
      console.error("Failed to edit member:", error);
    }
  };

  const handleDeleteMember = async (member: Member) => {
    try {
      const res = await fetch(`/api/members/${member._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchMembers();
      }
    } catch (error) {
      console.error("Failed to delete member:", error);
    }
  };

  const departmentStats = members.reduce((acc, m) => {
    acc[m.department] = (acc[m.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const departmentColors: Record<string, string> = {
    Frontend: "bg-indigo-600",
    Design: "bg-red-500",
    Backend: "bg-teal-600",
    DevOps: "bg-slate-600",
    "Data Science": "bg-green-600",
    "Scrum Master": "bg-orange-600",
    Other: "bg-gray-600",
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <Navbar variant="team" />

      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-8 py-12">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-extrabold font-manrope tracking-tight text-gray-900">
                Team Members
              </h1>
              <p className="text-gray-600 font-medium text-lg flex items-center gap-2 mt-2">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-600"></span>
                {members.length} {members.length === 1 ? "member" : "members"} actively contributing
              </p>
            </div>
            <Button onClick={() => { setEditingMember(null); setIsDrawerOpen(true); }} className="h-12 px-6">
              <span className="material-symbols-outlined mr-2">person_add</span>
              Add Member
            </Button>
          </header>

          {/* Search Bar - Mobile */}
          <div className="mb-6 sm:hidden">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input
                type="text"
                placeholder="Search team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Member Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl h-64 animate-pulse" />
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-6xl mb-4 block">👥</span>
              <h3 className="font-manrope font-bold text-xl text-gray-900">
                {searchQuery ? "No members found" : "No team members yet"}
              </h3>
              <p className="text-gray-500 mt-2">
                {searchQuery ? "Try a different search term" : "Add your first team member to get started"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMembers.map((member) => (
                <MemberCard
                  key={member._id}
                  member={member}
                  onEdit={(m) => { setEditingMember(m); setIsDrawerOpen(true); }}
                  onDelete={handleDeleteMember}
                />
              ))}
            </div>
          )}

          {/* Bottom Stats Strip */}
          {members.length > 0 && (
            <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white rounded-xl p-8 flex flex-col justify-between min-h-[200px] shadow-sm">
                <div>
                  <h4 className="font-manrope font-bold text-xl mb-2 text-gray-900">Team Distribution</h4>
                  <p className="text-gray-600 text-sm max-w-md">
                    Your team is currently focused heavily on Frontend and Design deliverables for the current sprint cycle.
                  </p>
                </div>
                <div className="flex gap-4 mt-6">
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden flex">
                    {Object.entries(departmentStats).map(([dept, count]) => {
                      const percentage = (count / members.length) * 100;
                      return (
                        <div
                          key={dept}
                          className={`${departmentColors[dept] || "bg-gray-400"} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2 mt-4 flex-wrap">
                  {Object.entries(departmentStats).map(([dept, count]) => (
                    <Badge key={dept} variant={
                      dept === "Frontend" ? "indigo" :
                      dept === "Design" ? "red" :
                      dept === "Backend" ? "teal" :
                      dept === "DevOps" ? "slate" :
                      dept === "Data Science" ? "green" :
                      dept === "Scrum Master" ? "orange" :
                      "purple"
                    }>
                      {dept}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-indigo-700 to-indigo-600 rounded-xl p-8 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="font-manrope font-bold text-xl mb-1">Growth Tier</h4>
                  <p className="opacity-80 text-sm mb-6">Enterprise Tier Status</p>
                  <div className="text-4xl font-black">94%</div>
                  <p className="text-xs uppercase tracking-widest font-bold mt-2">Utilization</p>
                </div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-50"></div>
              </div>
            </section>
          )}
        </div>
      </main>

      <MemberDrawer
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setEditingMember(null); }}
        onSave={editingMember ? handleEditMember : handleAddMember}
        editingMember={editingMember}
      />
    </div>
  );
}
