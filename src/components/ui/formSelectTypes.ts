export interface FormSelectProps {
    label: string;
    id: string;
    error?: string;
    options: { value: string; label: string }[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    value?: string;
    onChange?: (e: { target: { value: string } }) => void;
}
