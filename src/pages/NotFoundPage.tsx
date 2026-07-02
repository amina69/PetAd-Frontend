import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/approval/EmptyState";
import { SearchX } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <EmptyState
        title="404 - Page Not Found"
        description="The page you are looking for doesn't exist or has been moved."
        icon={<SearchX className="w-6 h-6" />}
        action={
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2.5 bg-[#E84D2A] text-white font-semibold rounded-xl hover:bg-[#d4431f] transition-colors shadow-sm"
          >
            Go Back Home
          </button>
        }
      />
    </div>
  );
}