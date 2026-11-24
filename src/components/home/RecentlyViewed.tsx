import { Link } from "react-router-dom";
import { useRecentlyViewed } from "../../hooks/useRecentlyViewed";

export function RecentlyViewed() {
  const {
    recentlyViewedIds,
    pets,
    isLoading,
    isError,
    clearRecentlyViewed,
  } = useRecentlyViewed();

  if (
    recentlyViewedIds.length === 0 ||
    (!isLoading && !isError && pets.length === 0)
  ) {
    return null;
  }

  return (
    <section
      aria-labelledby="recently-viewed-heading"
      className="bg-white py-10 lg:py-14"
    >
      <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2
            id="recently-viewed-heading"
            className="text-[22px] font-bold text-[#0D162B]"
          >
            Recently viewed
          </h2>
          <button
            type="button"
            onClick={clearRecentlyViewed}
            className="text-sm font-medium text-[#E84D2A] hover:underline"
          >
            Clear
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading recently viewed pets...</p>
        ) : isError ? (
          <p role="status" className="text-sm text-gray-500">
            Recently viewed pets could not be loaded.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pets.map((pet) => (
              <Link
                key={pet.id}
                to={`/listings/${pet.id}`}
                className="overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <img
                  src={pet.imageUrl}
                  alt={pet.name}
                  loading="lazy"
                  className="h-[220px] w-full bg-gray-100 object-cover"
                />
                <div className="space-y-1 p-5">
                  <h3 className="font-bold text-[#001323]">{pet.name}</h3>
                  <p className="text-sm text-[#686677]">
                    {[pet.species, pet.breed, pet.age]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
