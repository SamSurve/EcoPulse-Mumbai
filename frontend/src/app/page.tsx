"use client";

import React, { useState, useEffect } from "react";
import { LandingPage } from "../components/LandingPage";
import { Dashboard } from "../components/Dashboard";
import { AboutUs } from "../components/AboutUs";
import { RollingText } from "../components/RollingText";
import { SquareWaveLoader } from "../components/SquareWaveLoader";

export default function EcoPulseApp() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isOverlayFading, setIsOverlayFading] = useState(false);
  const [currentView, setCurrentView] = useState<"landing" | "dashboard" | "about">("landing");
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Seamless Initial Splash Lifecycle:
  // 1. RollingText completes its roll in ~1.3s
  // 2. Starts silky 600ms opacity crossfade at 1.4s
  // 3. Fully unmounts overlay from memory at 2.0s
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsOverlayFading(true);
    }, 1400);

    const unmountTimer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2050);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  const handleLaunchDashboard = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsTransitioning(false);
      setCurrentView("dashboard");
    }, 1000);
  };

  const handleShowAboutUs = () => {
    setCurrentView("about");
  };

  const handleBackToLanding = () => {
    setCurrentView("landing");
  };

  return (
    <div className="relative min-h-screen w-full bg-[#030712] text-white">
      {/* View Router */}
      {currentView === "about" && (
        <AboutUs onBack={handleBackToLanding} />
      )}

      {currentView === "dashboard" && (
        <Dashboard onBackToLanding={handleBackToLanding} />
      )}

      {currentView === "landing" && (
        <LandingPage
          onLaunch={handleLaunchDashboard}
          onShowAboutUs={handleShowAboutUs}
        />
      )}

      {/* Intermediary Transitioning Screen with SquareWaveLoader */}
      {isTransitioning && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#030712]/95 backdrop-blur-md space-y-6 animate-fadeIn">
          <SquareWaveLoader count={5} size={16} gap={8} squareClassName="bg-emerald-400" />
          <p className="text-emerald-400 font-mono text-xs tracking-wider uppercase animate-pulse">
            Initializing Environmental Intelligence...
          </p>
        </div>
      )}

      {/* Initial App Mount Splash Overlay (Cross-fades seamlessly over LandingPage) */}
      {isInitialLoading && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-[#051114] transition-opacity duration-700 ease-in-out ${
            isOverlayFading ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          aria-hidden={isOverlayFading}
        >
          <RollingText text="ECO PULSE" textColor="#10b981" duration={1.1} />
        </div>
      )}
    </div>
  );
}
