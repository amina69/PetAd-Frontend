import { useState } from "react";
import InfoRow from "./InfoRow";
import StatusInfo from "./StatusInfo";
import dogImage from "../../assets/dog.png";

const mockListing = {
  name: "Pet For Adoption",
  category: "ABSOLUTE ADOPTION",
  species: "Dog",
  breed: "German Shepard",
  age: "4 Years Old",
  gender: "Female",
  vaccinated: "Yes",
  status: "Pending Consent",
  images: [dogImage, dogImage, dogImage, dogImage],
};

export default function ListingInfoTab() {
  const [activeImage, setActiveImage] = useState(0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr_1fr] gap-6">
      {/* Thumbnails */}
      <div className="hidden lg:flex flex-col gap-3">
        {mockListing.images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveImage(i)}
            className={`w-[152px] h-[120px] rounded-xl overflow-hidden border-2 transition-all ${
              activeImage === i
                ? "border-[#E84D2A]"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <img
              src={img}
              alt={`Pet image ${i + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Main image */}
      <div className="rounded-2xl overflow-hidden bg-gray-100">
        <img
          src={mockListing.images[activeImage]}
          alt={mockListing.name}
          className="w-full h-[420px] object-cover"
        />
        {/* Mobile thumbnails */}
        <div className="flex gap-2 p-3 lg:hidden">
          {mockListing.images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImage(i)}
              className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                activeImage === i ? "border-[#E84D2A]" : "border-transparent"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Info panel */}
      <div className="flex flex-col gap-5">
        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-[#0D162B]">
            {mockListing.name}
          </h2>
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mt-1">
            {mockListing.category}
          </p>
        </div>

        {/* Divider */}
        <hr className="border-gray-100" />

        {/* Pet details */}
        <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100">
          <InfoRow label="Pet Type:" value={mockListing.species} />
          <InfoRow label="Breed:" value={mockListing.breed} />
          <InfoRow label="Age:" value={mockListing.age} />
          <InfoRow label="Gender:" value={mockListing.gender} />
          <InfoRow
            label="Vaccinated Status:"
            value={mockListing.vaccinated}
            last
          />
        </div>

        {/* Status */}
        <StatusInfo status={mockListing.status} />

        {/* Actions */}
        <div className="flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-500 font-semibold text-sm hover:bg-red-100 transition-colors">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete Listing
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-300 font-semibold text-sm text-[#0D162B] hover:bg-gray-50 transition-colors">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            Edit Details
          </button>
        </div>
      </div>
    </div>
  );
}
