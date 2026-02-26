export default function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between border-b border-gray-200 pb-2 text-sm">
      <span className="text-gray-500">{label}:</span>
      <span className="font-medium text-[#0D162B]">{value}</span>
    </div>
  );
}
