interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function ToggleSwitch({ checked, onChange, label, disabled }: ToggleSwitchProps) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 cursor-pointer select-none transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'bg-gray-50 hover:bg-gray-100'
      }`}
      onClick={() => !disabled && onChange(!checked)}
    >
      <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
        checked ? 'bg-[#E84D2A]' : 'bg-gray-300'
      }`}>
        <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`} />
      </div>
      <span className="text-sm font-bold text-[#0D162B]">{label}</span>
    </div>
  );
}