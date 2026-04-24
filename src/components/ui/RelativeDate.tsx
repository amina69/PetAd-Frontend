import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface RelativeDateProps {
  date: Date | string;
}

/**
 * Displays a date as relative text (e.g., "2 hours ago") that updates every 60 seconds.
 * Shows the absolute date on hover via title attribute.
 */
export const RelativeDate = ({ date }: RelativeDateProps) => {
  const [relativeText, setRelativeText] = useState<string>('');

  // Memoised so the Date reference is stable across renders
  const dateObj = useMemo(
    () => (typeof date === 'string' ? new Date(date) : date),
    [date],
  );

  // Format absolute date for title attribute (locale-aware)
  const absoluteDate = dateObj.toLocaleString();

  useEffect(() => {
    const updateRelativeDate = () => {
      const formatted = formatDistanceToNow(dateObj, { addSuffix: true });
      setRelativeText(formatted);
    };

    // Initial update
    updateRelativeDate();

    // Set up interval to update every 60 seconds
    const interval = setInterval(updateRelativeDate, 60000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [dateObj]);

  if (!relativeText) {
    return <span title={absoluteDate}>Loading...</span>;
  }

  return <span title={absoluteDate}>{relativeText}</span>;
};
