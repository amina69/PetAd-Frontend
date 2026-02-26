export default function StatusInfo({ status }: { status: string }) {
  if (status === "Pending Consent") {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
        <p className="font-semibold text-yellow-700">Pending Consent</p>
        <p className="text-yellow-600">
          Go to the Interested Users tab to approve / consent to an adoption
          interest.
        </p>
      </div>
    );
  }

  if (status === "Consent Granted") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
        <p className="font-semibold text-green-700">Consent Granted</p>
        <p className="text-green-600">
          You have approved a request to adopt your pet.
        </p>
      </div>
    );
  }

  return null;
}
