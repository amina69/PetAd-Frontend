import { pseudoLocalise } from "./pseudo";

const messages = {
  home: {
    welcome: "WELCOME PET LOVER!",
    description: "Research has shown that - those who keep pets for emotional support or companionship tend to live a longer life.",
    list: "List For Adoption",
    adopt: "I Want To Adopt",
  },
  notifications: {
    title: "Notifications",
    filters: "Notification filters",
    all: "All",
    unread: "Unread",
    read: "Read",
    Today: "Today",
    Yesterday: "Yesterday",
    Earlier: "Earlier",
    noUnread: "No unread notifications",
    noUnreadDescription: "You're all caught up! New notifications will appear here.",
    noRead: "No read notifications",
    noReadDescription: "Notifications you've opened will appear here.",
    empty: "No notifications yet",
    emptyDescription: "When activity happens on your adoptions, you'll see updates here.",
    reconnecting: "Reconnecting to notification service...",
    disconnected: "Disconnected from notification service",
    reconnect: "Reconnect",
    error: "Something went wrong",
    loadFailed: "Failed to load notifications. Please try again.",
    end: "You've reached the end",
  },
  signIn: {
    welcome: "Welcome Pet Lover!",
    continue: "Sign in to continue:",
    google: "Continue with Google",
    email: "Email Address",
    emailPlaceholder: "Enter your email address",
    password: "Password",
    passwordPlaceholder: "Create your password",
    forgot: "Forget Password?",
    submit: "Sign In",
    noAccount: "Don't have an account?",
    register: "Create Account",
  },
} as const;

function selectLocale(): "en" | "en-XA" {
  if (!import.meta.env.DEV || typeof window === "undefined") return "en";

  const requested = new URLSearchParams(window.location.search).get("locale");
  if (requested === "en" || requested === "en-XA") {
    window.sessionStorage.setItem("petad.locale", requested);
  }
  return window.sessionStorage.getItem("petad.locale") === "en-XA" ? "en-XA" : "en";
}

export const activeLocale = selectLocale();

export function localise(text: string): string {
  return activeLocale === "en-XA" ? pseudoLocalise(text) : text;
}

export function t<N extends keyof typeof messages>(
  namespace: N,
  key: keyof (typeof messages)[N],
): string {
  return localise(String(messages[namespace][key]));
}
