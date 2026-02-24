import { useState, useMemo } from "react";
import { PetCard, type Pet } from "../ui/PetCard";
import { FormSelect } from "../ui/formSelect";

// Import images
import dogImg from "../../assets/dog.png";
import dog1Img from "../../assets/dog_1.png";
import parrotImg from "../../assets/parrot.png";
import parrot1Img from "../../assets/parrot_1.png";
import catImg from "../../assets/cat.png";
import cat1Img from "../../assets/cat_1.png";
import cat2Img from "../../assets/cat_2.png";

// Mock Data – 12 pets for the 4×3 grid
const MOCK_LISTINGS: Pet[] = [
    {
        id: "h1",
        name: "Pet For Adoption",
        breed: "Dog, German Shepard",
        category: "dog",
        age: "4yrs old",
        location: "Mainland, Lagos Nigeria",
        imageUrl: dogImg,
        isFavourite: false,
        isInterested: false,
    },
    {
        id: "h2",
        name: "Pet For Adoption",
        breed: "Cat, Tabby",
        category: "cat",
        age: "4yrs old",
        location: "Mainland, Lagos Nigeria",
        imageUrl: cat1Img,
        isFavourite: false,
        isInterested: false,
    },
    {
        id: "h3",
        name: "Pet For Adoption",
        breed: "Parrot",
        category: "bird",
        age: "4yrs old",
        location: "Mainland, Lagos Nigeria",
        imageUrl: parrotImg,
        isFavourite: false,
        isInterested: false,
    },
    {
        id: "h4",
        name: "Pet For Adoption",
        breed: "Cat, Persian",
        category: "cat",
        age: "4yrs old",
        location: "Mainland, Lagos Nigeria",
        imageUrl: catImg,
        isFavourite: false,
        isInterested: false,
    },
    {
        id: "h5",
        name: "Pet For Adoption",
        breed: "Dog, Golden Retriever",
        category: "dog",
        age: "4yrs old",
        location: "Ikeja, Lagos Nigeria",
        imageUrl: dog1Img,
        isFavourite: false,
        isInterested: false,
    },
    {
        id: "h6",
        name: "Pet For Adoption",
        breed: "Cat, Siamense",
        category: "cat",
        age: "4yrs old",
        location: "Ikeja, Lagos Nigeria",
        imageUrl: cat2Img,
        isFavourite: false,
        isInterested: false,
    },
    {
        id: "h7",
        name: "Pet For Adoption",
        breed: "Parrot, macaw",
        category: "bird",
        age: "1yr old",
        location: "Mainland, Lagos Nigeria",
        imageUrl: parrot1Img,
        isFavourite: false,
        isInterested: false,
    },
    {
        id: "h8",
        name: "Pet For Adoption",
        breed: "Parrot",
        category: "bird",
        age: "4yrs old",
        location: "Abuja, Nigeria",
        imageUrl: parrotImg,
        isFavourite: false,
        isInterested: false,
    },
    {
        id: "h9",
        name: "Pet For Adoption",
        breed: "Dog, German Shepard",
        category: "dog",
        age: "4yrs old",
        location: "Abuja, Nigeria",
        imageUrl: dog1Img,
        isFavourite: false,
        isInterested: false,
    },
    {
        id: "h10",
        name: "Pet For Adoption",
        breed: "Cat, Persian",
        category: "cat",
        age: "4yrs old",
        location: "Mainland, Lagos Nigeria",
        imageUrl: cat1Img,
        isFavourite: false,
        isInterested: false,
    },
    {
        id: "h11",
        name: "Pet For Adoption",
        breed: "Cat, Tabby",
        category: "cat",
        age: "3yrs old",
        location: "Ikeja, Lagos Nigeria",
        imageUrl: cat2Img,
        isFavourite: false,
        isInterested: false,
    },
    {
        id: "h12",
        name: "Pet For Adoption",
        breed: "Dog, Puppy",
        category: "dog",
        age: "6mos old",
        location: "Mainland, Lagos Nigeria",
        imageUrl: dogImg,
        isFavourite: false,
        isInterested: false,
    },
];

const CATEGORY_OPTIONS = [
    { value: "all", label: "Category: All" },
    { value: "dog", label: "Dog" },
    { value: "cat", label: "Cat" },
    { value: "bird", label: "Bird" },
];

export function PetListingSection() {
    const [pets, setPets] = useState<Pet[]>(MOCK_LISTINGS);
    const [locationFilter, setLocationFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");

    // Filter logic
    const filteredPets = useMemo(() => {
        return pets.filter((pet) => {
            const matchesCategory =
                categoryFilter === "all" || pet.category === categoryFilter;
            const matchesLocation =
                locationFilter === "" ||
                pet.location.toLowerCase().includes(locationFilter.toLowerCase());
            return matchesCategory && matchesLocation;
        });
    }, [pets, locationFilter, categoryFilter]);

    // Action Handlers
    const handleToggleFavourite = (id: string) => {
        setPets((prev) =>
            prev.map((p) =>
                p.id === id ? { ...p, isFavourite: !p.isFavourite } : p
            )
        );
    };

    const handleToggleInterested = (id: string) => {
        setPets((prev) =>
            prev.map((p) =>
                p.id === id ? { ...p, isInterested: !p.isInterested } : p
            )
        );
    };

    const handleResetFilters = () => {
        setLocationFilter("");
        setCategoryFilter("all");
    };

    return (
        <section className="bg-white py-14 lg:py-20">
            <div className="max-w-[1240px] mx-auto px-6 lg:px-8">

                {/* ── Header & Filters ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <h2 className="text-[22px] font-bold text-[#0D162B]">
                        Available For Adoption ({filteredPets.length})
                    </h2>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Location Filter */}
                        <div className="relative w-full sm:w-[220px]">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <svg className="w-[18px] h-[18px] text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Filter by Location"
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[14px] outline-none focus:border-[#0D162B] transition-colors"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="w-[170px]">
                            <FormSelect
                                id="home-category-filter"
                                label=""
                                options={CATEGORY_OPTIONS}
                                value={categoryFilter}
                                onChange={(e: any) => setCategoryFilter(e.target.value)}
                                className="!py-2.5"
                            />
                        </div>

                        {/* Reset Button */}
                        <button
                            onClick={handleResetFilters}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium text-[14px] hover:bg-gray-50 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Reset
                        </button>
                    </div>
                </div>

                {/* ── Pet Card Grid ── */}
                {filteredPets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredPets.map((pet) => (
                            <PetCard
                                key={pet.id}
                                pet={pet}
                                onToggleFavourite={handleToggleFavourite}
                                onToggleInterested={handleToggleInterested}
                            />
                        ))}
                    </div>
                ) : (
                    /* ── Empty State ── */
                    <div className="flex flex-col items-center justify-center py-32 text-center bg-[#F9FAFB] rounded-2xl border border-gray-100">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No pets found</h3>
                        <p className="text-gray-500 max-w-[300px]">
                            No pets match your current filter criteria. Try adjusting the filters.
                        </p>
                        <button
                            onClick={handleResetFilters}
                            className="mt-6 text-[#E84D2A] font-medium hover:underline"
                        >
                            Clear All Filters
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
