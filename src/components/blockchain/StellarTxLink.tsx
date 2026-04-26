
interface Props {
  accountId: string;
}

export function StellarTxLink({ accountId }: Props) {
  const truncatedId = `${accountId.slice(0, 4)}...${accountId.slice(-4)}`;
  const url = `https://stellar.expert/explorer/public/account/${accountId}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-800 underline text-sm"
      aria-label={`View Stellar account ${accountId}`}
    >
      {truncatedId}
    </a>
  );
}
