import { useState, useEffect } from 'react';
import ListingCard from '../components/listings/ListingCard';
import ListingHeader from '../components/listings/ListingHeader';
import { listingsService } from '../api/listingsService';
import type { Listing } from '../types';

export default function ListingsPage() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchListings = async () => {
            try {
                setIsLoading(true);
                const data = await listingsService.getListings();
                setListings(data);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch listings:", err);
                setError("Failed to load listings. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchListings();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center text-red-500">
                {error}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white py-6 sm:py-10 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">Listings ({listings.length})</h1>
                
                <ListingHeader />

                <div className="space-y-4">
                    {listings.map((listing) => (
                        <ListingCard key={listing.id} listing={listing} />
                    ))}
                </div>
            </div>
        </div>
    );
}
