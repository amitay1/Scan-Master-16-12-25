// @ts-nocheck
/**
 * Video Splash Screen
 * Plays the user-selected video intro, then calls onComplete.
 * Skip with Space key only.
 */

import { useRef, useCallback, useEffect, useState } from "react";

const videoSources: Record<number, string> = {
  1: "/output_HD1080.mp4",
  2: "/output_HD1080%20(1).mp4",
  3: "/output_HD1080%20(2).mp4",
};

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const completedRef = useRef(false);

  const [videoSrc] = useState<string>(() => {
    const saved = localStorage.getItem("selectedSplashVideo");
    const id = saved ? parseInt(saved) : 1;
    return videoSources[id] || videoSources[1];
  });

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  // Space key to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [finish]);

  // Handle video errors - skip to app if video fails to load
  const handleError = useCallback(() => {
    console.warn("SplashScreen: Video failed to load, skipping intro");
    finish();
  }, [finish]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        playsInline
        muted
        onEnded={finish}
        onError={handleError}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </div>
  );
};

export default SplashScreen;
