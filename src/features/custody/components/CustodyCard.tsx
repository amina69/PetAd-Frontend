import { CustodyStatusBadge } from "../../../components/custody";
import { diffInDays, formatDateOnly, todayDateOnly } from "../../../lib/dateOnly";
import type { CustodyArrangement } from "../types/custody";

export interface CustodyCardProps {
  /** The arrangement to render. */
  arrangement: CustodyArrangement;
  /**
   * Id of the signed-in user.
   *
   * It decides the perspective the card is written from: an owner sees the
   * caretaker as the counterpart, a caretaker sees the owner.
   */
  viewerId?: string | null;
  /** Today's date, as a date-only string (defaults to the current day). */
  today?: string;
}

/** The side of an arrangement the signed-in user is on. */
export type CustodyPerspective = "owner" | "caretaker" | "observer";

/**
 * Works out which side of an arrangement the viewer is on.
 *
 * `observer` means the viewer is neither the owner nor the caretaker — the
 * card then stays neutral instead of claiming a perspective.
 */
export function getCustodyPerspective(
  arrangement: CustodyArrangement,
  viewerId?: string | null,
): CustodyPerspective {
  if (!viewerId) return "observer";
  if (arrangement.ownerId === viewerId) return "owner";
  if (arrangement.caretakerId === viewerId) return "caretaker";

  return "observer";
}

/**
 * The number of days left in the arrangement, or the number of days until it
 * starts for an arrangement that has not begun yet.
 *
 * The value is negative once the arrangement has ended.
 */
export function getDaysRemaining(
  arrangement: CustodyArrangement,
  today: string = todayDateOnly(),
): number {
  const daysUntilStart = diffInDays(today, arrangement.startDate);
  if (daysUntilStart > 0) {
    // It has not started yet — count the days until it does.
    return daysUntilStart;
  }

  return diffInDays(today, arrangement.endDate);
}

/**
 * CustodyCard — one custody arrangement on the dashboard.
 *
 * The card shows the pet, the counterpart, the dates, the status and the
 * number of days left. The counterpart is labelled from the viewer's
 * perspective: an owner sees "Caretaker", a caretaker sees "Owner".
 */
export function CustodyCard({
  arrangement,
  viewerId,
  today,
}: CustodyCardProps) {
  const perspective = getCustodyPerspective(arrangement, viewerId);
  const referenceDay = today ?? todayDateOnly();
  const daysUntilStart = diffInDays(referenceDay, arrangement.startDate);
  const daysLeft = diffInDays(referenceDay, arrangement.endDate);

  const daysLabel =
    daysUntilStart > 0
      ? `Starts in ${daysUntilStart} ${daysUntilStart === 1 ? "day" : "days"}`
      : daysLeft >= 0
        ? `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`
        : `Ended ${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? "day" : "days"} ago`;

  const counterpartLabel =
    perspective === "caretaker" ? "Owner" : "Caretaker";
  const counterpartName =
    perspective === "caretaker"
      ? (arrangement.ownerName ?? arrangement.ownerId)
      : (arrangement.caretakerName ?? arrangement.caretakerId);

  const perspectiveLabel =
    perspective === "owner"
      ? "You are the owner"
      : perspective === "caretaker"
        ? "You are the caretaker"
        : null;

  return (
    <article
      className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
      data-testid={`custody-card-${arrangement.id}`}
      aria-label={`Custody for ${arrangement.petName ?? arrangement.petId}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900">
            {arrangement.petName ?? arrangement.petId}
          </h3>
          {arrangement.petName && (
            <p className="text-sm text-gray-500">{arrangement.petId}</p>
          )}
        </div>

        <CustodyStatusBadge status={arrangement.status} />
      </div>

      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">{counterpartLabel}</dt>
          <dd
            className="font-medium text-gray-900"
            data-testid={`custody-card-counterpart-${arrangement.id}`}
          >
            {counterpartName}
          </dd>
        </div>

        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">From</dt>
          <dd className="font-medium text-gray-900">
            {formatDateOnly(arrangement.startDate)}
          </dd>
        </div>

        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">To</dt>
          <dd className="font-medium text-gray-900">
            {formatDateOnly(arrangement.endDate)}
          </dd>
        </div>

        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">Days</dt>
          <dd
            className="font-medium text-gray-900"
            data-testid={`custody-card-days-${arrangement.id}`}
          >
            {daysLabel}
          </dd>
        </div>
      </dl>

      {perspectiveLabel && (
        <p
          className="self-start rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
          data-testid={`custody-card-perspective-${arrangement.id}`}
        >
          {perspectiveLabel}
        </p>
      )}
    </article>
  );
}
