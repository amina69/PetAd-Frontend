import { useState } from "react";
import ownerImg from "../assets/owner.png";

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState<"adoption" | "listing">("adoption");

    return (
        <div className="min-h-screen flex flex-col pb-12">
            {/* ── Navbar Placeholder ── */}
            <div className="bg-white border-b border-gray-100 h-20 mb-8 shrink-0" />

            <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-6 lg:gap-8 flex-1">

                {/* Left Sidebar - Profile Details */}
                <div className="w-full md:w-[340px] lg:w-[380px] border border-gray-200 rounded-2xl p-6 sm:p-8 md:p-10 bg-white flex flex-col items-center shadow-sm">

                    {/* Avatar Container */}
                    <div className="relative mb-4">
                        <div className="w-60 h-60 rounded-full overflow-hidden border-4 border-white shadow-sm">
                            <img src={ownerImg} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <button className="absolute bottom-5 right-5 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    </div>

                    {/* Verification Badge */}
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-[#E8F5E9] text-[#22C55E] rounded-md mb-8">
                        <span className="text-[13px] font-semibold tracking-wide">Account Verified</span>
                        <svg className="w-[14px] h-[14px]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>

                    {/* Profile Information List */}
                    <div className="w-full flex flex-col">

                        {/* Field 1 */}
                        <div className="py-4 border-b border-gray-100">
                            <p className="text-[13px] text-gray-400 mb-1">Full Name</p>
                            <p className="text-[15px] font-semibold text-[#0D162B]">Angela Christoper</p>
                        </div>

                        {/* Field 2 */}
                        <div className="py-4 border-b border-gray-100">
                            <p className="text-[13px] text-gray-400 mb-1">Email Address</p>
                            <p className="text-[15px] font-semibold text-[#0D162B]">Angela@gmail.com</p>
                        </div>

                        {/* Field 3 */}
                        <div className="py-4 border-b border-gray-100">
                            <p className="text-[13px] text-gray-400 mb-1">Phone Number</p>
                            <p className="text-[15px] font-semibold text-[#0D162B]">+234 903 123 1233</p>
                        </div>

                        {/* Field 4 */}
                        <div className="py-4 pt-4">
                            <p className="text-[13px] text-gray-400 mb-1">Location</p>
                            <p className="text-[15px] font-semibold text-[#0D162B] leading-snug">
                                24 Just Street, Lekki, Lagos, Nigeria
                            </p>
                        </div>

                    </div>
                </div>

                {/* Right Content Area - Tabs & Records */}
                <div className="flex-1 border border-gray-200 rounded-2xl bg-white overflow-hidden flex flex-col shadow-sm min-h-[600px] md:h-[calc(100vh-140px)]">

                    {/* Tabs Header */}
                    <div className="flex bg-white">
                        <button
                            onClick={() => setActiveTab("adoption")}
                            className={`px-8 py-5 text-[15px] font-semibold outline-none transition-all border-r border-b border-gray-200
                                ${activeTab === "adoption"
                                    ? "bg-gray-50 text-[#0D162B] border-b-transparent focus:ring-0"
                                    : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}
                        >
                            Adoption Record
                        </button>
                        <button
                            onClick={() => setActiveTab("listing")}
                            className={`px-8 py-5 text-[15px] font-semibold outline-none transition-all border-r border-b border-gray-200
                                ${activeTab === "listing"
                                    ? "bg-gray-50 text-[#0D162B] border-b-transparent focus:ring-0"
                                    : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}
                        >
                            Listing Record
                        </button>
                        {/* Empty space filler for border styling */}
                        <div className="flex-1 border-b border-gray-200 bg-white" />
                    </div>

                    {/* Tab Content (Empty State) */}
                    <div className="flex-1 flex flex-col items-center justify-center p-8">
                        <h3 className="text-[24px] font-bold text-[#0D162B] mb-2">
                            No Record
                        </h3>
                        <p className="text-[15px] text-gray-500 mb-8">
                            You currently have no {activeTab} record
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-4">
                            <button className="w-full sm:w-auto min-w-[160px] px-8 py-3.5 bg-[#E84D2A] text-white font-semibold text-[15px] rounded-xl hover:bg-[#d4431f] transition-all hover:shadow-lg focus:ring-4 focus:ring-[#E84D2A]/20">
                                List A Pet
                            </button>
                            <button className="w-full sm:w-auto min-w-[160px] px-8 py-3.5 bg-[#0D1B2A] text-white font-semibold text-[15px] rounded-xl hover:bg-gray-900 transition-all hover:shadow-lg focus:ring-4 focus:ring-gray-900/20">
                                Adopt A Pet
                            </button>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
