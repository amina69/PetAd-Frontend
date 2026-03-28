import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyToClipboardProps {
  value: string;
  children: ReactNode;
}

export function CopyToClipboard({ value, children }: CopyToClipboardProps) {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy to clipboard"
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        isCopied
          ? 'bg-green-50 text-green-600 border border-green-200 focus:ring-green-500'
          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 active:scale-95 focus:ring-[#E84D2A]'
      }`}
    >
      {isCopied ? (
        <>
          <Check size={16} />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy size={16} />
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
