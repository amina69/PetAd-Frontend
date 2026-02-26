import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = "info" | "images" | "success";

interface PetInfo {
  adoptionType: string;
  description: string;
  title: string;
  petType: string;
  breed: string;
  age: string;
  gender: string;
  vaccinationStatus: string;
  state: string;
  city: string;
}

interface ImageSlot {
  id: number;
  label: string;
  required: boolean;
  file: File | null;
  preview: string | null;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
);

const ChevronDown = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CheckIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

// ─── Custom Select ────────────────────────────────────────────────────────────
const Select = ({
  value, onChange, placeholder, options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="lfa-select" style={{ position: "relative" }}>
      <button
        type="button"
        className="lfa-select__trigger"
        onClick={() => setOpen((o) => !o)}
      >
        <span style={{ color: value ? "#1a1a1a" : "#aaa" }}>{value || placeholder}</span>
        <span style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }}>
          <ChevronDown />
        </span>
      </button>
      {open && (
        <div className="lfa-select__dropdown">
          {options.map((opt) => (
            <div
              key={opt}
              className={`lfa-select__option ${value === opt ? "lfa-select__option--active" : ""}`}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Image Upload Slot ────────────────────────────────────────────────────────
const ImageSlotUploader = ({
  slot, onFileChange, onRemove,
}: {
  slot: ImageSlot;
  onFileChange: (id: number, file: File) => void;
  onRemove: (id: number) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      onFileChange(slot.id, file);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  return (
    <div className="lfa-image-slot">
      <span className="lfa-image-slot__label">
        {slot.label}
        {!slot.required && <span className="lfa-image-slot__optional"> (Optional)</span>}
      </span>

      {slot.preview ? (
        <div className="lfa-image-slot__preview-wrap">
          <img src={slot.preview} alt={slot.label} className="lfa-image-slot__preview-img" />
          <button
            type="button"
            className="lfa-image-slot__remove"
            onClick={() => onRemove(slot.id)}
          >
            <TrashIcon />
          </button>
        </div>
      ) : (
        <div
          className={`lfa-image-slot__dropzone ${dragging ? "lfa-image-slot__dropzone--drag" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <span className="lfa-image-slot__filename">Select file</span>
          <span className="lfa-image-slot__icon"><UploadIcon /></span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      )}
    </div>
  );
};

// ─── Gallery Preview ──────────────────────────────────────────────────────────
const GalleryPreview = ({ slots }: { slots: ImageSlot[] }) => {
  const [active, setActive] = useState(0);
  const filled = slots.filter((s) => s.preview);

  if (filled.length === 0) {
    return (
      <div className="lfa-gallery__empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span>No images selected yet</span>
      </div>
    );
  }

  const current = filled[active] ?? filled[0];

  return (
    <div className="lfa-gallery">
      <div className="lfa-gallery__main">
        <img src={current.preview!} alt={current.label} className="lfa-gallery__main-img" />
      </div>
      {filled.length > 1 && (
        <div className="lfa-gallery__thumbs">
          {filled.map((s, i) => (
            <div
              key={s.id}
              className={`lfa-gallery__thumb ${i === active ? "lfa-gallery__thumb--active" : ""}`}
              onClick={() => setActive(i)}
            >
              <img src={s.preview!} alt={s.label} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── STEP 1: Pet Info Form ────────────────────────────────────────────────────
const PetInfoStep = ({
  onProceed, onClose,
}: {
  onProceed: (info: PetInfo) => void;
  onClose: () => void;
}) => {
  const [form, setForm] = useState<PetInfo>({
    adoptionType: "", description: "", title: "", petType: "",
    breed: "", age: "", gender: "", vaccinationStatus: "", state: "", city: "",
  });
  const [errors, setErrors] = useState<Partial<PetInfo>>({});

  const set = (key: keyof PetInfo) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e: Partial<PetInfo> = {};
    if (!form.adoptionType) e.adoptionType = "Required";
    if (!form.description.trim()) e.description = "Required";
    if (!form.title.trim()) e.title = "Required";
    if (!form.petType) e.petType = "Required";
    if (!form.breed.trim()) e.breed = "Required";
    if (!form.age) e.age = "Required";
    if (!form.gender) e.gender = "Required";
    if (!form.vaccinationStatus) e.vaccinationStatus = "Required";
    if (!form.state.trim()) e.state = "Required";
    if (!form.city.trim()) e.city = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleProceed = () => {
    if (validate()) onProceed(form);
  };

  return (
    <div className="lfa-card lfa-card--wide">
      <div className="lfa-card__header">
        <div>
          <h2 className="lfa-card__title">Adoption & Pet Information</h2>
          <p className="lfa-card__subtitle">All fields are required</p>
        </div>
        <button className="lfa-card__close" onClick={onClose}><CloseIcon /></button>
      </div>

      <div className="lfa-form">
        <div className="lfa-field lfa-field--full">
          <label className="lfa-label">Adoption Type</label>
          <Select value={form.adoptionType} onChange={set("adoptionType")} placeholder="Select" options={["Temporary Adoption", "Absolute Adoption"]} />
          {errors.adoptionType && <span className="lfa-error">{errors.adoptionType}</span>}
        </div>

        <div className="lfa-field lfa-field--full">
          <label className="lfa-label">Description</label>
          <textarea className="lfa-textarea" placeholder="Type something" value={form.description} onChange={(e) => set("description")(e.target.value)} />
          {errors.description && <span className="lfa-error">{errors.description}</span>}
        </div>

        <div className="lfa-field">
          <label className="lfa-label">Listing Title / Pet Name</label>
          <input className="lfa-input" placeholder="Enter title" value={form.title} onChange={(e) => set("title")(e.target.value)} />
          {errors.title && <span className="lfa-error">{errors.title}</span>}
        </div>
        <div className="lfa-field">
          <label className="lfa-label">Pet Type</label>
          <Select value={form.petType} onChange={set("petType")} placeholder="Select" options={["Dog", "Cat", "Bird", "Rabbit", "Fish", "Other"]} />
          {errors.petType && <span className="lfa-error">{errors.petType}</span>}
        </div>

        <div className="lfa-field">
          <label className="lfa-label">Pet Breed</label>
          <input className="lfa-input" placeholder="Enter breed" value={form.breed} onChange={(e) => set("breed")(e.target.value)} />
          {errors.breed && <span className="lfa-error">{errors.breed}</span>}
        </div>
        <div className="lfa-field">
          <label className="lfa-label">Pet Age</label>
          <Select value={form.age} onChange={set("age")} placeholder="Select" options={["0-3 months", "3-6 months", "6-12 months", "1-2 years", "2-5 years", "5+ years"]} />
          {errors.age && <span className="lfa-error">{errors.age}</span>}
        </div>

        <div className="lfa-field">
          <label className="lfa-label">Pet Gender</label>
          <Select value={form.gender} onChange={set("gender")} placeholder="Select" options={["Male", "Female"]} />
          {errors.gender && <span className="lfa-error">{errors.gender}</span>}
        </div>
        <div className="lfa-field">
          <label className="lfa-label">Vaccination Status</label>
          <Select value={form.vaccinationStatus} onChange={set("vaccinationStatus")} placeholder="Select" options={["Vaccinated", "Not Vaccinated", "In Progress"]} />
          {errors.vaccinationStatus && <span className="lfa-error">{errors.vaccinationStatus}</span>}
        </div>

        <div className="lfa-field">
          <label className="lfa-label">State</label>
          <input className="lfa-input" placeholder="Enter state" value={form.state} onChange={(e) => set("state")(e.target.value)} />
          {errors.state && <span className="lfa-error">{errors.state}</span>}
        </div>
        <div className="lfa-field">
          <label className="lfa-label">City</label>
          <input className="lfa-input" placeholder="Enter city" value={form.city} onChange={(e) => set("city")(e.target.value)} />
          {errors.city && <span className="lfa-error">{errors.city}</span>}
        </div>
      </div>

      <button className="lfa-btn lfa-btn--primary lfa-btn--full" onClick={handleProceed}>
        Proceed
      </button>
    </div>
  );
};

// ─── STEP 2: Add Images ───────────────────────────────────────────────────────
const AddImagesStep = ({
  onSubmit, onClose,
}: {
  onSubmit: () => void;
  onClose: () => void;
}) => {
  const [slots, setSlots] = useState<ImageSlot[]>([
    { id: 1, label: "Image 1", required: true, file: null, preview: null },
    { id: 2, label: "Image 2", required: true, file: null, preview: null },
    { id: 3, label: "Image 3", required: true, file: null, preview: null },
    { id: 4, label: "Image 4", required: false, file: null, preview: null },
    { id: 5, label: "Image 5", required: false, file: null, preview: null },
  ]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (id: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setSlots((prev) =>
        prev.map((s) => s.id === id ? { ...s, file, preview: e.target?.result as string } : s)
      );
    };
    reader.readAsDataURL(file);
    setError("");
  };

  const handleRemove = (id: number) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, file: null, preview: null } : s))
    );
  };

  const handleSubmit = async () => {
    const filledRequired = slots.filter((s) => s.required && s.preview).length;
    if (filledRequired < 3) {
      setError("Please upload at least 3 images of your pet.");
      return;
    }
    setSubmitting(true);
    // TODO: replace with real API call e.g:
    // await api.uploadImages(slots.filter(s => s.file).map(s => s.file));
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    onSubmit();
  };

  const filledCount = slots.filter((s) => s.preview).length;

  return (
    <div className="lfa-images-layout">
      {/* Upload Card */}
      <div className="lfa-card">
        <div className="lfa-card__header">
          <div>
            <h2 className="lfa-card__title">Add Images</h2>
            <p className="lfa-card__subtitle">Add at least 3 different angle images of the pet</p>
          </div>
          <button className="lfa-card__close" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="lfa-slots">
          {slots.map((slot) => (
            <ImageSlotUploader key={slot.id} slot={slot} onFileChange={handleFileChange} onRemove={handleRemove} />
          ))}
        </div>

        {error && <p className="lfa-error" style={{ marginBottom: 12 }}>{error}</p>}

        <button
          className={`lfa-btn lfa-btn--primary lfa-btn--full ${submitting ? "lfa-btn--loading" : ""}`}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <><span className="lfa-spinner" /> Submitting...</> : "Submit"}
        </button>
      </div>

      {/* Gallery Preview Card */}
      <div className="lfa-card">
        <div className="lfa-card__header" style={{ marginBottom: 16 }}>
          <div>
            <h2 className="lfa-card__title">Preview</h2>
            <p className="lfa-card__subtitle">
              {filledCount === 0 ? "No images uploaded yet" : `${filledCount} image${filledCount !== 1 ? "s" : ""} selected`}
            </p>
          </div>
        </div>
        <GalleryPreview slots={slots} />
      </div>
    </div>
  );
};


const SuccessModal = ({
  onClose, onViewListing,
}: {
  onClose: () => void;
  onViewListing: () => void;
}) => (
  <div className="lfa-success-wrap">
    <div className="lfa-success">
      <div className="lfa-success__icon">
        <CheckIcon />
      </div>
      <h2 className="lfa-success__title">Pet Listed Successfully!</h2>
      <p className="lfa-success__subtitle">You have successfully listed a pet for adoption</p>
      <div className="lfa-success__actions">
        <button className="lfa-btn lfa-btn--outline" onClick={onClose}>Close</button>
        <button className="lfa-btn lfa-btn--red" onClick={onViewListing}>View Listing</button>
      </div>
    </div>
  </div>
);

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────
const ListForAdoption = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("info");
  const [_petInfo, setPetInfo] = useState<PetInfo | null>(null);

  const handleProceed = (info: PetInfo) => {
    setPetInfo(info);
    setStep("images");
  };

  const handleClose = () => {
    navigate(-1); // goes back to previous page
  };

  const handleViewListing = () => {
    navigate("/listings"); // TODO: change to navigate(`/listings/${newListingId}`) when backend gives you the id
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

        .lfa-root *, .lfa-root *::before, .lfa-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .lfa-root { font-family: 'DM Sans', 'Segoe UI', sans-serif; background: #3a3a3a; min-height: 100vh; display: flex; flex-direction: column; }
        .lfa-topbar { background: #1a1a1a; padding: 0 20px; height: 44px; display: flex; align-items: center; }
        .lfa-topbar__label { color: #fff; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
        .lfa-main { flex: 1; display: flex; align-items: flex-start; justify-content: center; padding: 40px 20px 60px; }
        .lfa-card { background: #fff; border-radius: 16px; padding: 28px; width: 100%; max-width: 520px; }
        .lfa-card--wide { max-width: 560px; }
        .lfa-card__header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .lfa-card__title { font-size: 22px; font-weight: 800; color: #1a1a1a; letter-spacing: -0.02em; }
        .lfa-card__subtitle { font-size: 13px; color: #888; margin-top: 3px; }
        .lfa-card__close { background: none; border: none; cursor: pointer; color: #888; padding: 4px; border-radius: 6px; transition: color 0.15s, background 0.15s; flex-shrink: 0; }
        .lfa-card__close:hover { color: #1a1a1a; background: #f0f0f0; }
        .lfa-form { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .lfa-field { display: flex; flex-direction: column; gap: 6px; }
        .lfa-field--full { grid-column: 1 / -1; }
        .lfa-label { font-size: 12px; font-weight: 600; color: #555; letter-spacing: 0.01em; }
        .lfa-input, .lfa-textarea { width: 100%; padding: 10px 14px; border: 1.5px solid #e0e0e0; border-radius: 8px; font-family: inherit; font-size: 14px; color: #1a1a1a; background: #fff; outline: none; transition: border-color 0.2s; }
        .lfa-input::placeholder, .lfa-textarea::placeholder { color: #bbb; }
        .lfa-input:focus, .lfa-textarea:focus { border-color: #1a1a1a; }
        .lfa-textarea { resize: none; height: 90px; line-height: 1.5; }
        .lfa-error { font-size: 11px; color: #d32f2f; margin-top: 2px; }
        .lfa-select__trigger { width: 100%; padding: 10px 14px; border: 1.5px solid #e0e0e0; border-radius: 8px; background: #fff; display: flex; align-items: center; justify-content: space-between; cursor: pointer; font-family: inherit; font-size: 14px; color: #1a1a1a; transition: border-color 0.2s; }
        .lfa-select__trigger:focus, .lfa-select__trigger:hover { border-color: #1a1a1a; outline: none; }
        .lfa-select__dropdown { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #fff; border: 1.5px solid #e0e0e0; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); z-index: 100; overflow: hidden; }
        .lfa-select__option { padding: 10px 14px; font-size: 14px; cursor: pointer; transition: background 0.15s; }
        .lfa-select__option:hover { background: #f5f5f5; }
        .lfa-select__option--active { background: #1a1a1a; color: #fff; }
        .lfa-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 13px 24px; border-radius: 10px; font-family: inherit; font-size: 15px; font-weight: 700; cursor: pointer; border: 2px solid transparent; transition: all 0.2s; letter-spacing: 0.01em; }
        .lfa-btn--full { width: 100%; }
        .lfa-btn--primary { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
        .lfa-btn--primary:hover:not(:disabled) { background: #333; border-color: #333; }
        .lfa-btn--primary:active:not(:disabled) { transform: scale(0.99); }
        .lfa-btn--loading, .lfa-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .lfa-btn--outline { background: #fff; color: #1a1a1a; border-color: #1a1a1a; }
        .lfa-btn--outline:hover { background: #f5f5f5; }
        .lfa-btn--red { background: #e03b2a; color: #fff; border-color: #e03b2a; }
        .lfa-btn--red:hover { background: #c62f1e; border-color: #c62f1e; }
        .lfa-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: lfa-spin 0.7s linear infinite; display: inline-block; }
        @keyframes lfa-spin { to { transform: rotate(360deg); } }
        .lfa-images-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; width: 100%; max-width: 1060px; align-items: start; }
        @media (max-width: 820px) { .lfa-images-layout { grid-template-columns: 1fr; } }
        .lfa-slots { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
        .lfa-image-slot { display: flex; flex-direction: column; gap: 6px; }
        .lfa-image-slot__label { font-size: 12px; font-weight: 600; color: #555; }
        .lfa-image-slot__optional { color: #aaa; font-weight: 400; }
        .lfa-image-slot__dropzone { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border: 1.5px solid #e0e0e0; border-radius: 8px; cursor: pointer; background: #fff; transition: border-color 0.2s, background 0.2s; }
        .lfa-image-slot__dropzone:hover { border-color: #1a1a1a; }
        .lfa-image-slot__dropzone--drag { border-color: #1a1a1a; background: #f8f8f8; }
        .lfa-image-slot__filename { font-size: 14px; color: #bbb; }
        .lfa-image-slot__icon { color: #888; display: flex; }
        .lfa-image-slot__preview-wrap { position: relative; border-radius: 8px; overflow: hidden; height: 64px; border: 1.5px solid #e0e0e0; }
        .lfa-image-slot__preview-img { width: 100%; height: 100%; object-fit: cover; }
        .lfa-image-slot__remove { position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.6); color: #fff; border: none; border-radius: 6px; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s; }
        .lfa-image-slot__remove:hover { background: #e03b2a; }
        .lfa-gallery__empty { width: 100%; height: 220px; background: #f7f7f7; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: #bbb; font-size: 13px; border: 1.5px dashed #e0e0e0; }
        .lfa-gallery__main { width: 100%; aspect-ratio: 4/3; border-radius: 12px; overflow: hidden; background: #f0f0f0; margin-bottom: 12px; }
        .lfa-gallery__main-img { width: 100%; height: 100%; object-fit: cover; transition: opacity 0.2s; }
        .lfa-gallery__thumbs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
        .lfa-gallery__thumb { width: 64px; height: 64px; border-radius: 8px; overflow: hidden; cursor: pointer; flex-shrink: 0; border: 2px solid transparent; background: #f0f0f0; transition: border-color 0.18s; }
        .lfa-gallery__thumb img { width: 100%; height: 100%; object-fit: cover; }
        .lfa-gallery__thumb--active { border-color: #1a1a1a; }
        .lfa-success-wrap { display: flex; align-items: center; justify-content: center; width: 100%; }
        .lfa-success { background: #fff; border-radius: 16px; padding: 40px 36px; width: 100%; max-width: 440px; display: flex; flex-direction: column; align-items: center; text-align: center; animation: lfa-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes lfa-pop { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .lfa-success__icon { width: 88px; height: 88px; border-radius: 50%; background: #1a1a1a; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
        .lfa-success__title { font-size: 24px; font-weight: 800; color: #1a1a1a; letter-spacing: -0.02em; margin-bottom: 10px; }
        .lfa-success__subtitle { font-size: 14px; color: #888; margin-bottom: 28px; }
        .lfa-success__actions { display: flex; gap: 12px; width: 100%; }
        .lfa-success__actions .lfa-btn { flex: 1; }
        @media (max-width: 560px) {
          .lfa-form { grid-template-columns: 1fr; }
          .lfa-field--full { grid-column: 1; }
          .lfa-main { padding: 20px 12px 40px; }
          .lfa-card { padding: 20px; }
          .lfa-success__actions { flex-direction: column; }
        }
      `}</style>

      <div className="lfa-root">
        <div className="lfa-topbar">
          <span className="lfa-topbar__label">List For Adoption</span>
        </div>

        <div className="lfa-main">
          {step === "info" && (
            <PetInfoStep onProceed={handleProceed} onClose={handleClose} />
          )}
          {step === "images" && (
            <AddImagesStep onSubmit={() => setStep("success")} onClose={handleClose} />
          )}
          {step === "success" && (
            <SuccessModal onClose={handleClose} onViewListing={handleViewListing} />
          )}
        </div>
      </div>
    </>
  );
};

export default ListForAdoption;
