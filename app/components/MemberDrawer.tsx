"use client";

import { useState, useEffect } from "react";
import NiceAvatar, { genConfig } from "react-nice-avatar";
import Drawer from "./Drawer";
import Button from "./Button";

// ─── Types ────────────────────────────────────────────────────────────────────

type NiceConfig = ReturnType<typeof genConfig>;

// "kind" instead of "type" — avoids Mongoose's { type: X } schema conflict
export type AvatarValue =
  | { kind: "nice"; config: NiceConfig; seed?: string }
  | { kind: "initials" };

export interface Member {
  _id?: string;
  name: string;
  role?: string;
  department: "Frontend" | "Design" | "Backend" | "DevOps" | "Data Science" | "Scrum Master" | "Other";
  avatar: AvatarValue;
  gradientIndex?: number;
}

interface MemberDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Omit<Member, "_id">) => void;
  editingMember?: Member | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEPARTMENTS = ["Frontend", "Design", "Backend", "DevOps", "Data Science", "Scrum Master"];

const GRADIENTS: [string, string][] = [
  ["6366F1", "8B5CF6"], ["3B82F6", "06B6D4"], ["10B981", "059669"],
  ["F59E0B", "EF4444"], ["EC4899", "8B5CF6"], ["0EA5E9", "6366F1"],
  ["14B8A6", "3B82F6"], ["F97316", "EF4444"],
];

const HAIR_STYLES  = ["normal", "thick", "mohawk", "womanLong", "womanShort"] as const;
const EYE_STYLES   = ["circle", "oval", "smile"] as const;
const MOUTH_STYLES = ["laugh", "smile", "peace"] as const;
const SHIRT_STYLES = ["hoody", "short", "polo"] as const;
const HAT_STYLES   = ["none", "beanie", "turban"] as const;
const GLASSES      = ["none", "round", "square"] as const;
const BG_COLORS    = ["#FFEDEF", "#F4D150", "#FC909F", "#D8F0E8", "#C2E4FF", "#E8D5FF", "#FFD9B0", "#D0F0FF"] as const;
const HAIR_COLORS  = ["#000000", "#F48150", "#F4D150", "#A55728", "#ECDCBF", "#B5A2A2", "#FC909F", "#6C4545"] as const;
const SHIRT_COLORS = ["#FC909F", "#F4D150", "#77C5D5", "#9BD99B", "#D3A4F9", "#F4A261", "#A8DADC", "#E9C46A"] as const;
const FACE_COLORS  = ["#F9C9B6", "#AC6651", "#FFDBB4", "#EDB98A", "#D08B5B", "#AE5D29", "#694D3D"] as const;

const PRESET_SEEDS = [
  "Aria Nova",   "Ethan Blake",  "Sofia Chen",  "Marcus Lee",
  "Zoe Wright",  "Lucas Hunt",   "Chloe Kim",   "Noah Davis",
  "Emma Stone",  "Aiden Cross",  "Layla Moon",  "Oliver Park",
  "Nora Quinn",  "James Cole",   "Maya Rivers", "Caleb Ross",
  "Lily Hart",   "Owen Gray",    "Grace Bell",  "Ryan Fox",
  "Ella Swift",  "Finn Waters",  "Mia Brooks",  "Hugo Silva",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function randomConfig(): NiceConfig {
  return genConfig(Math.random().toString(36).slice(2));
}

// ─── Exported display components ─────────────────────────────────────────────

export function InitialsAvatar({
  name, gradientIndex, size = 96, className = "",
}: { name: string; gradientIndex: number; size?: number; className?: string }) {
  const [from, to] = GRADIENTS[gradientIndex % GRADIENTS.length];
  const uid = `ig-${gradientIndex}-${from}`;
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" className={className}
      style={{ borderRadius: 12, display: "block", flexShrink: 0 }}>
      <defs>
        <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={`#${from}`} />
          <stop offset="100%" stopColor={`#${to}`} />
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="12" fill={`url(#${uid})`} />
      <text x="48" y="48" textAnchor="middle" dominantBaseline="central" fill="white"
        fontFamily="Inter,ui-sans-serif,system-ui,sans-serif" fontWeight="600"
        fontSize={getInitials(name).length === 1 ? "42" : "32"} letterSpacing="-1">
        {getInitials(name)}
      </text>
    </svg>
  );
}

export function AvatarDisplay({
  avatar, name, gradientIndex = 0, size = 96, className = "",
}: { avatar: AvatarValue; name: string; gradientIndex?: number; size?: number; className?: string }) {
  // Guard: if avatar or kind is missing (old data / migration gap), show initials
  if (!avatar || avatar.kind === "initials") {
    return <InitialsAvatar name={name} gradientIndex={gradientIndex} size={size} className={className} />;
  }
  
  // Always reconstruct from seed if available for consistency
  const config = avatar.seed ? genConfig(avatar.seed) : avatar.config;
  
  return (
    <NiceAvatar
      style={{ width: size, height: size, borderRadius: 12, flexShrink: 0, display: "block" }}
      className={className}
      {...config}
    />
  );
}

// ─── TraitRow ─────────────────────────────────────────────────────────────────

function TraitRow<T extends string>({
  label, options, value, onChange, renderOption,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  renderOption?: (v: T) => React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 w-14 shrink-0">{label}</span>
      <div className="flex gap-1.5 flex-wrap">
        {options.map((opt) => (
          <button key={opt} type="button" onClick={() => onChange(opt)} title={opt}
            className={`flex items-center justify-center rounded-lg transition-all focus:outline-none ${
              value === opt ? "ring-2 ring-indigo-500 scale-110 shadow-sm" : "opacity-60 hover:opacity-100 hover:scale-105"
            } ${renderOption ? "w-7 h-7" : "px-2 py-1 text-[10px] font-semibold"} ${
              !renderOption ? (value === opt ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600") : ""
            }`}>
            {renderOption ? renderOption(opt) : opt === "none" ? "✕" : opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main drawer ──────────────────────────────────────────────────────────────

export default function MemberDrawer({ isOpen, onClose, onSave, editingMember }: MemberDrawerProps) {
  const defaultAvatar: AvatarValue = { kind: "nice", config: genConfig("default"), seed: "default" };

  const [avatar, setAvatar]               = useState<AvatarValue>(defaultAvatar);
  const [gradientIndex, setGradientIndex] = useState(0);
  const [pickerTab, setPickerTab]         = useState<"presets" | "customize" | "initials">("presets");
  const [showPicker, setShowPicker]       = useState(false);
  const [formData, setFormData] = useState({
    name:       "",
    role:       "",
    department: "Frontend" as Member["department"],
  });

  useEffect(() => {
    if (editingMember) {
      const av = editingMember.avatar;
      if (av?.kind === "nice") {
        // Regenerate config from seed so it's always consistent
        const config = av.seed ? genConfig(av.seed) : (av.config ?? genConfig("default"));
        setAvatar({ kind: "nice", config, seed: av.seed });
        setPickerTab(av.seed ? "presets" : "customize");
      } else if (av?.kind === "initials") {
        setAvatar({ kind: "initials" });
        setPickerTab("initials");
      } else {
        // Fallback for any legacy data that might have used "type"
        setAvatar(defaultAvatar);
        setPickerTab("presets");
      }
      setGradientIndex(editingMember.gradientIndex ?? 0);
      setFormData({ name: editingMember.name, role: editingMember.role ?? "", department: editingMember.department });
    } else {
      setAvatar(defaultAvatar);
      setGradientIndex(0);
      setPickerTab("presets");
      setFormData({ name: "", role: "", department: "Frontend" });
    }
    setShowPicker(false);
  }, [editingMember, isOpen]);

  const cfg = avatar.kind === "nice" ? avatar.config : genConfig("default");

  const updateCfg = (patch: Partial<NiceConfig>) => {
    // Remove seed when customizing - customized avatars don't have a seed
    setAvatar({ kind: "nice", config: { ...cfg, ...patch }, seed: undefined });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    onSave({ ...formData, avatar, gradientIndex });
    setShowPicker(false);
    onClose();
  };

  const previewName = formData.name || "TM";

  return (
    <Drawer isOpen={isOpen} onClose={onClose}
      title={editingMember ? "Edit Member" : "Add Member"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>{editingMember ? "Save Changes" : "Add Member"}</Button>
        </>
      }>

      {/* ── Avatar preview ──────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <button type="button"
          className="w-24 h-24 rounded-2xl overflow-hidden ring-2 ring-transparent hover:ring-indigo-400 transition-all focus:outline-none"
          onClick={() => setShowPicker((p) => !p)}>
          <AvatarDisplay avatar={avatar} name={previewName} gradientIndex={gradientIndex} size={96} />
        </button>

        <button type="button" className="text-indigo-600 hover:text-indigo-700 font-bold text-sm"
          onClick={() => setShowPicker((p) => !p)}>
          {showPicker ? "Done" : "Choose Avatar"}
        </button>

        {showPicker && (
          <div className="w-full rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-xl">
            {/* Tab bar */}
            <div className="flex border-b border-gray-200">
              {([
                { id: "presets",   icon: "✦", label: "Presets"   },
                { id: "customize", icon: "🎨", label: "Customize" },
                { id: "initials",  icon: "Aa", label: "Initials"  },
              ] as const).map((t) => (
                <button key={t.id} type="button" onClick={() => setPickerTab(t.id)}
                  className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wide transition-colors ${
                    pickerTab === t.id
                      ? "text-indigo-600 border-b-2 border-indigo-600 bg-white"
                      : "text-gray-400 hover:text-gray-600 bg-gray-50"
                  }`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* ── Presets ── */}
            {pickerTab === "presets" && (
              <div className="p-3 space-y-3">
                <button type="button"
                  onClick={() => setAvatar({ kind: "nice", config: randomConfig() })}
                  className="w-full py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold transition-colors flex items-center justify-center gap-2">
                  <span className="text-base">🎲</span> Randomize
                </button>
                <div className="grid grid-cols-6 gap-2 max-h-56 overflow-y-auto">
                  {PRESET_SEEDS.map((seed) => {
                    const config = genConfig(seed);
                    const isSelected = avatar.kind === "nice" && avatar.seed === seed;
                    return (
                      <button key={seed} type="button" title={seed}
                        onClick={() => setAvatar({ kind: "nice", config, seed })}
                        className={`aspect-square rounded-xl overflow-hidden transition-all focus:outline-none ${
                          isSelected
                            ? "ring-2 ring-indigo-500 scale-105 shadow-md"
                            : "hover:scale-105 hover:shadow-sm opacity-80 hover:opacity-100"
                        }`}>
                        <NiceAvatar style={{ width: "100%", height: "100%" }} {...config} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Customize ── */}
            {pickerTab === "customize" && (
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-4 pb-3 border-b border-gray-100">
                  <NiceAvatar style={{ width: 72, height: 72, borderRadius: 16, flexShrink: 0 }} {...cfg} />
                  <div className="flex-1 space-y-2">
                    <button type="button"
                      onClick={() => setAvatar({ kind: "nice", config: randomConfig() })}
                      className="w-full py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold transition-colors flex items-center justify-center gap-1.5">
                      <span>🎲</span> Randomize all
                    </button>
                    <p className="text-[10px] text-gray-400 text-center">Click any trait below to change it</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <TraitRow label="Hair"    options={HAIR_STYLES}  value={cfg.hairStyle as any}   onChange={(v) => updateCfg({ hairStyle: v })} />
                  <TraitRow label="Hair ●"  options={HAIR_COLORS}  value={cfg.hairColor as any}   onChange={(v) => updateCfg({ hairColor: v })}
                    renderOption={(c) => <span className="w-5 h-5 rounded-full block border border-white shadow-sm" style={{ background: c }} />} />
                  <TraitRow label="Eyes"    options={EYE_STYLES}   value={cfg.eyeStyle as any}    onChange={(v) => updateCfg({ eyeStyle: v })} />
                  <TraitRow label="Mouth"   options={MOUTH_STYLES} value={cfg.mouthStyle as any}  onChange={(v) => updateCfg({ mouthStyle: v })} />
                  <TraitRow label="Glasses" options={GLASSES}      value={cfg.glassesStyle as any} onChange={(v) => updateCfg({ glassesStyle: v })} />
                  <TraitRow label="Hat"     options={HAT_STYLES}   value={cfg.hatStyle as any}    onChange={(v) => updateCfg({ hatStyle: v })} />
                  <TraitRow label="Shirt"   options={SHIRT_STYLES} value={cfg.shirtStyle as any}  onChange={(v) => updateCfg({ shirtStyle: v })} />
                  <TraitRow label="Shirt ●" options={SHIRT_COLORS} value={cfg.shirtColor as any}  onChange={(v) => updateCfg({ shirtColor: v })}
                    renderOption={(c) => <span className="w-5 h-5 rounded-full block border border-white shadow-sm" style={{ background: c }} />} />
                  <TraitRow label="Skin ●"  options={FACE_COLORS}  value={cfg.faceColor as any}   onChange={(v) => updateCfg({ faceColor: v })}
                    renderOption={(c) => <span className="w-5 h-5 rounded-full block border border-white shadow-sm" style={{ background: c }} />} />
                  <TraitRow label="BG ●"    options={BG_COLORS}    value={cfg.bgColor as any}     onChange={(v) => updateCfg({ bgColor: v })}
                    renderOption={(c) => <span className="w-5 h-5 rounded-full block border border-white shadow-sm" style={{ background: c }} />} />
                </div>
              </div>
            )}

            {/* ── Initials ── */}
            {pickerTab === "initials" && (
              <div className="grid grid-cols-4 gap-3 p-4">
                {GRADIENTS.map((_, i) => (
                  <button key={i} type="button"
                    onClick={() => { setGradientIndex(i); setAvatar({ kind: "initials" }); }}
                    className={`aspect-square rounded-xl overflow-hidden transition-all focus:outline-none ${
                      avatar.kind === "initials" && gradientIndex === i
                        ? "ring-2 ring-indigo-500 scale-105 shadow-md"
                        : "opacity-80 hover:opacity-100 hover:scale-105"
                    }`}>
                    <InitialsAvatar name={previewName} gradientIndex={i} size={80} />
                  </button>
                ))}
                <p className="col-span-4 text-[11px] text-gray-400 text-center -mt-1">
                  Updates live as you type the name below
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Form fields ────────────────────────────────────────────────────── */}
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-widest text-gray-500 px-1">Full Name *</label>
          <input type="text" value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full h-12 px-4 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-indigo-500 transition-all"
            placeholder="e.g. Sarah Chen" />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-widest text-gray-500 px-1">Display Name</label>
          <input type="text" value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full h-12 px-4 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-indigo-500 transition-all"
            placeholder="e.g. Lead Designer" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 px-1">Category</label>
            <select value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value as Member["department"] })}
              className="w-full h-12 px-4 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer">
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 px-1">Work Email</label>
            <input type="email" placeholder="email@company.com"
              className="w-full h-12 px-4 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-indigo-500 transition-all" />
          </div>
        </div>
      </div>
    </Drawer>
  );
}