// @ts-nocheck
/**
 * Video Splash Screen
 * Plays output_HD1080.mp4 as the intro splash, then calls onComplete.
 */

import { useRef, useCallback } from "react";

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleEnded = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const handleClick = useCallback(() => {
    // Allow skipping by clicking
    onComplete();
  }, [onComplete]);

  return (
    <div
      onClick={handleClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <video
        ref={videoRef}
        src="/output_HD1080.mp4"
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
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
