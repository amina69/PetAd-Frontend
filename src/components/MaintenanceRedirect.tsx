import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function MaintenanceRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const redirect = () => navigate("/maintenance", { replace: true });
    window.addEventListener("petad:maintenance", redirect);
    return () => window.removeEventListener("petad:maintenance", redirect);
  }, [navigate]);

  return null;
}
