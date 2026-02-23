import { useState } from "react";
import { FormInput } from "../ui/formInput";
import { FormSelect } from "../ui/formSelect";
import { FileUpload } from "../ui/fileUpload";
import { AuthModal } from "../ui/authModal"; // Reusing success modal

interface ListingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ListingFormData {
    adoptionType: string;
    description: string;
    title: string;
    petType: string;
    breed: string;
    age: string;
    gender: string;
    vaccination: string;
    state: string;
    city: string;
    images: (File | null)[];
}

const PET_TYPES = [
    { value: "dog", label: "Dog" },
    { value: "cat", label: "Cat" },
    { value: "bird", label: "Bird" },
    { value: "other", label: "Other" },
];

const AGE_OPTIONS = [
    { value: "baby", label: "Baby (0-6 months)" },
    { value: "young", label: "Young (6-12 months)" },
    { value: "adult", label: "Adult (1-5 years)" },
    { value: "senior", label: "Senior (5+ years)" },
];

const GENDER_OPTIONS = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "unknown", label: "Unknown" },
];

const VACCINATION_OPTIONS = [
    { value: "yes", label: "Yes, fully vaccinated" },
    { value: "no", label: "No / Unknown" },
    { value: "partial", label: "Partially vaccinated" },
];

const STATE_OPTIONS = [
    { value: "lagos", label: "Lagos" },
    { value: "abuja", label: "Abuja" },
    { value: "rivers", label: "Rivers" },
    { value: "other", label: "Other" },
];

const INIT_STATE: ListingFormData = {
    adoptionType: "",
    description: "",
    title: "",
    petType: "",
    breed: "",
    age: "",
    gender: "",
    vaccination: "",
    state: "",
    city: "",
    images: [null, null, null, null, null],
};

export function ListingModal({ isOpen, onClose }: ListingModalProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [formData, setFormData] = useState<ListingFormData>(INIT_STATE);
    const [errors, setErrors] = useState<Partial<Record<keyof ListingFormData, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Close completely
    const handleClose = () => {
        // Reset state before closing
        setStep(1);
        setFormData(INIT_STATE);
        setErrors({});
        setShowSuccess(false);
        onClose();
    };

    if (!isOpen && !showSuccess) return null;

    const handleChange = (field: keyof ListingFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const handleImageChange = (index: number, file: File | null) => {
        setFormData((prev) => {
            const newImages = [...prev.images];
            newImages[index] = file;
            return { ...prev, images: newImages };
        });
        // clear error for images string if it exists
        if (errors.images) {
            setErrors((prev) => ({ ...prev, images: undefined }));
        }
    };

    const validateStep1 = () => {
        const newErrors: Partial<Record<keyof ListingFormData, string>> = {};
        if (!formData.adoptionType) newErrors.adoptionType = "Required";
        if (!formData.description.trim()) newErrors.description = "Required";
        if (!formData.title.trim()) newErrors.title = "Required";
        if (!formData.petType) newErrors.petType = "Required";
        if (!formData.breed.trim()) newErrors.breed = "Required";
        if (!formData.age) newErrors.age = "Required";
        if (!formData.gender) newErrors.gender = "Required";
        if (!formData.vaccination) newErrors.vaccination = "Required";
        if (!formData.state) newErrors.state = "Required";
        if (!formData.city.trim()) newErrors.city = "Required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleProceed = () => {
        if (validateStep1()) {
            setStep(2);
        }
    };

    const validateStep2 = () => {
        const newErrors: Partial<Record<keyof ListingFormData, string>> = {};
        const imgCount = formData.images.filter((img) => img !== null).length;

        // Require at least 3 images as requested in design
        if (imgCount < 3) {
            newErrors.images = "Please add at least 3 different angle images";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateStep2()) return;

        setIsSubmitting(true);
        // TODO: Wire to API
        await new Promise((r) => setTimeout(r, 1500));
        setIsSubmitting(false);

        // Hide this modal and show success modal
        setShowSuccess(true);
    };

    // If success modal is triggered
    if (showSuccess) {
        return (
            <AuthModal
                isOpen={true}
                title="Pet Listed Successfully!"
                description="You have successfully listed a pet for adoption"
                buttonText="View Listing"
                onAction={handleClose}
            />
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm px-4 lg:px-8">
            <div
                className="w-full max-w-[500px] bg-white rounded-2xl p-6 lg:p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                role="dialog"
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-xl lg:text-2xl font-semibold text-gray-900">
                            {step === 1 ? "Adoption & Pet Information" : "Add Images"}
                        </h2>
                        <p className="text-[13px] text-gray-500 mt-1">
                            {step === 1 ? "All fields are required" : "Add at least 3 different angle images of the pet"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto scrollbar-minimal pr-2 -mr-2">

                    {step === 1 && (
                        <div className="space-y-4 py-2">
                            <FormSelect
                                id="adoptionType"
                                label="Adoption Type"
                                options={[
                                    { value: "temporary", label: "Temporary Adoption" },
                                    { value: "absolute", label: "Absolute Adoption" },
                                ]}
                                value={formData.adoptionType}
                                onChange={(e) => handleChange("adoptionType", e.target.value)}
                                error={errors.adoptionType}
                            />

                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="description" className="text-[13px] font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    placeholder="Type something"
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => handleChange("description", e.target.value)}
                                    className={`w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] outline-none transition-all resize-none
                    focus:border-[#0D162B] focus:ring-1 focus:ring-[#0D162B]
                    ${errors.description ? "border-red-400 focus:border-red-400" : ""}`}
                                    aria-invalid={!!errors.description}
                                />
                                {errors.description && (
                                    <p className="text-xs text-red-500 mt-0.5">{errors.description}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormInput
                                    id="title"
                                    label="Listing Title / Pet Name"
                                    placeholder="Enter title"
                                    value={formData.title}
                                    onChange={(e) => handleChange("title", e.target.value)}
                                    error={errors.title}
                                />
                                <FormSelect
                                    id="petType"
                                    label="Pet Type"
                                    options={PET_TYPES}
                                    value={formData.petType}
                                    onChange={(e) => handleChange("petType", e.target.value)}
                                    error={errors.petType}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormInput
                                    id="breed"
                                    label="Pet Breed"
                                    placeholder="Enter breed"
                                    value={formData.breed}
                                    onChange={(e) => handleChange("breed", e.target.value)}
                                    error={errors.breed}
                                />
                                <FormSelect
                                    id="age"
                                    label="Pet Age"
                                    options={AGE_OPTIONS}
                                    value={formData.age}
                                    onChange={(e) => handleChange("age", e.target.value)}
                                    error={errors.age}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormSelect
                                    id="gender"
                                    label="Pet Gender"
                                    options={GENDER_OPTIONS}
                                    value={formData.gender}
                                    onChange={(e) => handleChange("gender", e.target.value)}
                                    error={errors.gender}
                                />
                                <FormSelect
                                    id="vaccination"
                                    label="Vaccination Status"
                                    options={VACCINATION_OPTIONS}
                                    value={formData.vaccination}
                                    onChange={(e) => handleChange("vaccination", e.target.value)}
                                    error={errors.vaccination}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormSelect
                                    id="state"
                                    label="State"
                                    options={STATE_OPTIONS}
                                    value={formData.state}
                                    onChange={(e) => handleChange("state", e.target.value)}
                                    error={errors.state}
                                />
                                <FormInput
                                    id="city"
                                    label="City"
                                    placeholder="Enter city"
                                    value={formData.city}
                                    onChange={(e) => handleChange("city", e.target.value)}
                                    error={errors.city}
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 py-2">
                            <FileUpload
                                id="img1"
                                label="Image 1 (Required)"
                                selectedFile={formData.images[0]}
                                onChange={(f) => handleImageChange(0, f)}
                            />
                            <FileUpload
                                id="img2"
                                label="Image 2 (Required)"
                                selectedFile={formData.images[1]}
                                onChange={(f) => handleImageChange(1, f)}
                            />
                            <FileUpload
                                id="img3"
                                label="Image 3 (Required)"
                                selectedFile={formData.images[2]}
                                onChange={(f) => handleImageChange(2, f)}
                            />
                            <FileUpload
                                id="img4"
                                label="Image 4 (Optional)"
                                selectedFile={formData.images[3]}
                                onChange={(f) => handleImageChange(3, f)}
                            />
                            <FileUpload
                                id="img5"
                                label="Image 5 (Optional)"
                                selectedFile={formData.images[4]}
                                onChange={(f) => handleImageChange(4, f)}
                            />

                            {errors.images && (
                                <p className="text-xs text-red-500 font-medium px-1">{errors.images}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3">
                    {step === 2 && (
                        <button
                            onClick={() => setStep(1)}
                            className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3.5 rounded-xl hover:bg-gray-200 transition-colors focus:ring-4 focus:ring-gray-200/50 active:scale-[0.98]"
                        >
                            Back
                        </button>
                    )}
                    {step === 1 ? (
                        <button
                            onClick={handleProceed}
                            className="w-full bg-[#0D1B2A] text-white font-semibold py-3.5 rounded-xl hover:bg-gray-900 transition-colors focus:ring-4 focus:ring-gray-900/20 active:scale-[0.98]"
                        >
                            Proceed
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1 bg-[#0D1B2A] text-white font-semibold py-3.5 rounded-xl hover:bg-gray-900 transition-colors focus:ring-4 focus:ring-gray-900/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Submitting..." : "Submit"}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
