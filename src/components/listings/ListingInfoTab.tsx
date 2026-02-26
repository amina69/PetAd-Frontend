import { useState } from "react";
import InfoRow from "./InfoRow";
import StatusInfo from "./StatusInfo";

export default function ListingInfoTab() {
  const mockListing = {
    name: "Pet For Adoption",
    category: "ABSOLUTE ADOPTION",
    species: "Dog",
    breed: "German Shepard",
    age: "4 Years Old",
    gender: "Female",
    vaccinated: "Yes",
    status: "Pending Consent",
    images: [
      "/src/assets/dog.png",
      "/src/assets/dog.png",
      "/src/assets/dog.png",
      "/src/assets/dog.png",
    ],
  };

  const [activeImage, setActiveImage] = useState(0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[120px_1fr_1fr] gap-8">
      <div className="hidden lg:flex flex-col gap-4">
        {mockListing.images.map((img, i) => (
          <img
            key={i}
            src={img}
            onClick={() => setActiveImage(i)}
            className={`w-24 h-24 object-cover rounded-lg cursor-pointer border-2 ${
              activeImage === i ? "border-[#E84D2A]" : "border-transparent"
            }`}
          />
        ))}
      </div>

      <div className="rounded-xl overflow-hidden">
        <img
          src={mockListing.images[activeImage]}
          className="w-full h-[420px] object-cover rounded-xl"
        />
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-bold text-[#0D162B]">
            {mockListing.name}
          </h2>
          <p className="text-sm text-gray-400 mt-1 tracking-wide">
            {mockListing.category}
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 space-y-4 border border-gray-100">
          <InfoRow label="Pet Type" value={mockListing.species} />
          <InfoRow label="Breed" value={mockListing.breed} />
          <InfoRow label="Age" value={mockListing.age} />
          <InfoRow label="Gender" value={mockListing.gender} />
          <InfoRow label="Vaccinated Status" value={mockListing.vaccinated} />
        </div>

        <StatusInfo status={mockListing.status} />

        <div className="flex gap-4 mt-4">
          <button className="flex-1 py-3 rounded-lg bg-red-50 text-red-600 font-semibold">
            Delete Listing
          </button>
          <button className="flex-1 py-3 rounded-lg border border-gray-300 font-semibold">
            Edit Details
          </button>
        </div>
      </div>
    </div>
  );
}
