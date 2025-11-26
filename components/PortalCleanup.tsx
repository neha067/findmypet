"use client";

import { useEffect } from "react";

export function PortalCleanup() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Remove duplicate nextjs-portal elements
    const cleanup = () => {
      try {
        const portals = document.querySelectorAll("nextjs-portal");
        if (portals.length > 1) {
          // Keep only the first one, remove the rest
          Array.from(portals).slice(1).forEach((portal) => {
            try {
              portal.remove();
            } catch (error) {
              // Silently fail if portal is already removed
            }
          });
        }
        
        // Also ensure they're hidden
        portals.forEach((portal) => {
          if (portal instanceof HTMLElement) {
            portal.style.display = "none";
          }
        });
      } catch (error) {
        // Silently fail - portals might not exist yet
      }
    };

    // Run cleanup after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(cleanup, 100);
    const intervalId = setInterval(cleanup, 1000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  return null;
}

