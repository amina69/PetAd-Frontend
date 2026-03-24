export default function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 text-sm ${
        !last ? "border-b border-gray-100" : ""
      }`}
    >
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-[#0D162B]">{value}</span>
    </div>
  );
}
