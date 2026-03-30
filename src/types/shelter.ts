export interface ShelterApprovalQueueItem {
  id: string; // adoptionId
  petId: string;
  petName: string;
  petPhotoUrl?: string;
  adopterName: string;
  submissionDate: string; // ISO string
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface ShelterApprovalsResponse {
  items: ShelterApprovalQueueItem[];
  total: number;
  page: number;
  hasMore: boolean;
}
