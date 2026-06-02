import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RoleGuard } from "../components/auth/RoleGuard";

// Mock user data
const MOCK_USER = {
    fullName: "Angela Christopher",
    email: "Angela@gmail.com",
    role: "User",
    joinDate: "Jan 2025",
};

export default function UserDashboardPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Simulate authentication check
        const checkAuth = setTimeout(() => {
            setIsAuthenticated(true);
            setIsLoading(false);
        }, 800);

        return () => clearTimeout(checkAuth);
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#E84D2A] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        navigate("/login");
        return null;
    }

    return (
        <div className="min-h-full bg-[#F7F7F8] py-6 sm:py-8 lg:py-10">
            <div className="max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-[28px] font-bold text-[#0D162B] mb-2">User Dashboard</h1>
                    <p className="text-[16px] text-[#7A8495]">Welcome back, {MOCK_USER.fullName}! Manage your account here.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Profile Overview Card */}
                    <div className="bg-white border border-[#EBEDF0] rounded-xl p-6 shadow-sm">
                        <h2 className="text-[18px] font-semibold text-[#0D162B] mb-4">Profile Overview</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[14px] text-[#98A1AF]">Name</p>
                                <p className="font-medium text-[#0D162B]">{MOCK_USER.fullName}</p>
                            </div>
                            <div>
                                <p className="text-[14px] text-[#98A1AF]">Email</p>
                                <p className="font-medium text-[#0D162B]">{MOCK_USER.email}</p>
                            </div>
                            <div>
                                <p className="text-[14px] text-[#98A1AF]">Member Since</p>
                                <p className="font-medium text-[#0D162B]">{MOCK_USER.joinDate}</p>
                            </div>
                            <button
                                onClick={() => navigate("/profile")}
                                className="w-full mt-4 py-2.5 rounded-lg bg-[#EAEAEA] text-[#0D162B] font-semibold text-[14px] hover:bg-[#E2E2E2] transition-colors"
                            >
                                Edit Profile
                            </button>
                        </div>
                    </div>

                    {/* Quick Actions Card */}
                    <div className="bg-white border border-[#EBEDF0] rounded-xl p-6 shadow-sm lg:col-span-2">
                        <h2 className="text-[18px] font-semibold text-[#0D162B] mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => navigate("/listings")}
                                className="p-4 border border-[#ECEFF3] rounded-xl hover:border-[#E84D2A] hover:bg-orange-50 transition-all text-left group"
                            >
                                <h3 className="font-semibold text-[#0D162B] group-hover:text-[#E84D2A]">View Pet Listings</h3>
                                <p className="text-[13px] text-[#7A8495] mt-1">Browse available pets for adoption</p>
                            </button>
                            <button
                                onClick={() => navigate("/home")}
                                className="p-4 border border-[#ECEFF3] rounded-xl hover:border-[#E84D2A] hover:bg-orange-50 transition-all text-left group"
                            >
                                <h3 className="font-semibold text-[#0D162B] group-hover:text-[#E84D2A]">List a Pet</h3>
                                <p className="text-[13px] text-[#7A8495] mt-1">Create a new adoption listing</p>
                            </button>
                        </div>

                        {/* Protected Administrative Tools Section */}
                        <RoleGuard allowedRoles={["Admin", "SuperAdmin"]} userRole={MOCK_USER.role}>
                            <div className="mt-6 pt-6 border-t border-[#ECEFF3]">
                                <h3 className="text-[14px] font-semibold text-[#0D162B] mb-3">Administrative Tools</h3>
                                <button
                                    onClick={() => navigate("/admin/dashboard")}
                                    className="px-5 py-2.5 bg-[#0D162B] text-white rounded-xl font-semibold text-[13px] hover:bg-gray-900 transition-colors shadow-sm"
                                >
                                    Go to Admin Dashboard
                                </button>
                            </div>
                        </RoleGuard>
                    </div>
                </div>
            </div>
        </div>
    );
}
