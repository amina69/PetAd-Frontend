import { useCallback, useEffect, useState } from "react";

const DISMISSED_UNTIL_KEY = "petad:install-prompt-dismissed-until";
const DISMISSAL_DAYS = 30;

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function useInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dismissedUntil = Number(localStorage.getItem(DISMISSED_UNTIL_KEY));
    if (dismissedUntil > Date.now()) setDismissed(true);
    else if (dismissedUntil) localStorage.removeItem(DISMISSED_UNTIL_KEY);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setError("");
      setInstallEvent(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    const expiry = Date.now() + DISMISSAL_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISSED_UNTIL_KEY, String(expiry));
    setDismissed(true);
    setInstallEvent(null);
    setError("");
  }, []);

  const install = useCallback(async () => {
    if (!installEvent) return;
    setError("");
    try {
      await installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      setInstallEvent(null);
      if (outcome === "accepted") setInstalled(true);
      else dismiss();
    } catch {
      setError("The install prompt could not be opened. Please try again later.");
      setInstallEvent(null);
    }
  }, [dismiss, installEvent]);

  return {
    canInstall: Boolean(installEvent) && !dismissed && !installed,
    dismissed,
    error,
    install,
    dismiss,
  };
}
