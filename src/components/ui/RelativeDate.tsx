import { useEffect, useMemo, useState } from 'react';
import { useLocale } from '../../i18n';
import { formatDateTime, formatRelative } from '../../lib/date';

interface RelativeDateProps {
  date: Date | string;
}

/**
 * Displays a date as relative text (e.g., "2 hours ago") that updates every 60 seconds.
 * Shows the absolute date on hover via title attribute.
 *
 * Both labels are produced by the active locale's `Intl` rules, so switching
 * language live also re-renders this component with the new wording.
 */
export const RelativeDate = ({ date }: RelativeDateProps) => {
  const { locale } = useLocale();
  const [relativeText, setRelativeText] = useState<string>('');

  // Convert string to Date if needed and keep a stable reference for hooks.
  const dateObj = useMemo(() => (typeof date === 'string' ? new Date(date) : date), [date]);

  // Format absolute date for title attribute (locale-aware)
  const absoluteDate = formatDateTime(dateObj, locale);

  useEffect(() => {
    const updateRelativeDate = () => {
      setRelativeText(formatRelative(dateObj, locale));
    };

    // Initial update
    updateRelativeDate();

    // Set up interval to update every 60 seconds
    const interval = setInterval(updateRelativeDate, 60000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [dateObj, locale]);

  if (!relativeText) {
    return <span title={absoluteDate}>Loading...</span>;
  }

  return <span title={absoluteDate}>{relativeText}</span>;
};
