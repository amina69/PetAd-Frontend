import { useEffect } from "react";
import { useToast } from "../toast/useToast";
import { logger } from "../../lib/logger";

export function PwaUpdatePrompt() {
  const { showToast } = useToast();

  useEffect(() => {
    if (
      !import.meta.env.PROD ||
      import.meta.env.VITE_MSW === "true" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    let updateAccepted = false;
    let registration: ServiceWorkerRegistration | undefined;

    const showUpdate = (worker: ServiceWorker) => {
      showToast({
        type: "info",
        title: "New version available",
        message: "Refresh to load the latest version.",
        duration: 0,
        action: {
          label: "Refresh",
          onClick: () => {
            updateAccepted = true;
            worker.postMessage({ type: "SKIP_WAITING" });
          },
        },
      });
    };

    const handleControllerChange = () => {
      if (updateAccepted) {
        window.location.reload();
      }
    };

    const handleUpdateFound = () => {
      const installingWorker = registration?.installing;
      if (!installingWorker) return;

      installingWorker.addEventListener("statechange", () => {
        if (
          installingWorker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          showUpdate(installingWorker);
        }
      });
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange,
    );

    navigator.serviceWorker
      .register("/sw.js")
      .then((serviceWorkerRegistration) => {
        registration = serviceWorkerRegistration;
        if (registration.waiting && navigator.serviceWorker.controller) {
          showUpdate(registration.waiting);
        }
        registration.addEventListener("updatefound", handleUpdateFound);
      })
      .catch((error: unknown) => {
        logger.error("Failed to register the app service worker.", error);
      });

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange,
      );
      registration?.removeEventListener("updatefound", handleUpdateFound);
    };
  }, [showToast]);

  return null;
}
