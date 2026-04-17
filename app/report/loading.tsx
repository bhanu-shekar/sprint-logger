import LoadingSpinner from "../components/LoadingSpinner";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
      <LoadingSpinner size="lg" text="Generating report..." />
    </div>
  );
}
