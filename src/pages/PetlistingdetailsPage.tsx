import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PetListing {
  id: string;
  adoptionType: "Temporary Adoption" | "Absolute Adoption";
  title: string;
  petType: "Dog" | "Cat" | "Bird" | string;
  breed: string;
  age: string;
  gender: "Male" | "Female";
  vaccinationStatus: "Vaccinated" | "Not Vaccinated" | "In Progress";
  description: string;
  state: string;
  city: string;
  images: string[];
  owner: {
    name: string;
    avatar?: string;
    contact?: string;
    location: string;
  };
  isFavourited?: boolean;
  isInterested?: boolean;
}

// ─── Mock Data (replace with real API call) ───────────────────────────────────
const mockListing: PetListing = {
  id: "1",
  adoptionType: "Absolute Adoption",
  title: "Buddy the Golden Retriever",
  petType: "Dog",
  breed: "Golden Retriever",
  age: "2 years",
  gender: "Male",
  vaccinationStatus: "Vaccinated",
  description:
    "Buddy is a playful and affectionate Golden Retriever who loves outdoor activities and cuddles. He is well-trained, good with children and other pets. Looking for a loving forever home where he can run around freely. He knows basic commands like sit, stay, and fetch.",
  state: "Lagos",
  city: "Ikeja",
  images: [
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80",
    "https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&q=80",
    "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80",
    "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=800&q=80",
  ],
  owner: {
    name: "Sarah Johnson",
    avatar: "https://i.pravatar.cc/150?img=47",
    contact: "+234 801 234 5678",
    location: "Ikeja, Lagos",
  },
  isFavourited: false,
  isInterested: false,
};

// ─── Icon Components ──────────────────────────────────────────────────────────
const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const LocationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const FlagIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

// ─── Image Fallback ───────────────────────────────────────────────────────────
const ImageWithFallback = ({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={`pet-image-fallback ${className ?? ""}`}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span>No image available</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
};

// ─── Badge ────────────────────────────────────────────────────────────────────
const Badge = ({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "default" | "success" | "warning" | "dark";
}) => (
  <span className={`badge badge--${variant}`}>{label}</span>
);

// ─── Detail Row ───────────────────────────────────────────────────────────────
const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="detail-row">
    <span className="detail-row__label">{label}</span>
    <span className="detail-row__value">{value}</span>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const PetListingDetailsPage = () => {
  const listing = mockListing; // Replace with: const listing = usePetListing(id)

  const [activeImage, setActiveImage] = useState(0);
  const [isFavourited, setIsFavourited] = useState(listing.isFavourited ?? false);
  const [isInterested, setIsInterested] = useState(listing.isInterested ?? false);
  const [favLoading, setFavLoading] = useState(false);
  const [intLoading, setIntLoading] = useState(false);

  const handleFavourite = async () => {
    setFavLoading(true);
    // TODO: call API  e.g. await toggleFavourite(listing.id)
    await new Promise((r) => setTimeout(r, 600));
    setIsFavourited((prev) => !prev);
    setFavLoading(false);
  };

  const handleInterested = async () => {
    setIntLoading(true);
    // TODO: call API  e.g. await markInterested(listing.id)
    await new Promise((r) => setTimeout(r, 600));
    setIsInterested((prev) => !prev);
    setIntLoading(false);
  };

  const vaccinationVariant =
    listing.vaccinationStatus === "Vaccinated"
      ? "success"
      : listing.vaccinationStatus === "In Progress"
      ? "warning"
      : "default";

  return (
    <>
      {/* ── Styles ── */}
      <style>{`
        /* ── Reset / Base ── */
        .pld-page * { box-sizing: border-box; margin: 0; padding: 0; }
        .pld-page {
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          background: #f5f5f5;
          min-height: 100vh;
          color: #1a1a1a;
        }

        /* ── Top Bar ── */
        .pld-topbar {
          background: #1a1a1a;
          padding: 0 24px;
          height: 52px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .pld-topbar__back {
          color: #fff;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          padding: 6px 0;
          opacity: 0.85;
          transition: opacity 0.2s;
        }
        .pld-topbar__back:hover { opacity: 1; }
        .pld-topbar__title {
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.01em;
        }

        /* ── Layout ── */
        .pld-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 32px 20px 64px;
        }

        .pld-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 28px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .pld-grid { grid-template-columns: 1fr; }
        }

        /* ── Cards ── */
        .card {
          background: #fff;
          border-radius: 16px;
          padding: 28px;
          border: 1px solid #e8e8e8;
        }
        .card + .card { margin-top: 20px; }
        .card__title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 20px;
          color: #1a1a1a;
          padding-bottom: 14px;
          border-bottom: 1px solid #f0f0f0;
        }

        /* ── Adoption Type Badge (top of page) ── */
        .pld-header {
          margin-bottom: 20px;
        }
        .pld-header__type { margin-bottom: 8px; }
        .pld-header__title {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .pld-header__location {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #666;
          font-size: 14px;
          margin-top: 8px;
        }

        /* ── Gallery ── */
        .gallery__main {
          width: 100%;
          aspect-ratio: 4/3;
          border-radius: 12px;
          overflow: hidden;
          background: #f0f0f0;
          margin-bottom: 12px;
        }
        .gallery__main img,
        .gallery__main .pet-image-fallback {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #aaa;
          font-size: 13px;
        }
        .gallery__thumbs {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .gallery__thumb {
          width: 72px;
          height: 72px;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          flex-shrink: 0;
          border: 2px solid transparent;
          transition: border-color 0.2s;
          background: #f0f0f0;
        }
        .gallery__thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .gallery__thumb--active { border-color: #1a1a1a; }

        /* ── Detail Rows ── */
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
        }
        .detail-row {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 14px 0;
          border-bottom: 1px solid #f5f5f5;
        }
        .detail-row:nth-child(odd) { padding-right: 20px; }
        .detail-row:nth-child(even) { padding-left: 20px; border-left: 1px solid #f5f5f5; }
        .detail-row__label {
          font-size: 12px;
          color: #888;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .detail-row__value {
          font-size: 15px;
          font-weight: 600;
          color: #1a1a1a;
        }

        @media (max-width: 480px) {
          .details-grid { grid-template-columns: 1fr; }
          .detail-row { padding-left: 0 !important; border-left: none !important; }
        }

        /* ── Description ── */
        .description-text {
          font-size: 15px;
          line-height: 1.7;
          color: #444;
        }

        /* ── Badges ── */
        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        .badge--default { background: #f0f0f0; color: #555; }
        .badge--success { background: #e8f5e9; color: #2e7d32; }
        .badge--warning { background: #fff3e0; color: #e65100; }
        .badge--dark { background: #1a1a1a; color: #fff; }

        /* ── Owner Card ── */
        .owner-card__header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
        }
        .owner-card__avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          object-fit: cover;
          background: #f0f0f0;
        }
        .owner-card__avatar-placeholder {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #1a1a1a;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 20px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .owner-card__name {
          font-size: 16px;
          font-weight: 700;
        }
        .owner-card__location {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #666;
          font-size: 13px;
          margin-top: 2px;
        }
        .owner-card__contact {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f7f7f7;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 14px;
          color: #333;
          margin-bottom: 14px;
        }
        .report-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          background: none;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          color: #c62828;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.18s, border-color 0.18s;
        }
        .report-btn:hover { background: #ffeaea; border-color: #ef9a9a; }

        /* ── CTA Buttons ── */
        .cta-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s;
          letter-spacing: 0.01em;
        }
        .btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .btn--primary {
          background: #1a1a1a;
          color: #fff;
          border-color: #1a1a1a;
        }
        .btn--primary:hover:not(:disabled) { background: #333; border-color: #333; }
        .btn--primary:active:not(:disabled) { background: #000; transform: scale(0.99); }
        .btn--primary.btn--active {
          background: #fff;
          color: #1a1a1a;
        }

        .btn--outline {
          background: #fff;
          color: #1a1a1a;
          border-color: #1a1a1a;
        }
        .btn--outline:hover:not(:disabled) { background: #f5f5f5; }
        .btn--outline:active:not(:disabled) { background: #eee; transform: scale(0.99); }
        .btn--outline.btn--active {
          background: #1a1a1a;
          color: #fff;
        }

        /* ── Loading Spinner ── */
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Pet Image Fallback ── */
        .pet-image-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #aaa;
          font-size: 13px;
        }
      `}</style>

      <div className="pld-page">
        {/* Top Bar */}
        <div className="pld-topbar">
          <button className="pld-topbar__back" onClick={() => window.history.back()}>
            <ChevronLeft />
            Back
          </button>
          <span className="pld-topbar__title">Pet Listing</span>
        </div>

        <div className="pld-container">
          {/* Header */}
          <div className="pld-header">
            <div className="pld-header__type">
              <Badge
                label={listing.adoptionType}
                variant={listing.adoptionType === "Absolute Adoption" ? "dark" : "default"}
              />
            </div>
            <h1 className="pld-header__title">{listing.title}</h1>
            <div className="pld-header__location">
              <LocationIcon />
              {listing.city}, {listing.state}
            </div>
          </div>

          <div className="pld-grid">
            {/* ── Left Column ── */}
            <div>
              {/* Image Gallery */}
              <div className="card" style={{ padding: "20px" }}>
                <div className="gallery__main">
                  <ImageWithFallback
                    src={listing.images[activeImage]}
                    alt={`${listing.title} image ${activeImage + 1}`}
                  />
                </div>
                {listing.images.length > 1 && (
                  <div className="gallery__thumbs">
                    {listing.images.map((img, idx) => (
                      <div
                        key={idx}
                        className={`gallery__thumb ${idx === activeImage ? "gallery__thumb--active" : ""}`}
                        onClick={() => setActiveImage(idx)}
                      >
                        <img src={img} alt={`Thumbnail ${idx + 1}`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pet Details */}
              <div className="card" style={{ marginTop: 20 }}>
                <div className="card__title">Pet Details</div>
                <div className="details-grid">
                  <DetailRow label="Pet Type" value={listing.petType} />
                  <DetailRow label="Breed" value={listing.breed} />
                  <DetailRow label="Age" value={listing.age} />
                  <DetailRow label="Gender" value={listing.gender} />
                  <DetailRow label="Location" value={`${listing.city}, ${listing.state}`} />
                  <div className="detail-row" style={{ paddingLeft: 20, borderLeft: "1px solid #f5f5f5" }}>
                    <span className="detail-row__label">Vaccination</span>
                    <span style={{ marginTop: 4 }}>
                      <Badge label={listing.vaccinationStatus} variant={vaccinationVariant} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="card" style={{ marginTop: 20 }}>
                <div className="card__title">About this Pet</div>
                <p className="description-text">{listing.description}</p>
              </div>
            </div>

            {/* ── Right Column ── */}
            <div>
              {/* CTA Buttons */}
              <div className="card">
                <div className="card__title">Interested in {listing.title.split(" ")[0]}?</div>
                <div className="cta-group">
                  <button
                    className={`btn btn--outline ${isFavourited ? "btn--active" : ""}`}
                    onClick={handleFavourite}
                    disabled={favLoading}
                    aria-label="Add to favourites"
                  >
                    {favLoading ? (
                      <span className="spinner" />
                    ) : (
                      <HeartIcon filled={isFavourited} />
                    )}
                    {isFavourited ? "Saved to Favourites" : "Add to Favourites"}
                  </button>

                  <button
                    className={`btn btn--primary ${isInterested ? "btn--active" : ""}`}
                    onClick={handleInterested}
                    disabled={intLoading}
                    aria-label="Mark as interested"
                  >
                    {intLoading ? (
                      <span className="spinner" />
                    ) : (
                      <StarIcon filled={isInterested} />
                    )}
                    {isInterested ? "Marked as Interested" : "Mark as Interested"}
                  </button>
                </div>
              </div>

              {/* Owner Details */}
              <div className="card" style={{ marginTop: 20 }}>
                <div className="card__title">Listed by</div>
                <div className="owner-card__header">
                  {listing.owner.avatar ? (
                    <img
                      src={listing.owner.avatar}
                      alt={listing.owner.name}
                      className="owner-card__avatar"
                    />
                  ) : (
                    <div className="owner-card__avatar-placeholder">
                      {listing.owner.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="owner-card__name">{listing.owner.name}</div>
                    <div className="owner-card__location">
                      <LocationIcon />
                      {listing.owner.location}
                    </div>
                  </div>
                </div>

                {listing.owner.contact && (
                  <div className="owner-card__contact">
                    <PhoneIcon />
                    {listing.owner.contact}
                  </div>
                )}

                <button className="report-btn">
                  <FlagIcon />
                  Report Account / Owner
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PetListingDetailsPage;
