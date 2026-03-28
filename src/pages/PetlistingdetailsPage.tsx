import { useState } from "react";
import { useNavigate } from "react-router-dom";
import dogImage from "../assets/dog.png";
import dog1Image from "../assets/dog_1.png";
import goldenRetriever from "../assets/golden_retriever.png";


interface PetListing {
  id: number;
  name: string;
  adoptionType: "Temporary Adoption" | "Absolute Adoption";
  petType: string;
  breed: string;
  age: string;
  gender: string;
  vaccinationStatus: string;
  description: string;
  location: string;
  images: string[];
  owner: {
    name: string;
    avatar: string;
    email: string;
    phone: string;
    location: string;
  };
}

// ─── Mock Data (replace with API call when backend is ready) ──────────────────
const mockPet: PetListing = {
  id: 1,
  name: "Pet For Adoption",
  adoptionType: "Temporary Adoption",
  petType: "Dog",
  breed: "German Shepard",
  age: "4 Years Old",
  gender: "Female",
  vaccinationStatus: "Yes",
  description:
    "This is a loving and playful German Shepherd who enjoys outdoor activities and socializing with people. She is well-trained, obedient, and gets along well with children and other pets. Looking for a caring temporary home where she can be loved and well taken care of.",
  location: "Lagos, Nigeria",
  images: [dogImage, dog1Image, goldenRetriever, dogImage],
  owner: {
    name: "Angela Christoper",
    avatar: "https://i.pravatar.cc/150?img=47",
    email: "*****",
    phone: "*****",
    location: "Lagos, Nigeria",
  },
};

const relatedListings = [
  { id: 2, name: "Pet For Adoption", breed: "Dog, German Shepard, 4yrs old", location: "Mainland, Lagos Nigeria", image: dogImage },
  { id: 3, name: "Pet For Adoption", breed: "Dog, German Shepard, 1yrs old", location: "Mainland, Lagos Nigeria", image: dog1Image },
  { id: 4, name: "Pet For Adoption", breed: "Dog, German Shepard, 4yrs old", location: "Mainland, Lagos Nigeria", image: goldenRetriever },
  { id: 5, name: "Pet For Adoption", breed: "Dog, German Shepard, 4yrs old", location: "Mainland, Lagos Nigeria", image: dog1Image },
];


const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "#E84D2A" : "none"} stroke={filled ? "#E84D2A" : "#666"} strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const PersonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const LocationIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const FlagIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);


const RelatedCard = ({ listing, onClick }: { listing: typeof relatedListings[0]; onClick: () => void }) => {
  const [fav, setFav] = useState(false);
  return (
    <div className="pld-related-card" onClick={onClick}>
      <div className="pld-related-card__img-wrap">
        <img src={listing.image} alt={listing.name} className="pld-related-card__img" />
        <div className="pld-related-card__actions">
          <button className="pld-related-card__action-btn" onClick={(e) => { e.stopPropagation(); setFav(f => !f); }}>
            <HeartIcon filled={fav} />
          </button>
          <button className="pld-related-card__action-btn" onClick={(e) => e.stopPropagation()}>
            <PlusIcon />
          </button>
          <button className="pld-related-card__action-btn" onClick={(e) => e.stopPropagation()}>
            <PersonIcon />
          </button>
        </div>
      </div>
      <div className="pld-related-card__body">
        <p className="pld-related-card__name">{listing.name}</p>
        <p className="pld-related-card__breed">{listing.breed}</p>
        <p className="pld-related-card__location">
          <LocationIcon /> {listing.location}
        </p>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PetListingDetailsPage() {
  const navigate = useNavigate();
  const pet = mockPet; 

  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState<"owner" | "description">("owner");
  const [isFav, setIsFav] = useState(false);
  const [isInterested, setIsInterested] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [intLoading, setIntLoading] = useState(false);

  const handleFav = async () => {
    setFavLoading(true);
    await new Promise(r => setTimeout(r, 500));
    setIsFav(f => !f);
    setFavLoading(false);
  };

  const handleInterest = async () => {
    setIntLoading(true);
    await new Promise(r => setTimeout(r, 500));
    setIsInterested(f => !f);
    setIntLoading(false);
  };

  return (
    <>
      <style>{`
        .pld * { box-sizing: border-box; margin: 0; padding: 0; }
        .pld {
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          background: #fff;
          min-height: 100vh;
          color: #1a1a1a;
        }
        .pld-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px 80px;
        }

        /* ── Top Section ── */
        .pld-top {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 32px;
        }
        @media (max-width: 768px) { .pld-top { grid-template-columns: 1fr; } }

        /* ── Gallery ── */
        .pld-gallery { display: flex; gap: 12px; }
        .pld-gallery__thumbs { display: flex; flex-direction: column; gap: 10px; }
        .pld-gallery__thumb {
          width: 60px; height: 60px;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          transition: border-color 0.18s;
          flex-shrink: 0;
          background: #f0f0f0;
        }
        .pld-gallery__thumb img { width: 100%; height: 100%; object-fit: cover; }
        .pld-gallery__thumb--active { border-color: #E84D2A; }
        .pld-gallery__main {
          flex: 1;
          border-radius: 12px;
          overflow: hidden;
          background: #f0f0f0;
          aspect-ratio: 4/3;
        }
        .pld-gallery__main img { width: 100%; height: 100%; object-fit: cover; }

        /* ── Details Panel ── */
        .pld-details { display: flex; flex-direction: column; gap: 16px; }
        .pld-details__name { font-size: 24px; font-weight: 800; color: #0D162B; letter-spacing: -0.01em; }
        .pld-details__badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          background: #FFF2E5;
          color: #E84D2A;
          border: 1px solid #E84D2A;
          width: fit-content;
        }
        .pld-details__badge--absolute { background: #f0f0f0; color: #333; border-color: #ccc; }

        /* ── Details Table ── */
        .pld-details__table { border: 1px solid #e8e8e8; border-radius: 10px; overflow: hidden; }
        .pld-details__row { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #f0f0f0; }
        .pld-details__row:last-child { border-bottom: none; }
        .pld-details__cell { padding: 12px 16px; font-size: 14px; }
        .pld-details__cell:first-child { color: #888; font-weight: 500; border-right: 1px solid #f0f0f0; }
        .pld-details__cell:last-child { color: #1a1a1a; font-weight: 600; }

        /* ── CTA Buttons ── */
        .pld-cta { display: flex; gap: 12px; }
        .pld-btn {
          flex: 1;
          padding: 12px 20px;
          border-radius: 8px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          border: 1.5px solid transparent;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .pld-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .pld-btn--outline { background: #fff; color: #1a1a1a; border-color: #d0d0d0; }
        .pld-btn--outline:hover:not(:disabled) { border-color: #1a1a1a; background: #f9f9f9; }
        .pld-btn--outline.pld-btn--active { border-color: #E84D2A; color: #E84D2A; }
        .pld-btn--red { background: #E84D2A; color: #fff; border-color: #E84D2A; }
        .pld-btn--red:hover:not(:disabled) { background: #d4431f; border-color: #d4431f; }
        .pld-btn--red.pld-btn--active { background: #0D1B2A; border-color: #0D1B2A; }
        .pld-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: currentColor;
          border-radius: 50%;
          animation: pld-spin 0.6s linear infinite;
          display: inline-block;
        }
        @keyframes pld-spin { to { transform: rotate(360deg); } }
        .pld-terms { font-size: 13px; color: #666; text-decoration: underline; cursor: pointer; width: fit-content; background: none; border: none; font-family: inherit; }
        .pld-terms:hover { color: #E84D2A; }

        /* ── Tabs ── */
        .pld-tabs {
          border-bottom: 1.5px solid #e8e8e8;
          display: flex;
          margin-bottom: 24px;
        }
        .pld-tab {
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          color: #888;
          cursor: pointer;
          border-bottom: 2.5px solid transparent;
          margin-bottom: -1.5px;
          transition: all 0.18s;
          background: none;
          border-top: none;
          border-left: none;
          border-right: none;
          font-family: inherit;
        }
        .pld-tab:hover { color: #1a1a1a; }
        .pld-tab--active { color: #1a1a1a; border-bottom-color: #1a1a1a; }

        /* ── Owner Info ── */
        .pld-owner { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .pld-owner__avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; background: #f0f0f0; flex-shrink: 0; }
        .pld-owner__fields { display: flex; gap: 40px; flex: 1; flex-wrap: wrap; }
        .pld-owner__field { display: flex; flex-direction: column; gap: 3px; }
        .pld-owner__field-label { font-size: 11px; color: #aaa; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }
        .pld-owner__field-value { font-size: 14px; font-weight: 600; color: #1a1a1a; }
        .pld-owner__report {
          padding: 8px 16px;
          border: 1.5px solid #e0e0e0;
          border-radius: 8px;
          background: #fff;
          color: #c62828;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background 0.15s, border-color 0.15s;
          font-family: inherit;
          white-space: nowrap;
        }
        .pld-owner__report:hover { background: #ffeaea; border-color: #ef9a9a; }

        /* ── Description ── */
        .pld-description { font-size: 15px; line-height: 1.7; color: #444; max-width: 680px; }

        /* ── Divider ── */
        .pld-divider { height: 1px; background: #f0f0f0; margin: 32px 0; }

        /* ── Related Listings ── */
        .pld-related__title { font-size: 20px; font-weight: 800; color: #0D162B; margin-bottom: 20px; }
        .pld-related__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 900px) { .pld-related__grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 500px) { .pld-related__grid { grid-template-columns: 1fr; } }

        /* ── Related Card ── */
        .pld-related-card { border-radius: 12px; overflow: hidden; cursor: pointer; border: 1px solid #f0f0f0; transition: box-shadow 0.2s; }
        .pld-related-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
        .pld-related-card__img-wrap { position: relative; aspect-ratio: 1; overflow: hidden; background: #f0f0f0; }
        .pld-related-card__img { width: 100%; height: 100%; object-fit: cover; }
        .pld-related-card__actions { position: absolute; top: 8px; right: 8px; display: flex; flex-direction: column; gap: 6px; }
        .pld-related-card__action-btn {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: rgba(255,255,255,0.9);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }
        .pld-related-card__action-btn:hover { background: #fff; }
        .pld-related-card__body { padding: 10px 12px; }
        .pld-related-card__name { font-size: 13px; font-weight: 700; color: #0D162B; margin-bottom: 2px; }
        .pld-related-card__breed { font-size: 11px; color: #888; margin-bottom: 4px; }
        .pld-related-card__location { font-size: 11px; color: #aaa; display: flex; align-items: center; gap: 3px; }

        @media (max-width: 600px) {
          .pld-cta { flex-direction: column; }
          .pld-owner { flex-direction: column; align-items: flex-start; }
          .pld-owner__fields { flex-direction: column; gap: 12px; }
        }
      `}</style>

      <div className="pld">
        <div className="pld-container">

          {/* ── Top Section ── */}
          <div className="pld-top">

            {/* Left — Gallery */}
            <div className="pld-gallery">
              <div className="pld-gallery__thumbs">
                {pet.images.map((img, i) => (
                  <div
                    key={i}
                    className={`pld-gallery__thumb ${i === activeImage ? "pld-gallery__thumb--active" : ""}`}
                    onClick={() => setActiveImage(i)}
                  >
                    <img src={img} alt={`Pet image ${i + 1}`} />
                  </div>
                ))}
              </div>
              <div className="pld-gallery__main">
                <img src={pet.images[activeImage]} alt={pet.name} />
              </div>
            </div>

            {/* Right — Details */}
            <div className="pld-details">
              <h1 className="pld-details__name">{pet.name}</h1>
              <span className={`pld-details__badge ${pet.adoptionType === "Absolute Adoption" ? "pld-details__badge--absolute" : ""}`}>
                {pet.adoptionType}
              </span>

              <div className="pld-details__table">
                <div className="pld-details__row">
                  <div className="pld-details__cell">Pet Type</div>
                  <div className="pld-details__cell">{pet.petType}</div>
                </div>
                <div className="pld-details__row">
                  <div className="pld-details__cell">Breed</div>
                  <div className="pld-details__cell">{pet.breed}</div>
                </div>
                <div className="pld-details__row">
                  <div className="pld-details__cell">Age</div>
                  <div className="pld-details__cell">{pet.age}</div>
                </div>
                <div className="pld-details__row">
                  <div className="pld-details__cell">Gender</div>
                  <div className="pld-details__cell">{pet.gender}</div>
                </div>
                <div className="pld-details__row">
                  <div className="pld-details__cell">Vaccinated Status</div>
                  <div className="pld-details__cell">{pet.vaccinationStatus}</div>
                </div>
              </div>

              <div className="pld-cta">
                <button
                  className={`pld-btn pld-btn--outline ${isFav ? "pld-btn--active" : ""}`}
                  onClick={handleFav}
                  disabled={favLoading}
                >
                  {favLoading ? <span className="pld-spinner" /> : <HeartIcon filled={isFav} />}
                  {isFav ? "Saved" : "Add To Favourites"}
                </button>
                <button
                  className={`pld-btn pld-btn--red ${isInterested ? "pld-btn--active" : ""}`}
                  onClick={handleInterest}
                  disabled={intLoading}
                >
                  {intLoading ? <span className="pld-spinner" /> : null}
                  {isInterested ? "Interested ✓" : "Show Interest"}
                </button>
              </div>

              <button className="pld-terms">Adoption, Terms & Condition</button>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="pld-tabs">
            <button className={`pld-tab ${activeTab === "owner" ? "pld-tab--active" : ""}`} onClick={() => setActiveTab("owner")}>
              Pet Owner's Info
            </button>
            <button className={`pld-tab ${activeTab === "description" ? "pld-tab--active" : ""}`} onClick={() => setActiveTab("description")}>
              Description
            </button>
          </div>

          {/* ── Tab Content ── */}
          {activeTab === "owner" ? (
            <div className="pld-owner">
              <img src={pet.owner.avatar} alt={pet.owner.name} className="pld-owner__avatar" />
              <div className="pld-owner__fields">
                <div className="pld-owner__field">
                  <span className="pld-owner__field-label">Full Name</span>
                  <span className="pld-owner__field-value">{pet.owner.name}</span>
                </div>
                <div className="pld-owner__field">
                  <span className="pld-owner__field-label">Email Address</span>
                  <span className="pld-owner__field-value">{pet.owner.email}</span>
                </div>
                <div className="pld-owner__field">
                  <span className="pld-owner__field-label">Phone Number</span>
                  <span className="pld-owner__field-value">{pet.owner.phone}</span>
                </div>
                <div className="pld-owner__field">
                  <span className="pld-owner__field-label">Location</span>
                  <span className="pld-owner__field-value">{pet.owner.location}</span>
                </div>
              </div>
              <button className="pld-owner__report">
                <FlagIcon /> Report Account
              </button>
            </div>
          ) : (
            <p className="pld-description">{pet.description}</p>
          )}

          <div className="pld-divider" />

          {/* ── Related Listings ── */}
          <div>
            <h2 className="pld-related__title">Related Listings</h2>
            <div className="pld-related__grid">
              {relatedListings.map((listing) => (
                <RelatedCard
                  key={listing.id}
                  listing={listing}
                  onClick={() => navigate(`/listings/${listing.id}`)}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
