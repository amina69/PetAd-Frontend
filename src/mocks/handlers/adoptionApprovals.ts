import { http, HttpResponse, delay } from "msw";

interface AdoptionApprovalsResponse {
  required: number;
  given: number;
  quorumMet: boolean;
  escrowAccountId: string | null;
}

/**
 * Pre-quorum handler: Returns approval state before quorum is reached
 */
export function preQuorumHandler(adoptionId: string) {
  return http.get(`*/api/adoption/${adoptionId}/approvals`, async () => {
    await delay(100);
    const response: AdoptionApprovalsResponse = {
      required: 3,
      given: 1,
      quorumMet: false,
      escrowAccountId: null,
    };
    return HttpResponse.json(response);
  });
}

/**
 * Post-quorum handler: Returns approval state after quorum is reached
 */
export function postQuorumHandler(adoptionId: string) {
  return http.get(`*/api/adoption/${adoptionId}/approvals`, async () => {
    await delay(100);
    const response: AdoptionApprovalsResponse = {
      required: 3,
      given: 3,
      quorumMet: true,
      escrowAccountId: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    };
    return HttpResponse.json(response);
  });
}

/**
 * Default handler for global MSW setup
 */
export default [preQuorumHandler("default-test-id")];
