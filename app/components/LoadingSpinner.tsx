interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

const sizeConfig = {
  sm: { icon: "text-3xl", text: "text-sm" },
  md: { icon: "text-4xl", text: "text-base" },
  lg: { icon: "text-5xl", text: "text-lg" },
};

export default function LoadingSpinner({
  size = "md",
  text = "Loading...",
  fullScreen = false,
}: LoadingSpinnerProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <span className={`material-symbols-outlined ${sizeConfig[size].icon} text-indigo-600 animate-spin`}>
        progress_activity
      </span>
      {text && (
        <p className={`${sizeConfig[size].text} text-gray-600 font-medium`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
