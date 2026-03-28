import axios from "axios";

export const resolveDispute = async (
  disputeId: string,
  shelterPercent: number,
  adopterPercent: number
) => {
  const response = await axios.post(
    `/disputes/${disputeId}/resolve`,
    {
      shelterPercent,
      adopterPercent,
    }
  );

  return response.data;
};