"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Reset on any navigation
    setIsNavigating(true);
    setIsVisible(true);

    // Simulate progress completion
    // In a real app, you'd hook into router events
    const timeout = setTimeout(() => {
      setIsNavigating(false);
      // Delay hiding to allow CSS transition
      setTimeout(() => {
        setIsVisible(false);
      }, 150);
    }, 300);

    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  return (
    <>
      <style jsx global>{`
        @keyframes navigation-progress {
          0% {
            width: 0%;
            opacity: 1;
          }
          50% {
            width: 70%;
            opacity: 1;
          }
          80% {
            width: 90%;
            opacity: 1;
          }
          100% {
            width: 100%;
            opacity: 0;
          }
        }

        .navigation-progress-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #9333ea, #d946ef, #0ea5e9);
          z-index: 99999;
          transition: opacity 150ms ease-out;
        }

        .navigation-progress-bar.animating {
          animation: navigation-progress 1.5s ease-in-out forwards;
        }
      `}</style>
      <div
        className={`navigation-progress-bar ${isNavigating ? "animating" : ""}`}
        style={{
          opacity: isVisible ? 1 : 0,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />
    </>
  );
}
