import { useState, useRef, useEffect } from "react";

interface FormSelectProps {
    label: string;
    id: string;
    error?: string;
    options: { value: string; label: string }[];
    placeholder?: string;
    className?: string;
    value?: string;
    onChange?: (e: any) => void;
}

export function FormSelect({
    label,
    id,
    error,
    options,
    placeholder = "Select",
    className = "",
    value,
    onChange,
}: FormSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Check if a valid (non-empty) value is selected
    const hasValue = value !== "" && value !== undefined;
    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSelect = (optValue: string) => {
        if (onChange) {
            // Mock event object to maintain compatibility with existing handlers
            onChange({ target: { value: optValue } });
        }
        setIsOpen(false);
    };

    return (
        <div className="flex flex-col gap-1.5" ref={dropdownRef}>
            <label htmlFor={id} className="text-[13px] font-medium text-gray-700">
                {label}
            </label>
            <div className="relative">
                <button
                    type="button"
                    id={id}
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full flex justify-between items-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] outline-none transition-all text-left
            ${isOpen ? "border-[#0D162B] ring-1 ring-[#0D162B]" : ""}
            ${!hasValue ? "text-gray-400" : "text-gray-900"}
            ${error ? "border-red-400 !bg-red-50/10 focus:border-red-400 focus:ring-red-400" : ""}
            ${className}`}
                    aria-invalid={!!error}
                    aria-expanded={isOpen}
                >
                    <span className="truncate">
                        {hasValue ? selectedOption?.label : placeholder}
                    </span>

                    {/* Custom Chevron Icon */}
                    <div className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </div>
                </button>

                {/* Custom Dropdown Menu */}
                {isOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden py-1 transform opacity-100 scale-100 origin-top transition-all">
                        <ul className="max-h-60 overflow-y-auto scrollbar-minimal">
                            {options.map((opt) => (
                                <li key={opt.value}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelect(opt.value)}
                                        className={`w-full text-left px-4 py-3 text-[14px] transition-colors
                      ${value === opt.value ? "bg-[#FFF2E5] text-[#E84D2A] font-medium" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"}
                    `}
                                    >
                                        {opt.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {error && (
                <p id={`${id}-error`} className="text-xs text-red-500 mt-0.5">
                    {error}
                </p>
            )}
        </div>
    );
}
