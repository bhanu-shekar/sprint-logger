interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "indigo" | "red" | "teal" | "slate" | "purple" | "green" | "amber" | "orange";
  className?: string;
}

const variantStyles = {
  default: "bg-gray-100 text-gray-700",
  indigo: "bg-indigo-100 text-indigo-700",
  red: "bg-red-100 text-red-700",
  teal: "bg-teal-100 text-teal-700",
  slate: "bg-slate-100 text-slate-700",
  purple: "bg-purple-100 text-purple-700",
  green: "bg-green-100 text-green-700",
  amber: "bg-amber-100 text-amber-700",
  orange: "bg-orange-100 text-orange-700",
};

export default function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
