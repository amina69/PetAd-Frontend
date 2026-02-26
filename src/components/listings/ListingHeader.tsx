export default function ListingHeader() {
  return (
    <div className="hidden md:grid md:grid-cols-12 gap-4 md:gap-6 pb-4 px-6 text-sm font-semibold text-gray-900 font-bold">
      <div className="md:col-span-4 font-bold">Details</div>
      <div className="md:col-span-3 font-bold">Status</div>
      <div className="md:col-span-1 font-bold">Interests</div>
      <div className="md:col-span-2"></div>
    </div>
  );
}
