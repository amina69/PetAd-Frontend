
// Common types used across the application

export interface Listing {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: string;
  status: string;
  interests: number;
  imageUrl: string;
}

export interface InterestPet {
  id: string;
  name: string;
  breed: string;
  category: string;
  age: string;
  location: string;
  imageUrl: string;
  isFavourite: boolean;
  isInterested: boolean;
  consent: string;
  adoption: boolean;
}

export type NotificationType = "success" | "adoption" | "reminder";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  hasArrow: boolean;
  meta?: {
    amount?: string;
    refId?: string;
    adoptionId?: string;
  };
}
