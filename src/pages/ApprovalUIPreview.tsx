import { MultiPartyApprovalUI } from "../components/approval/MultiPartyApprovalUI";
import type { ApprovalDecision } from "../types/adoption";

export default function ApprovalUIPreview() {
  const mockRequired = ["Shelter", "Admin", "Veterinary Inspector", "Agent"];
  
  const mockGiven: ApprovalDecision[] = [
    {
      id: "dec-1",
      approverName: "Happy Paws Shelter",
      approverRole: "Shelter",
      status: "APPROVED",
      timestamp: new Date().toISOString(),
    },
    {
      id: "dec-2",
      approverName: "Dr. Smith",
      approverRole: "Veterinary Inspector",
      status: "REJECTED",
      reason: "Health certificate is missing some required fields.",
      timestamp: new Date().toISOString(),
    }
  ];

  const mockPending = ["Admin", "Agent"];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Multi-party Approval UI</h1>
          <p className="text-gray-600">Previewing the approval status component with various states.</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">Approval Status List</h2>
          <MultiPartyApprovalUI 
            required={mockRequired}
            given={mockGiven}
            pending={mockPending}
          />
        </section>

        <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">Features Demonstrated:</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <span><strong>Approved state:</strong> Green check icon and initials circle.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <span><strong>Rejected state:</strong> Red X icon and initials circle.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0" />
              <span><strong>Pending state:</strong> Clock icon and lighter style.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <span><strong>Accessibility:</strong> Full ARIA label support for screen readers.</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
