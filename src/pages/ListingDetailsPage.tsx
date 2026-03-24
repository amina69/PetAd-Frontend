import { useParams } from "react-router-dom";
import { useState } from "react";
import ListingInfoTab from "../components/listings/ListingInfoTab";
import InterestedUsersTab from "../components/listings/InterestedUsersTab";

export default function ListingDetailsPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<"details" | "interested">(
    "details",
  );

  // suppress unused warning for id
  void id;

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === "details"
                ? "text-[#0D162B] border-[#0D162B] bg-gray-50"
                : "text-gray-400 border-transparent hover:text-gray-600"
            }`}
          >
            Listing Details
          </button>
          <button
            onClick={() => setActiveTab("interested")}
            className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === "interested"
                ? "text-[#0D162B] border-[#0D162B] bg-gray-50"
                : "text-gray-400 border-transparent hover:text-gray-600"
            }`}
          >
            Interested Users
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "details" ? <ListingInfoTab /> : <InterestedUsersTab />}
      </div>
    </div>
  );
}
