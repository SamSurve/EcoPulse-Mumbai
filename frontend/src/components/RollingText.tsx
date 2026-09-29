"use client";

import React, { useEffect, useRef } from "react";

export interface RollingTextProps {
  text?: string;
  textColor?: string;
  minCycles?: number;
  cycleVariance?: number;
  duration?: number;
  durationVariance?: number;
}

const LINE_HEIGHT = 0.8;
const FONT_FAMILY = '"Helvetica Neue", "Arial Narrow", system-ui, -apple-system, sans-serif';

/** Deterministic PRNG so the server and client build identical reels. */
const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const buildReel = (charIndex: number, config: { minCycles: number; cycleVariance: number; duration: number; durationVariance: number }) => {
  const rand = mulberry32(charIndex * 1013 + 7);
  const cycles = config.minCycles + Math.floor(rand() * config.cycleVariance);

  return {
    copies: cycles + 1,
    to: cycles,
    duration: config.duration + rand() * config.durationVariance,
  };
};

// Exact GSAP expo.out easing curve
const easeExpoOut = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export function RollingText({
  text = "ECO PULSE",
  textColor = "#10b981",
  minCycles = 5,
  cycleVariance = 2,
  duration = 1.3,
  durationVariance = 0.3,
}: RollingTextProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reels = containerRef.current.querySelectorAll<HTMLElement>("[data-reel]");

    if (reduced) {
      reels.forEach((reel) => {
        const to = Number(reel.dataset.to || 0);
        reel.style.transform = `translate3d(0, calc(-1em * ${LINE_HEIGHT} * ${to}), 0)`;
      });
      return;
    }

    let start: number | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = (timestamp - start) / 1000;
      let allDone = true;

      reels.forEach((reel) => {
        const to = Number(reel.dataset.to || 0);
        const reelDuration = Number(reel.dataset.duration || duration);
        const progress = Math.min(elapsed / reelDuration, 1);
        const eased = easeExpoOut(progress);
        const currentK = to * eased;

        reel.style.transform = `translate3d(0, calc(-1em * ${LINE_HEIGHT} * ${currentK}), 0)`;

        if (progress < 1) {
          allDone = false;
        }
      });

      if (!allDone) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [minCycles, cycleVariance, duration, durationVariance]);

  return (
    <div
      ref={containerRef}
      className="relative grid place-items-center min-h-screen w-full flex-grow bg-[#051114]"
    >
      <h3
        aria-label={text}
        style={{
          ...(textColor ? { color: textColor } : {}),
          fontFamily: FONT_FAMILY,
        }}
        className={`relative z-10 m-0 text-9xl max-[1025px]:text-6xl max-md:text-5xl !font-light !leading-[0.8] tracking-[0.02em] whitespace-nowrap select-none ${
          textColor ? "" : "text-white"
        }`}
      >
        {text.split("").map((char, charIndex) => {
          if (char === " ") {
            return (
              <span key={charIndex} className="inline-block" aria-hidden="true">
                &nbsp;
              </span>
            );
          }

          const reel = buildReel(charIndex, { minCycles, cycleVariance, duration, durationVariance });

          return (
            <span
              key={charIndex}
              className="relative inline-block align-top"
              aria-hidden="true"
            >
              {/* Invisible copy of the letter: it alone sets the cell box so the landed word matches plain text exactly */}
              <span className="block invisible">{char}</span>

              <span className="absolute inset-0 overflow-hidden">
                <span
                  data-reel=""
                  data-to={reel.to}
                  data-duration={reel.duration}
                  className="block will-change-transform"
                  style={{
                    transform: "translate3d(0, 0, 0)",
                  }}
                >
                  {Array.from({ length: reel.copies }, (_, copy) => (
                    <span
                      key={copy}
                      className="block w-full text-center"
                      style={{ height: `${LINE_HEIGHT}em`, lineHeight: `${LINE_HEIGHT}em` }}
                    >
                      {char}
                    </span>
                  ))}
                </span>
              </span>
            </span>
          );
        })}
      </h3>
    </div>
  );
}

export default RollingText;
