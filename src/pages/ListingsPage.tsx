import dogImage from '../assets/dog.png';
import dog1Image from '../assets/dog_1.png';
import goldenretrival from "../assets/golden_retriever.png";
import ListingCard from '../components/listings/ListingCard';
import ListingHeader from '../components/listings/ListingHeader';

const mockListings = [
  {
    id: 1,
    name: "Pet For Adoption",
    species: "Dog",
    breed: "German Shepard",
    age: "4yrs old",
    status: "Pending Consent",
    interests: 4,
    imageUrl: dogImage
  },
  {
    id: 2,
    name: "Pet For Adoption",
    species: "Dog",
    breed: "German Shepard",
    age: "4yrs old",
    status: "Consent Granted",
    interests: 2,
    imageUrl: dog1Image
  },
  {
    id: 3,
    name: "Pet For Adoption",
    species: "Dog",
    breed: "German Shepard",
    age: "3yrs old",
    status: "Adoption In-progress",
    interests: 1,
    imageUrl: goldenretrival
  }
];

export default function ListingsPage() {
    return (
        <div className="min-h-screen bg-white py-6 sm:py-10 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">Listings ({mockListings.length})</h1>
                
                <ListingHeader />

                <div className="space-y-4">
                    {mockListings.map((listing) => (
                        <ListingCard key={listing.id} listing={listing} />
                    ))}
                </div>
            </div>
        </div>
    );
}
