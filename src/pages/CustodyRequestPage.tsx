import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { petService } from "../api/petService";
import { useCustodyViewer } from "../features/custody/hooks/useCustodyViewer";
import { CustodyRequestForm } from "../features/custody/components/CustodyRequestForm";

/**
 * CustodyRequestPage — `/pets/:petId/custody/new`.
 *
 * Loads the pet and hands it to the custody request form.
 */
export default function CustodyRequestPage() {
  const { petId } = useParams<{ petId: string }>();
  const { userId, displayName } = useCustodyViewer();

  const { data: pet, isLoading, isError } = useQuery({
    queryKey: ["pet", petId],
    queryFn: () => petService.getPet(petId!),
    enabled: Boolean(petId),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className="p-8 text-gray-600">
        Loading pet…
      </div>
    );
  }

  if (isError || !pet) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-gray-900">
          We could not load that pet
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          The pet may have been removed, or the link may be out of date.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Request custody</h1>
        <p className="mt-1 text-sm text-gray-600">
          Ask a caretaker to look after your pet for a while. You can review
          everything before the request is sent.
        </p>
      </header>

      <CustodyRequestForm
        pet={pet}
        defaultCaretakerId={userId ?? ""}
        caretakers={
          userId
            ? [{ id: userId, name: displayName ?? "Me" }]
            : []
        }
      />
    </div>
  );
}
