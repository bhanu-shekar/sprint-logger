interface AvatarProps {
  emoji?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeStyles = {
  sm: "w-6 h-6 text-sm",
  md: "w-8 h-8 text-base",
  lg: "w-10 h-10 text-lg",
  xl: "w-12 h-12 text-xl",
};

const bgColors = [
  "bg-red-100",
  "bg-orange-100",
  "bg-amber-100",
  "bg-green-100",
  "bg-teal-100",
  "bg-cyan-100",
  "bg-indigo-100",
  "bg-purple-100",
  "bg-pink-100",
  "bg-rose-100",
];

export default function Avatar({ emoji, name, size = "md", className = "" }: AvatarProps) {
  const colorIndex = name.charCodeAt(0) % bgColors.length;
  const bgColor = bgColors[colorIndex];

  return (
    <div
      className={`${sizeStyles[size]} ${bgColor} rounded-xl flex items-center justify-center font-bold ${className}`}
      title={name}
    >
      {emoji || name.charAt(0).toUpperCase()}
    </div>
  );
}
