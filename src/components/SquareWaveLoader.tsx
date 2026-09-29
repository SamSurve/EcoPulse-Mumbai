"use client";

import React, { useMemo, useId } from "react";

export interface SquareWaveLoaderProps {
  count?: number;
  size?: number;
  gap?: number;
  duration?: number;
  easing?: string;
  className?: string;
  squareClassName?: string;
}

export function SquareWaveLoader({
  count = 5,
  size = 14,
  gap = 8,
  duration = 2100,
  easing = "cubic-bezier(0.4, 0, 0.2, 1)",
  className = "",
  squareClassName = "bg-white",
}: SquareWaveLoaderProps) {
  const instanceId = useId().replace(/:/g, "");
  const squares = Array.from({ length: count });

  const totalWidth = count * size + (count - 1) * gap;
  const effectiveBounceHeight = totalWidth - size;
  const maxScale = 1 + effectiveBounceHeight / size;
  const halfBounceHeight = effectiveBounceHeight / 2;
  const halfScale = 1 + halfBounceHeight / size;

  const keyframeRules = useMemo(() => {
    return squares
      .map((_, i) => {
        const riseBase = 2 + Math.round(i * 2.5);
        const fallBase = riseBase + 44;
        const animationName = `swl-${instanceId}-${i}`;

        return `
    @keyframes ${animationName} {
      0%, ${Math.max(0, riseBase - 2)}% { transform: translateY(0) scaleY(1); animation-timing-function: ease-in-out; }
      ${riseBase}% { transform: translateY(0) scaleY(0.75); animation-timing-function: ${easing}; }
      ${riseBase + 5}% { transform: translateY(0) scaleY(${halfScale}); animation-timing-function: ${easing}; }
      ${riseBase + 10}% { transform: translateY(-${halfBounceHeight}px) scaleY(1); animation-timing-function: ease-in-out; }
      ${riseBase + 13}% { transform: translateY(-${halfBounceHeight}px) scaleY(1); animation-timing-function: ease-in-out; }
      ${riseBase + 16}% { transform: translateY(-${halfBounceHeight + size * 0.25}px) scaleY(0.75); animation-timing-function: ${easing}; }
      ${riseBase + 21}% { transform: translateY(-${halfBounceHeight}px) scaleY(${halfScale}); animation-timing-function: ${easing}; }
      ${riseBase + 26}% { transform: translateY(-${effectiveBounceHeight}px) scaleY(1); animation-timing-function: ease-in-out; }
      ${riseBase + 29}% { transform: translateY(-${effectiveBounceHeight + size * 0.25}px) scaleY(0.75); animation-timing-function: ${easing}; }
      ${riseBase + 32}%, ${fallBase - 2}% { transform: translateY(-${effectiveBounceHeight}px) scaleY(1); animation-timing-function: ease-in-out; }
      ${fallBase}% { transform: translateY(-${effectiveBounceHeight + size * 0.25}px) scaleY(0.75); animation-timing-function: ${easing}; }
      ${fallBase + 8}% { transform: translateY(0) scaleY(${maxScale}); animation-timing-function: ${easing}; }
      ${fallBase + 15}% { transform: translateY(0) scaleY(1); animation-timing-function: ease-in-out; }
      ${fallBase + 18}% { transform: translateY(0) scaleY(0.75); animation-timing-function: ${easing}; }
      ${fallBase + 21}%, 100% { transform: translateY(0) scaleY(1); }
    }
    .swl-square-${instanceId}-${i} {
      animation: ${animationName} ${duration}ms linear infinite;
    }
  `;
      })
      .join("\n");
  }, [count, size, gap, duration, easing, instanceId, effectiveBounceHeight, halfBounceHeight, halfScale, maxScale]);

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-flex items-end justify-center ${className}`}
      style={{
        gap: `${gap}px`,
        width: `${totalWidth}px`,
        height: `${totalWidth}px`,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: keyframeRules }} />
      {squares.map((_, i) => (
        <div
          key={i}
          className={`swl-square-${instanceId}-${i} ${squareClassName}`}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: 0,
            transformOrigin: "bottom center",
            willChange: "transform",
          }}
        />
      ))}
    </div>
  );
}

export default SquareWaveLoader;
