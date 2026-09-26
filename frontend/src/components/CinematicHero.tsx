"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { EnvironmentalScene } from "./hero/EnvironmentalScene";
import { RisingWhitePanel } from "./hero/RisingWhitePanel";
import { EnvironmentalHud } from "./hero/EnvironmentalHud";

interface CinematicHeroProps {
  onExploreDashboard?: () => void;
}

const TOTAL_INTRO_DURATION = 8.0; // 7-8 second cinematic intro target

export const CinematicHero: React.FC<CinematicHeroProps> = ({ onExploreDashboard }) => {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const requestRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mediaQuery.matches) {
        // Immediately complete if user prefers reduced motion
        setCurrentTime(TOTAL_INTRO_DURATION);
        setIsCompleted(true);
        setIsPlaying(false);
      }
    }
  }, []);

  // Main 8-Second Cinematic Intro Animation Loop
  const animate = useCallback((timestamp: number) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = timestamp;
    }

    const elapsed = (timestamp - startTimeRef.current) / 1000;

    if (elapsed >= TOTAL_INTRO_DURATION) {
      setCurrentTime(TOTAL_INTRO_DURATION);
      setIsCompleted(true);
      setIsPlaying(false);
    } else {
      setCurrentTime(elapsed);
      requestRef.current = requestAnimationFrame(animate);
    }
  }, []);

  useEffect(() => {
    if (isPlaying && !isCompleted) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying, isCompleted, animate]);

  // Handle Skip Intro
  const handleSkip = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    setCurrentTime(TOTAL_INTRO_DURATION);
    setIsCompleted(true);
    setIsPlaying(false);
  };

  // Handle Replay Intro
  const handleReplay = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    startTimeRef.current = null;
    setCurrentTime(0);
    setIsCompleted(false);
    setIsPlaying(true);
  };

  // Handle Get Started CTA click
  const handleGetStarted = () => {
    if (onExploreDashboard) {
      onExploreDashboard();
    } else {
      const dashboardTarget = document.getElementById("dashboard-overview");
      if (dashboardTarget) {
        dashboardTarget.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollBy({ top: window.innerHeight * 0.75, behavior: "smooth" });
      }
    }
  };

  // ====================================================
  // Calculate Timeline Interpolation Variables
  // ====================================================
  // 4.5s - 6.0s: Cinematic Camera Pullback
  const pullbackProgress = isCompleted
    ? 1.0
    : currentTime < 4.5
    ? 0.0
    : Math.min((currentTime - 4.5) / 1.5, 1.0);

  // 6.0s - 7.2s: Rising White Panel
  const riseProgress = isCompleted
    ? 1.0
    : currentTime < 6.0
    ? 0.0
    : Math.min((currentTime - 6.0) / 1.2, 1.0);

  // 7.2s - 8.0s: Typography Reveal
  const revealProgress = isCompleted
    ? 1.0
    : currentTime < 7.2
    ? 0.0
    : Math.min((currentTime - 7.2) / 0.8, 1.0);

  return (
    <section className="relative w-full h-[100vh] min-h-[640px] max-h-[1050px] overflow-hidden bg-slate-950 select-none">
      {/* 2.5D Living Environmental Scene Canvas (Sky, Clouds, Sea, Skyline, Trees, Grass, Particles) */}
      <EnvironmentalScene
        currentTime={currentTime}
        pullbackProgress={pullbackProgress}
        isAmbientMode={isCompleted}
      />

      {/* Atmospheric Telemetry & Intro Progress Controls (Active during intro) */}
      <EnvironmentalHud
        currentTime={currentTime}
        totalDuration={TOTAL_INTRO_DURATION}
        isPlaying={isPlaying && !isCompleted}
        onSkip={handleSkip}
      />

      {/* The Physical Rising White / Off-White Panel (6.0s - 7.2s) & Typography Reveal (7.2s - 8.0s) */}
      <RisingWhitePanel
        riseProgress={riseProgress}
        revealProgress={revealProgress}
        onGetStarted={handleGetStarted}
        onReplay={handleReplay}
      />
    </section>
  );
};
