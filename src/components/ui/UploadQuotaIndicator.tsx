interface UploadQuotaIndicatorProps {
  usedBytes: number;
  totalBytes: number;
  onUpload?: () => void;
  uploadLabel?: string;
}

function formatMB(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb % 1 === 0 ? mb.toFixed(0) : mb.toFixed(1);
}

function getBarColor(percentage: number): string {
  if (percentage >= 95) return 'bg-red-500';
  if (percentage >= 80) return 'bg-amber-500';
  return 'bg-green-500';
}

export function UploadQuotaIndicator({
  usedBytes,
  totalBytes,
  onUpload,
  uploadLabel = 'Upload',
}: UploadQuotaIndicatorProps) {
  const percentage = totalBytes > 0 ? Math.min((usedBytes / totalBytes) * 100, 100) : 0;
  const isAtCapacity = percentage >= 100;
  const barColor = getBarColor(percentage);

  return (
    <div className="flex flex-col gap-2">
      <div
        className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Upload quota"
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-sm text-gray-600">
        {formatMB(usedBytes)} MB of {formatMB(totalBytes)} MB used
      </p>

      {onUpload !== undefined && (
        <div className="relative group inline-block">
          <button
            type="button"
            onClick={isAtCapacity ? undefined : onUpload}
            disabled={isAtCapacity}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              isAtCapacity
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#E84D2A] text-white hover:bg-[#c43e20] active:scale-[0.98]'
            }`}
          >
            {uploadLabel}
          </button>

          {isAtCapacity && (
            <div
              role="tooltip"
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
            >
              Upload limit reached
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
