import { Link } from 'react-router-dom';
import { ClockIcon, CheckCircleIcon, EditIcon, TrashIcon } from '../icons/StatusIcons';

interface Listing {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: string;
  status: string;
  interests: number;
  imageUrl: string;
}

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  return (
    <div className="bg-white border text-gray-900 border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-6 relative overflow-hidden">
      
      {/* Image - Full Height */}
      <div className="md:col-span-2 h-48 md:h-auto">
        <img 
          src={listing.imageUrl} 
          alt={listing.name} 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content Area */}
      <div className="md:col-span-10 flex flex-col md:grid md:grid-cols-10 gap-4 p-4 sm:p-6 md:py-6 md:pr-6 md:pl-0">
        
        {/* Details */}
        <div className="md:col-span-4 flex flex-col justify-center">
          <h3 className="font-bold text-[17px] text-gray-900">{listing.name}</h3>
          <p className="text-sm text-gray-400 mt-1 font-medium">
            {listing.species}, {listing.breed}, {listing.age}
          </p>
        </div>

        {/* Status */}
        <div className="md:col-span-3 flex items-center">
          <div className="flex items-center">
            {listing.status === "Consent Granted" ? <CheckCircleIcon /> : <ClockIcon />}
            <span className="font-semibold text-[15px]">{listing.status}</span>
          </div>
        </div>

        {/* Interests */}
        <div className="md:col-span-1 flex items-center font-medium">
          {listing.interests}
        </div>

        {/* Actions */}
        <div className="md:col-span-2 flex items-center justify-start md:justify-end gap-3">
          {listing.status !== "Adoption In-progress" && (
            <div className="flex gap-2">
              <button className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                <EditIcon />
              </button>
              <button className="flex items-center justify-center w-8 h-8 rounded-full bg-red-50 border border-red-100 hover:bg-red-100 transition-colors">
                <TrashIcon />
              </button>
            </div>
          )}
          <Link 
            to={`/listings/${listing.id}`} 
            className="text-gray-900 font-semibold text-sm underline underline-offset-4 hover:text-gray-600 transition-colors whitespace-nowrap"
          >
            View More
          </Link>
        </div>
      </div>
    </div>
  );
}
