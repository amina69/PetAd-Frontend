import { useMemo, useState } from "react";
import { adoptionService } from "../api/adoptionService";
import { FormSelect } from "../components/ui/formSelect";
import { InterestPetCard, type Pet } from "../components/ui/InterestPetCard";
import { RatingModal } from "../components/ui/RatingModal";

import catImg from "../assets/cat.png";
import dogImg from "../assets/dog.png";
import parrotImg from "../assets/parrot.png";

const MOCK_PETS: Pet[] = [
  {
    id: "1",
    name: "Pet For Adoption",
    breed: "Dog, German Shepard",
    category: "dog",
    age: "4yrs old",
    location: "Mainland, Lagos Nigeria",
    imageUrl: dogImg,
    isFavourite: false,
    isInterested: true,
    consent: "awaiting",
    adoption: false,
  },
  {
    id: "2",
    name: "Pet For Adoption",
    breed: "Parrot",
    category: "bird",
    age: "4yrs old",
    location: "Mainland, Lagos Nigeria",
    imageUrl: parrotImg,
    isFavourite: false,
    isInterested: true,
    consent: "granted",
    adoption: false,
  },
  {
    id: "3",
    name: "Buddy",
    breed: "Cat, Persian",
    category: "cat",
    age: "4yrs old",
    location: "Mainland, Lagos Nigeria",
    imageUrl: catImg,
    isFavourite: false,
    isInterested: true,
    consent: "granted",
    adoption: true,
    completed: false,
  },
];

const CATEGORY_OPTIONS = [
  { value: "all", label: "Category: All" },
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "bird", label: "Bird" },
];

export default function InterestPage() {
  const [pets, setPets] = useState<Pet[]>(MOCK_PETS);
  const [locationFilter, setLocationFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const filteredPets = useMemo(() => {
    return pets.filter((pet) => {
      if (!pet.isInterested) return false;

      const matchesCategory =
        categoryFilter === "all" || pet.category === categoryFilter;

      const matchesLocation =
        locationFilter === "" ||
        pet.location.toLowerCase().includes(locationFilter.toLowerCase());

      return matchesCategory && matchesLocation;
    });
  }, [pets, locationFilter, categoryFilter]);

  const handleRemove = (id: string) => {
    setPets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isInterested: false } : p)),
    );
  };

  const handleViewDetails = () => {
    // placeholder for navigation to listing detail page
  };

  const handleStartAdoption = (id: string) => {
    setPets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, adoption: true } : p)),
    );
  };

  const handleConfirmCompletion = (id: string) => {
    setPets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, completed: true } : p)),
    );
  };

  const handleRateAdoption = (id: string, petName: string) => {
    setSelectedPet({ id, name: petName });
    setRatingModalOpen(true);
  };

  const handleRatingSubmit = async (rating: number, feedback: string) => {
    if (!selectedPet) return;

    try {
      await adoptionService.submitRating({
        rating,
        feedback,
        adoptionId: selectedPet.id,
        petId: selectedPet.id,
      });
      setRatingModalOpen(false);
      setSelectedPet(null);
    } catch (error) {
      console.error("Failed to submit rating:", error);
    }
  };

  const handleRatingModalClose = () => {
    setRatingModalOpen(false);
    setSelectedPet(null);
  };

  const handleResetFilters = () => {
    setLocationFilter("");
    setCategoryFilter("all");
  };

  return (
    <div className="min-h-screen bg-[white] pb-24" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="bg-white h-6" />

      <div className="max-full px-4 lg:px-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h1 className="text-[20px] font-semibold text-[#001323]" style={{ lineHeight: "36px" }}>
            Interest ({filteredPets.length})
            </h1>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-[220px]">
              {/* <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <svg
                  className="w-4.5 h-4.5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="filter by Location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[14px] outline-none focus:border-[#0D162B] transition-colors"
              /> */}
            </div>

            <div className="w-[160px] relative">
              {/* <FormSelect
                id="category-filter"
                label=""
                options={CATEGORY_OPTIONS}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="!py-2.5"
              /> */}
            </div>

            {/* <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-medium text-[14px] hover:bg-gray-200 transition-colors"
            >
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reset
            </button> */}
          </div>
        </div>

        {filteredPets.length > 0 ? (
          <div>
            <div className="hidden lg:grid grid-cols-[2fr_1.2fr_1.2fr_1.5fr] gap-6 pb-3 text-[14px] font-semibold text-[#001323] uppercase tracking-wider">
              <span>Details</span>
              <span>Location</span>
              <span>Status</span>
              <span></span>
            </div>

            <div className="flex flex-col gap-3">
              {filteredPets.map((pet) => (
                <InterestPetCard
                  key={pet.id}
                  pet={pet}
                  onRemove={handleRemove}
                  onViewDetails={handleViewDetails}
                  onStartAdoption={handleStartAdoption}
                  onConfirmCompletion={handleConfirmCompletion}
                  onRateAdoption={handleRateAdoption}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-2xl border border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-10 h-10 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No interests found
            </h3>
            <p className="text-gray-500 max-w-[300px]">
              {pets.filter((p) => p.isInterested).length > 0
                ? "No pets match your current filter criteria. Try resetting the filters."
                : "You haven't expressed interest in adopting any pets yet."}
            </p>
            {pets.filter((p) => p.isInterested).length > 0 && (
              <button
                onClick={handleResetFilters}
                className="mt-6 text-[#E84D2A] font-medium hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      <RatingModal
        isOpen={ratingModalOpen}
        onClose={handleRatingModalClose}
        onSubmit={handleRatingSubmit}
        petName={selectedPet?.name}
      />
    </div>
  );
}
