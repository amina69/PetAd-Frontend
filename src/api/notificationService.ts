
import type { Notification } from '../types';

// Mock data
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    type: "success",
    title: "Verification Status",
    message: "Your NIN verification is confirmed & successful. You can proceed with to list or show interest to adopt a pet",
    time: "2 min ago",
    hasArrow: false,
  },
  {
    id: 2,
    type: "adoption",
    title: "New Adoption Interest",
    message: "A user has indicated interest on your listed open adoption",
    time: "2 min ago",
    hasArrow: true,
  },
  {
    id: 3,
    type: "success",
    title: "Payment Successful",
    message: "Your payment for the system management service has been confirmed.",
    meta: {
      amount: "5000 Naira",
      refId: "1092751375"
    },
    time: "2 min ago",
    hasArrow: false,
  },
  {
    id: 4,
    type: "success",
    title: "Adoption Request Approved",
    message: "The pet owner has approved your request to adopt their pet. You can proceed to the next step",
    time: "2 min ago",
    hasArrow: true,
  },
  {
    id: 5,
    type: "reminder",
    title: "Reminder",
    message: "This is a reminder to confirm completion of adoption",
    meta: {
      adoptionId: "10927"
    },
    time: "2 min ago",
    hasArrow: true,
  },
];

export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_NOTIFICATIONS);
      }, 600);
    });
  },

  markAsRead: async (id: number): Promise<boolean> => {
    return new Promise((resolve) => {
      console.log(`Marked notification ${id} as read`);
      resolve(true);
    });
  },

  clearAll: async (): Promise<boolean> => {
    return new Promise((resolve) => {
      console.log("Cleared all notifications");
      resolve(true);
    });
  }
};
