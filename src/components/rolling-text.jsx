import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const LINE_HEIGHT = 0.8;
const FONT_FAMILY = "Helvetica Neue, Arial Narrow, system-ui, sans-serif";

/** Deterministic PRNG so the server and client build identical reels. */
const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const buildReel = (charIndex, config) => {
  const rand = mulberry32(charIndex * 1013 + 7);
  const cycles = config.minCycles + Math.floor(rand() * config.cycleVariance);

  return {
    copies: cycles + 1,
    to: cycles,
    duration: config.duration + rand() * config.durationVariance,
  };
};

const RollingText = ({
  text = "ECO PULSE",
  textColor,
  minCycles = 5,
  cycleVariance = 2,
  duration = 1.3,
  durationVariance = 0.3,
}) => {
  const containerRef = useRef(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const reels = gsap.utils.toArray("[data-reel]", containerRef.current);

      if (reduced) {
        reels.forEach((reel) => {
          const to = Number(reel.dataset.to ?? "0");
          gsap.set(reel, { y: `-${to * 0.8}em` });
        });
        const heading = containerRef.current?.querySelector("h3");
        if (heading) {
          gsap.fromTo(
            heading,
            { opacity: 0 },
            { opacity: 1, duration: 0.6, ease: "power1.out" }
          );
        }
        return;
      }

      reels.forEach((reel) => {
        const to = Number(reel.dataset.to);

        gsap.fromTo(
          reel,
          { y: "0em" },
          {
            y: `-${to * 0.8}em`,
            duration: Number(reel.dataset.duration),
            ease: "expo.out",
            force3D: true,
          }
        );
      });
    },
    {
      scope: containerRef,
      dependencies: [minCycles, cycleVariance, duration, durationVariance],
    }
  );

  return (
    <div
      ref={containerRef}
      className="relative grid place-items-center min-h-dvh w-full flex-grow bg-[#051114]"
    >
      <h3
        aria-label={text}
        style={{ ...(textColor ? { color: textColor } : {}), fontFamily: FONT_FAMILY }}
        className={`relative z-10 m-0 text-9xl max-[1025px]:text-6xl max-md:text-5xl !font-light !leading-[0.8] tracking-[0.02em] whitespace-nowrap select-none ${textColor ? "" : "text-foreground"}`}
      >
        {text.split("").map((char, charIndex) => {
          if (char === " ") {
            return (
              <span key={charIndex} className="inline-block" aria-hidden>
                &nbsp;
              </span>
            );
          }

          const reel = buildReel(charIndex, { minCycles, cycleVariance, duration, durationVariance });

          return (
            <span
              key={charIndex}
              className="relative inline-block align-top"
              aria-hidden
            >
              {/* Invisible copy of the letter: it alone sets the cell box, so
                  the landed word matches plain text exactly. */}
              <span className="block invisible">{char}</span>

              <span className="absolute inset-0 overflow-hidden">
                <span
                  data-reel=""
                  data-to={reel.to}
                  data-duration={reel.duration}
                  className="block will-change-transform"
                >
                  {Array.from({ length: reel.copies }, (_, copy) => (
                    <span key={copy} className="block w-full h-[0.8em] text-center">
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
};

export default RollingText;
