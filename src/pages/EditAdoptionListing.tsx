import { useState, type ChangeEvent, type FormEvent } from "react";
import { Upload } from "lucide-react";
export default function EditAdoptionListing() {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initial State based on Figma Requirements
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

  // Image filenames state
  const [imageNames, setImageNames] = useState<string[]>([
    "Select file",
    "Select file",
    "Select file",
    "Select file",
    "Select file",
  ]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.listingTitle.trim())
      newErrors.listingTitle = "Listing Title is required";
    if (formData.description.trim().length < 10)
      newErrors.description = "Please provide a valid description";

    // Ensure at least one image is "selected"
    const hasImage = imageNames.some((name) => name !== "Select file");
    if (!hasImage) newErrors.images = "At least one image is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    // Simulate API logic
    setTimeout(() => {
      setIsLoading(false);
      alert("Changes saved successfully!");
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 bg-white min-h-screen font-sans text-[#1A1C1E]">
      <h2 className="text-2xl font-bold mb-8">Edit Listing Details</h2>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-6"
      >
        {/* Left Column: Adoption & Pet Information/ input fields */}
        <div className="space-y-5">
          <div className="flex flex-col">
            <label className="text-[11px] font-bold text-gray-400 uppercase mb-2">
              Adoption Type
            </label>
            <select
              name="adoptionType"
              value={formData.adoptionType}
              onChange={handleInputChange}
              className="p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-gray-400"
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
              className={`p-3 bg-gray-50 border rounded-lg h-32 resize-none outline-none focus:border-gray-400 ${errors.description ? "border-red-500" : "border-gray-200"}`}
            />
            {errors.description && (
              <span className="text-red-500 text-[10px] mt-1 italic font-semibold">
                {errors.description}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Listing Title / Pet Name"
              name="listingTitle"
              value={formData.listingTitle}
              onChange={handleInputChange}
              error={errors.listingTitle}
            />
            <SelectField
              label="Pet Type"
              name="petType"
              value={formData.petType}
              options={["Dog", "Cat", "Bird"]}
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
              options={["1", "2", "3", "4", "5", "6"]}
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

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="State"
              name="state"
              value={formData.state}
              options={["Lagos", "Abuja", "Rivers"]}
              onChange={handleInputChange}
            />
            <SelectField
              label="City"
              name="city"
              value={formData.city}
              options={["Yaba", "Ikeja", "Lekki"]}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Right Column: Images Upload Form */}
        <div className="space-y-4">
          {imageNames.map((name, i) => (
            <div key={i} className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                Image {i + 1} {i > 2 && "(Optional)"}
              </label>
              <label
                className={`flex items-center justify-between p-3 bg-gray-50 border rounded-lg cursor-pointer hover:bg-white transition-all ${errors.images && i === 0 ? "border-red-500" : "border-gray-200"}`}
              >
                <span
                  className={`text-sm truncate pr-4 ${name === "Select file" ? "text-gray-400" : "text-gray-800"}`}
                >
                  {name}
                </span>
                <Upload className="text-gray-500 w-4 h-4" />
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileChange(i, e)}
                  accept="image/*"
                />
              </label>
            </div>
          ))}
          {errors.images && (
            <span className="text-red-500 text-[10px] italic font-semibold">
              {errors.images}
            </span>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="col-span-full flex justify-center lg:justify-end gap-4 mt-10">
          <button
            type="button"
            className="px-10 py-2.5 border border-gray-300 rounded-md font-bold text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-10 py-2.5 bg-[#FF5733] text-white rounded-md font-bold text-sm hover:bg-[#E64D2E] transition-colors disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Internal Helpers
const InputField = ({ label, name, value, onChange, error }: any) => (
  <div className="flex flex-col">
    <label className="text-[11px] font-bold text-gray-400 uppercase mb-2">
      {label}
    </label>
    <input
      name={name}
      value={value}
      onChange={onChange}
      className={`p-3 bg-gray-50 border rounded-lg outline-none focus:border-gray-400 ${error ? "border-red-500" : "border-gray-200"}`}
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
