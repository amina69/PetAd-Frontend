import React, { useState, type ChangeEvent, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function EditAdoptionListing() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // 1. Error State
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    adoptionType: "Absolute",
    description: "Type something",
    listingTitle: "Dog Pet For Adoption",
    petType: "Dog",
    petBreed: "German Shepard",
    petAge: "4",
    petGender: "Female",
    vaccinationStatus: "Yes",
    state: "Lagos",
    city: "Yaba",
  });

  const [imageNames, setImageNames] = useState<string[]>([
    "img file 1.jpg",
    "img file 2.jpg",
    "img file 3.jpg",
    "img file 4.jpg",
    "Select file",
  ]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (
    index: number,
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const updatedNames = [...imageNames];
      updatedNames[index] = file.name;
      setImageNames(updatedNames);
      if (errors.images) setErrors((prev) => ({ ...prev, images: "" }));
    }
  };

  // 2. Validation Logic
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.listingTitle.trim())
      newErrors.listingTitle = "Title is required";
    if (formData.description.length < 20)
      newErrors.description = "Description must be at least 20 characters";

    // Check if at least one image is "uploaded" (not the default 'Select file')
    const uploadedCount = imageNames.filter(
      (name) => name !== "Select file",
    ).length;
    if (uploadedCount === 0)
      newErrors.images = "At least one image is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return; // Stop if invalid

    setIsLoading(true);
    console.log("Valid Form Data:", formData);

    setTimeout(() => {
      setIsLoading(false);
      navigate("/listings");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex  justify-center items-center bg-white text-[#1A1C1E] font-sans pb-20 ">
      <main className="max-w-7xl mx-auto px-12">
        <h2 className="text-2xl font-bold mb-8">Edit Listing Details</h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-6"
        >
          {/* Left Column */}
          <div className="space-y-5">
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-gray-400 uppercase mb-2">
                Adoption Type
              </label>
              <select
                name="adoptionType"
                value={formData.adoptionType}
                onChange={handleInputChange}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none"
              >
                <option value="Absolute">Absolute</option>
                <option value="Foster">Foster</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-gray-400 uppercase mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={`p-3 bg-gray-50 border rounded-lg h-28 resize-none outline-none ${errors.description ? "border-red-500" : "border-gray-200"}`}
              />
              {errors.description && (
                <span className="text-red-500 text-[10px] mt-1 font-bold italic">
                  {errors.description}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <InputField
                  label="Listing Title"
                  name="listingTitle"
                  value={formData.listingTitle}
                  onChange={handleInputChange}
                  hasError={!!errors.listingTitle}
                />
                {errors.listingTitle && (
                  <span className="text-red-500 text-[10px] font-bold">
                    {errors.listingTitle}
                  </span>
                )}
              </div>
              <SelectField
                label="Pet Type"
                name="petType"
                value={formData.petType}
                options={["Dog", "Cat"]}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Pet Breed"
                name="petBreed"
                value={formData.petBreed}
                onChange={handleInputChange}
              />
              <SelectField
                label="Pet Age"
                name="petAge"
                value={formData.petAge}
                options={["4", "5", "6"]}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SelectField
                label="Pet Gender"
                name="petGender"
                value={formData.petGender}
                options={["Male", "Female"]}
                onChange={handleInputChange}
              />
              <SelectField
                label="Vaccination Status"
                name="vaccinationStatus"
                value={formData.vaccinationStatus}
                options={["Yes", "No"]}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Right Column: Images */}
          <div className="space-y-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">
              Image Uploads
            </p>
            {imageNames.map((name, i) => (
              <label
                key={i}
                className={`flex items-center justify-between p-3 bg-gray-50 border rounded-lg cursor-pointer hover:border-gray-400 transition-colors ${errors.images && i === 0 ? "border-red-500" : "border-gray-200"}`}
              >
                <span
                  className={`text-sm truncate pr-4 ${name === "Select file" ? "text-gray-400" : "text-gray-800"}`}
                >
                  {name}
                </span>
                <span className="text-gray-400">📤</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileChange(i, e)}
                />
              </label>
            ))}
            {errors.images && (
              <span className="text-red-500 text-[10px] font-bold block italic">
                {errors.images}
              </span>
            )}
          </div>

          <div className="col-span-full flex justify-end gap-4 mt-8">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-10 py-2.5 border border-gray-300 rounded font-bold text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-10 py-2.5 bg-[#FF5733] text-white rounded font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isLoading ? "Processing..." : "Save Changes"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

// Validation-Aware Helper
const InputField = ({ label, name, value, onChange, hasError }: any) => (
  <div className="flex flex-col">
    <label className="text-[11px] font-bold text-gray-400 uppercase mb-2">
      {label}
    </label>
    <input
      name={name}
      value={value}
      onChange={onChange}
      className={`p-3 bg-gray-50 border rounded-lg outline-none transition-colors ${hasError ? "border-red-500" : "border-gray-200 focus:border-gray-400"}`}
    />
  </div>
);

const SelectField = ({ label, name, value, options, onChange }: any) => (
  <div className="flex flex-col">
    <label className="text-[11px] font-bold text-gray-400 uppercase mb-2">
      {label}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-gray-400"
    >
      {options.map((opt: string) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);
