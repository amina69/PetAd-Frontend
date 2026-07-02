import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/approval/EmptyState";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <EmptyState
        title="500 - Application Error"
        description="Something went wrong on our end. Please try again later."
        icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
        action={
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-[#E84D2A] text-white font-semibold rounded-xl hover:bg-[#d4431f] transition-colors shadow-sm"
            >
              Reload Page
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
            >
              Go Home
            </button>
          </div>
        }
      />
    </div>
  );
}