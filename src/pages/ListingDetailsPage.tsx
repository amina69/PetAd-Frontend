import { useParams } from "react-router-dom";
import { useState } from "react";
import ListingInfoTab from "../components/listings/ListingInfoTab";
import InterestedUsersTab from "../components/listings/InterestedUsersTab";

export default function ListingDetailsPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<"details" | "interested">(
    "details",
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h1 className="text-xl font-bold text-[#0D162B]">
            Listing Details (ID: {id})
          </h1>
        </div>

        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-6 py-4 text-sm font-semibold transition-colors ${
              activeTab === "details"
                ? "text-[#0D162B] border-b-2 border-[#E84D2A]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Listing Details
          </button>

          <button
            onClick={() => setActiveTab("interested")}
            className={`px-6 py-4 text-sm font-semibold transition-colors ${
              activeTab === "interested"
                ? "text-[#0D162B] border-b-2 border-[#E84D2A]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Interested Users
          </button>
        </div>

        <div className="p-6">
          {activeTab === "details" ? (
            <ListingInfoTab />
          ) : (
            <InterestedUsersTab />
          )}
        </div>
      </div>
    </div>
  );
}
