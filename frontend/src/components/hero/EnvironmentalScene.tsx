"use client";

import React, { useEffect, useRef } from "react";

interface EnvironmentalSceneProps {
  /** Current playback time in seconds (0.0 to 8.0+) */
  currentTime: number;
  /** Camera pullback progress (0.0 at t<=4.5s to 1.0 at t>=6.0s) */
  pullbackProgress: number;
  /** Whether the intro has completed and the scene is in persistent ambient mode */
  isAmbientMode: boolean;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  pulseSpeed: number;
  phase: number;
}

interface CloudLayer {
  clouds: { x: number; y: number; scale: number; opacity: number }[];
  speed: number;
  altitudeY: number; // 0 to 1 relative to canvas height
}

export const EnvironmentalScene: React.FC<EnvironmentalSceneProps> = ({
  currentTime,
  pullbackProgress,
  isAmbientMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const cloudLayersRef = useRef<CloudLayer[]>([]);
  const streamLinesRef = useRef<{ y: number; speed: number; length: number; offset: number }[]>([]);
  const timeRef = useRef<number>(0);

  // Initialize atmospheric particles and cloud instances
  useEffect(() => {
    // 50 atmospheric particles (pollen, sea-spray aerosols, luminous air motes)
    const particles: Particle[] = [];
    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        size: Math.random() * 2.8 + 1.2,
        speedX: Math.random() * 0.4 + 0.15,
        speedY: (Math.random() - 0.6) * 0.35,
        opacity: Math.random() * 0.6 + 0.25,
        pulseSpeed: Math.random() * 0.03 + 0.015,
        phase: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = particles;

    // 3 distinct parallax cloud layers
    // Layer 1: High altitude, slow, majestic distant cumulus
    // Layer 2: Mid-altitude volumetric cumulus billows
    // Layer 3: Lower coastal marine boundary scud / wisps
    cloudLayersRef.current = [
      {
        speed: 0.12,
        altitudeY: 0.16,
        clouds: [
          { x: 120, y: 30, scale: 1.3, opacity: 0.85 },
          { x: 740, y: 60, scale: 1.6, opacity: 0.9 },
          { x: 1420, y: 20, scale: 1.4, opacity: 0.82 },
          { x: 2050, y: 50, scale: 1.5, opacity: 0.88 },
        ],
      },
      {
        speed: 0.26,
        altitudeY: 0.32,
        clouds: [
          { x: -100, y: 120, scale: 1.1, opacity: 0.75 },
          { x: 480, y: 95, scale: 1.35, opacity: 0.8 },
          { x: 1100, y: 130, scale: 1.25, opacity: 0.78 },
          { x: 1750, y: 100, scale: 1.4, opacity: 0.82 },
        ],
      },
      {
        speed: 0.45,
        altitudeY: 0.48,
        clouds: [
          { x: 220, y: 200, scale: 0.9, opacity: 0.55 },
          { x: 880, y: 190, scale: 0.95, opacity: 0.6 },
          { x: 1540, y: 220, scale: 0.85, opacity: 0.5 },
        ],
      },
    ];

    // Atmospheric wind streamlines (activated around 3.0s - 4.5s)
    streamLinesRef.current = [
      { y: 0.38, speed: 1.2, length: 280, offset: 0 },
      { y: 0.45, speed: 1.6, length: 340, offset: 400 },
      { y: 0.52, speed: 1.1, length: 220, offset: 900 },
      { y: 0.61, speed: 1.4, length: 310, offset: 250 },
    ];
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const render = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;
      const introTime = currentTime;

      // Parallax pullback calculation
      // pullbackProgress is 0 -> 1 during 4.5s - 6.0s
      const easePullback = Math.min(Math.max(pullbackProgress, 0), 1);
      // Smooth cubic ease-in-out
      const p = easePullback < 0.5
        ? 4 * easePullback * easePullback * easePullback
        : 1 - Math.pow(-2 * easePullback + 2, 3) / 2;

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // ==========================================
      // LAYER 1: SKY & ATMOSPHERIC LIGHTING
      // ==========================================
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      // Soft painterly cerulean blue to warm coastal mist
      skyGrad.addColorStop(0.0, "#3B6990");
      skyGrad.addColorStop(0.35, "#6998BC");
      skyGrad.addColorStop(0.68, "#B0CCE0");
      skyGrad.addColorStop(0.88, "#E6ECEE");
      skyGrad.addColorStop(1.0, "#F7F5EE"); // Warm morning coastal horizon
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Sunlight bloom & gentle crepuscular rays at top-left/center
      const sunX = width * 0.28;
      const sunY = height * 0.18;
      const sunRadius = Math.max(width, height) * 0.45;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, sunRadius);
      sunGlow.addColorStop(0, "rgba(255, 250, 235, 0.45)");
      sunGlow.addColorStop(0.3, "rgba(255, 240, 215, 0.22)");
      sunGlow.addColorStop(0.7, "rgba(255, 235, 205, 0.06)");
      sunGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = sunGlow;
      ctx.fillRect(0, 0, width, height);

      // Soft diagonal light rays streaming down
      ctx.save();
      ctx.globalAlpha = 0.08 + Math.sin(t * 0.8) * 0.02;
      for (let ray = -2; ray <= 3; ray++) {
        ctx.beginPath();
        ctx.moveTo(sunX + ray * 60, sunY);
        ctx.lineTo(sunX + ray * 280 - 150, height);
        ctx.lineTo(sunX + ray * 280 + 10, height);
        ctx.closePath();
        ctx.fillStyle = "rgba(255, 252, 240, 0.5)";
        ctx.fill();
      }
      ctx.restore();

      // ==========================================
      // LAYER 2 & 3: CONTINUOUS MOVING CLOUDS
      // (Drifting smoothly & continually in real-time)
      // ==========================================
      const drawPainterlyCloud = (
        cx: number,
        cy: number,
        scale: number,
        opacity: number,
        colorTop: string,
        colorBottom: string
      ) => {
        ctx.save();
        ctx.globalAlpha = opacity;

        // Base soft ambient shadow
        const cloudGrad = ctx.createLinearGradient(cx, cy - 50 * scale, cx, cy + 45 * scale);
        cloudGrad.addColorStop(0.0, colorTop);
        cloudGrad.addColorStop(0.65, "#E2ECF5");
        cloudGrad.addColorStop(1.0, colorBottom);
        ctx.fillStyle = cloudGrad;

        // Volumetric overlapping cumulus puffs
        const puffs = [
          { ox: 0, oy: 0, r: 48 },
          { ox: -45, oy: 12, r: 38 },
          { ox: 48, oy: 10, r: 40 },
          { ox: -85, oy: 22, r: 28 },
          { ox: 92, oy: 20, r: 30 },
          { ox: -25, oy: -22, r: 36 },
          { ox: 32, oy: -20, r: 34 },
          { ox: 0, oy: -35, r: 26 },
        ];

        ctx.beginPath();
        puffs.forEach((p) => {
          ctx.arc(cx + p.ox * scale, cy + p.oy * scale, p.r * scale, 0, Math.PI * 2);
        });
        ctx.fill();

        // Soft sunlit rim highlight on top puffs
        ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
        ctx.beginPath();
        ctx.arc(cx - 20 * scale, cy - 25 * scale, 30 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 15 * scale, cy - 22 * scale, 28 * scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      };

      // Render Cloud Layers with Parallax and Infinite Loop
      cloudLayersRef.current.forEach((layer, layerIdx) => {
        // Clouds move continuously; apply slight parallax camera pullback shift
        const cloudPullbackOffset = p * (layerIdx + 1) * -12;
        layer.clouds.forEach((cloud) => {
          // Continuous drift over time
          const currentX = (cloud.x + t * 22 * layer.speed) % (width + 500) - 250;
          const currentY = height * layer.altitudeY + cloud.y + cloudPullbackOffset;
          const effectiveScale = (width / 1440) * cloud.scale * (1 - p * 0.08 * (3 - layerIdx));

          if (layerIdx === 0) {
            // High altitude clouds: bright white tops, soft misty bases
            drawPainterlyCloud(currentX, currentY, effectiveScale, cloud.opacity, "#FFFFFF", "#C5D7E8");
          } else if (layerIdx === 1) {
            // Mid-altitude cumulus
            drawPainterlyCloud(currentX, currentY, effectiveScale, cloud.opacity, "#FEFFFF", "#ADC5DC");
          } else {
            // Coastal marine scud wisps
            drawPainterlyCloud(currentX, currentY, effectiveScale, cloud.opacity * 0.7, "#EEF5FA", "#B8CEE0");
          }
        });
      });

      // ==========================================
      // LAYER 4: ARABIAN SEA & COASTAL WATERLINE
      // ==========================================
      // Arabian Sea horizon sits around 52% of canvas height
      const seaLevelY = height * (0.54 + p * 0.04);
      const seaGrad = ctx.createLinearGradient(0, seaLevelY, 0, seaLevelY + height * 0.2);
      seaGrad.addColorStop(0.0, "#8EA8BD");
      seaGrad.addColorStop(0.3, "#7A98AF");
      seaGrad.addColorStop(0.7, "#6587A1");
      seaGrad.addColorStop(1.0, "#4C738F");
      ctx.fillStyle = seaGrad;
      ctx.fillRect(0, seaLevelY, width, height - seaLevelY);

      // Delicate sea shimmer ripples
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
      for (let i = 0; i < 18; i++) {
        const rx = (i * 137 + t * 15) % width;
        const ry = seaLevelY + 8 + i * 3.5;
        const rw = 25 + Math.sin(t * 2 + i) * 15;
        ctx.fillRect(rx, ry, rw, 1.2);
      }
      ctx.restore();

      // Atmospheric sea mist over horizon
      const mistGrad = ctx.createLinearGradient(0, seaLevelY - 40, 0, seaLevelY + 40);
      mistGrad.addColorStop(0, "rgba(235, 244, 250, 0)");
      mistGrad.addColorStop(0.5, "rgba(235, 244, 250, 0.55)");
      mistGrad.addColorStop(1, "rgba(235, 244, 250, 0)");
      ctx.fillStyle = mistGrad;
      ctx.fillRect(0, seaLevelY - 40, width, 80);

      // ==========================================
      // LAYER 5: DISTANT MUMBAI SKYLINE SILHOUETTE
      // (Iconic Bandra-Worli Sea Link + coastal high-rises in atmospheric haze)
      // ==========================================
      const skylinePullbackY = seaLevelY - 2;
      const skylineParallax = 1 - p * 0.12;

      ctx.save();
      // Blended atmospheric color: desaturated slate-blue veiled by marine mist
      ctx.fillStyle = "rgba(95, 122, 144, 0.62)";

      // Draw Bandra-Worli Sea Link Cable-Stayed Pylons & Bridge deck (left-center)
      const bridgeBaseX = width * 0.22;
      const bridgeY = skylinePullbackY;
      const pylonHeight = 70 * (height / 900) * skylineParallax;

      // Pylon 1 (Diamond Cable Tower)
      ctx.beginPath();
      ctx.moveTo(bridgeBaseX - 8, bridgeY);
      ctx.lineTo(bridgeBaseX, bridgeY - pylonHeight);
      ctx.lineTo(bridgeBaseX + 8, bridgeY);
      ctx.fill();

      // Pylon 2
      ctx.beginPath();
      ctx.moveTo(bridgeBaseX + 82, bridgeY);
      ctx.lineTo(bridgeBaseX + 90, bridgeY - pylonHeight);
      ctx.lineTo(bridgeBaseX + 98, bridgeY);
      ctx.fill();

      // Bridge Deck
      ctx.fillRect(bridgeBaseX - 90, bridgeY - 8, 290, 4);

      // Delicate stay-cables (fan pattern)
      ctx.strokeStyle = "rgba(130, 155, 175, 0.45)";
      ctx.lineWidth = 1;
      for (let c = -4; c <= 4; c++) {
        // Left tower cables
        ctx.beginPath();
        ctx.moveTo(bridgeBaseX, bridgeY - pylonHeight + 15);
        ctx.lineTo(bridgeBaseX + c * 16, bridgeY - 8);
        ctx.stroke();

        // Right tower cables
        ctx.beginPath();
        ctx.moveTo(bridgeBaseX + 90, bridgeY - pylonHeight + 15);
        ctx.lineTo(bridgeBaseX + 90 + c * 16, bridgeY - 8);
        ctx.stroke();
      }

      // Distant Coastal Highrises (Worli, Lower Parel, South Mumbai skyline silhouettes)
      const buildings = [
        { x: 0.45, w: 22, h: 48 },
        { x: 0.48, w: 18, h: 62 },
        { x: 0.51, w: 32, h: 75 },
        { x: 0.55, w: 24, h: 54 },
        { x: 0.58, w: 16, h: 80 },
        { x: 0.61, w: 28, h: 42 },
        { x: 0.65, w: 34, h: 68 },
        { x: 0.70, w: 20, h: 50 },
        { x: 0.74, w: 26, h: 60 },
        { x: 0.78, w: 18, h: 45 },
      ];

      buildings.forEach((b) => {
        const bx = width * b.x;
        const bw = b.w * (width / 1440) * skylineParallax;
        const bh = b.h * (height / 900) * skylineParallax;
        ctx.fillRect(bx, bridgeY - bh, bw, bh);

        // Soft architectural window band hints (painterly, not noisy)
        if (b.h > 55) {
          ctx.fillStyle = "rgba(180, 205, 225, 0.35)";
          ctx.fillRect(bx + 4, bridgeY - bh + 12, bw - 8, 2);
          ctx.fillRect(bx + 4, bridgeY - bh + 24, bw - 8, 2);
          ctx.fillStyle = "rgba(95, 122, 144, 0.62)";
        }
      });

      ctx.restore();

      // Atmospheric coastal haze wash over city (keeping nature primary!)
      const cityHaze = ctx.createLinearGradient(0, skylinePullbackY - 90, 0, skylinePullbackY + 20);
      cityHaze.addColorStop(0, "rgba(220, 235, 245, 0)");
      cityHaze.addColorStop(0.7, "rgba(210, 230, 242, 0.45)");
      cityHaze.addColorStop(1, "rgba(210, 230, 242, 0.8)");
      ctx.fillStyle = cityHaze;
      ctx.fillRect(0, skylinePullbackY - 90, width, 120);

      // ==========================================
      // LAYER 6: MIDGROUND LUSH TERRAIN & TREE CANOPIES
      // (Sanjay Gandhi National Park & Powai Hills / Mangrove Greenery)
      // ==========================================
      // Parallax pullback: Midground moves deeper during 4.5s - 6.0s
      const midgroundY = height * (0.62 + p * 0.08);
      const midgroundScale = 1 - p * 0.16;

      ctx.save();
      // Rolling lush green ridge
      const terrainGrad = ctx.createLinearGradient(0, midgroundY - 60, 0, height);
      terrainGrad.addColorStop(0.0, "#3E6A4C"); // Rich tropical vegetation
      terrainGrad.addColorStop(0.3, "#2D543A");
      terrainGrad.addColorStop(0.8, "#1F3D2A");
      terrainGrad.addColorStop(1.0, "#14281B");
      ctx.fillStyle = terrainGrad;

      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, midgroundY + 20);
      // Painterly rolling hill bezier curve
      ctx.bezierCurveTo(
        width * 0.25,
        midgroundY - 45,
        width * 0.45,
        midgroundY + 15,
        width * 0.7,
        midgroundY - 30
      );
      ctx.bezierCurveTo(
        width * 0.85,
        midgroundY - 55,
        width * 0.95,
        midgroundY - 10,
        width,
        midgroundY - 20
      );
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Midground painterly trees (Rain Trees & Banyan umbrellas with harmonic wind sway)
      const midTrees = [
        { x: 0.08, r: 55, h: 75, swayFreq: 1.4 },
        { x: 0.16, r: 42, h: 60, swayFreq: 1.7 },
        { x: 0.28, r: 68, h: 90, swayFreq: 1.2 },
        { x: 0.38, r: 48, h: 65, swayFreq: 1.5 },
        { x: 0.62, r: 60, h: 80, swayFreq: 1.3 },
        { x: 0.75, r: 52, h: 70, swayFreq: 1.6 },
        { x: 0.88, r: 72, h: 95, swayFreq: 1.1 },
        { x: 0.96, r: 45, h: 62, swayFreq: 1.8 },
      ];

      midTrees.forEach((tr) => {
        const tx = width * tr.x;
        // Harmonic wind sway
        const sway = Math.sin(t * tr.swayFreq + tr.x * 10) * (4 + (introTime > 1.5 ? 2.5 : 1));
        const treeBaseY = midgroundY + 15;
        const treeRadius = tr.r * (width / 1440) * midgroundScale;
        const treeH = tr.h * (height / 900) * midgroundScale;

        // Trunk
        ctx.fillStyle = "#251C15";
        ctx.beginPath();
        ctx.moveTo(tx - 4, treeBaseY);
        ctx.lineTo(tx + sway * 0.3 - 2, treeBaseY - treeH);
        ctx.lineTo(tx + sway * 0.3 + 2, treeBaseY - treeH);
        ctx.lineTo(tx + 4, treeBaseY);
        ctx.fill();

        // Foliage Crown (Layered painterly spheres with sunlight rim)
        const crownX = tx + sway;
        const crownY = treeBaseY - treeH;

        // Shadow under-crown
        ctx.fillStyle = "#1E3B27";
        ctx.beginPath();
        ctx.arc(crownX, crownY + 8, treeRadius * 0.9, 0, Math.PI * 2);
        ctx.fill();

        // Main canopy
        ctx.fillStyle = "#336140";
        ctx.beginPath();
        ctx.arc(crownX - 10, crownY, treeRadius * 0.75, 0, Math.PI * 2);
        ctx.arc(crownX + 12, crownY - 2, treeRadius * 0.72, 0, Math.PI * 2);
        ctx.arc(crownX, crownY - 14, treeRadius * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Sunlit highlights (warm golden greens)
        ctx.fillStyle = "#4E845A";
        ctx.beginPath();
        ctx.arc(crownX - 8, crownY - 12, treeRadius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#6EAA7B";
        ctx.beginPath();
        ctx.arc(crownX - 12, crownY - 18, treeRadius * 0.3, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();

      // ==========================================
      // LAYER 7: FOREGROUND DENSE GREENERY & WILD ELEPHANT GRASS
      // (Deepest depth, strong wind movement, painterly blades and palms)
      // ==========================================
      // Foreground responds strongly to pullback (moves downward and scales out, creating 2.5D depth!)
      const fgPullbackY = height * (0.75 + p * 0.18);
      const fgParallaxScale = 1 - p * 0.22;

      ctx.save();
      // Foreground soil and undergrowth gradient
      const fgGrad = ctx.createLinearGradient(0, fgPullbackY, 0, height);
      fgGrad.addColorStop(0.0, "rgba(18, 38, 25, 0.95)");
      fgGrad.addColorStop(0.3, "#112619");
      fgGrad.addColorStop(1.0, "#08140D");
      ctx.fillStyle = fgGrad;

      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, fgPullbackY + 30);
      ctx.bezierCurveTo(
        width * 0.3,
        fgPullbackY - 15,
        width * 0.65,
        fgPullbackY + 35,
        width,
        fgPullbackY - 5
      );
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Dense swaying grass blades across the foreground
      const bladeCount = Math.floor(width / 14);
      for (let b = 0; b < bladeCount; b++) {
        const bx = b * 14 + (b % 3) * 2;
        const bladeHeight = (65 + (b % 7) * 9) * (height / 900) * fgParallaxScale;
        // Organic wind gust equation
        const windGust = Math.sin(t * 2.2 + bx * 0.015) * 16 + Math.cos(t * 1.4 + b) * 8;
        const tipX = bx + windGust;
        const tipY = fgPullbackY + 25 - bladeHeight;

        ctx.beginPath();
        ctx.moveTo(bx - 3, fgPullbackY + 35);
        ctx.quadraticCurveTo(bx + windGust * 0.4, fgPullbackY, tipX, tipY);
        ctx.quadraticCurveTo(bx + windGust * 0.6 + 2, fgPullbackY + 15, bx + 3, fgPullbackY + 35);
        ctx.closePath();

        // Shading: darker forest at bottom, vibrant green at tip with sun rim
        if (b % 4 === 0) {
          ctx.fillStyle = "#3F754D";
        } else if (b % 3 === 0) {
          ctx.fillStyle = "#2D593A";
        } else {
          ctx.fillStyle = "#1E3F27";
        }
        ctx.fill();
      }

      // Feature Foreground Palm Fronds (Framing bottom-left and bottom-right)
      const drawPalmFrond = (
        rootX: number,
        rootY: number,
        angleDeg: number,
        length: number,
        frondSway: number
      ) => {
        ctx.save();
        ctx.translate(rootX, rootY);
        ctx.rotate(((angleDeg + frondSway) * Math.PI) / 180);

        // Frond stem
        ctx.strokeStyle = "#1A3322";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(length * 0.5, -25, length, 0);
        ctx.stroke();

        // Leaflets along stem
        const leaflets = 18;
        for (let l = 2; l < leaflets; l++) {
          const frac = l / leaflets;
          const lx = frac * length;
          const ly = -Math.sin(frac * Math.PI) * 25;
          const lLen = Math.sin(frac * Math.PI) * 38;

          // Upper leaflet
          ctx.strokeStyle = l % 2 === 0 ? "#43784E" : "#2E5837";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(lx, ly);
          ctx.lineTo(lx - 6, ly - lLen);
          ctx.stroke();

          // Lower leaflet
          ctx.beginPath();
          ctx.moveTo(lx, ly);
          ctx.lineTo(lx - 4, ly + lLen * 0.8);
          ctx.stroke();
        }

        ctx.restore();
      };

      // Left palm cluster
      const leftSway = Math.sin(t * 1.8) * 4;
      drawPalmFrond(width * 0.05, height * 0.95, -55, 240 * fgParallaxScale, leftSway);
      drawPalmFrond(width * 0.02, height * 0.92, -35, 280 * fgParallaxScale, leftSway * 1.2);
      drawPalmFrond(width * 0.08, height * 0.98, -75, 210 * fgParallaxScale, leftSway * 0.8);

      // Right palm cluster
      const rightSway = Math.cos(t * 1.6) * 3.5;
      drawPalmFrond(width * 0.94, height * 0.94, -135, 250 * fgParallaxScale, rightSway);
      drawPalmFrond(width * 0.97, height * 0.92, -150, 290 * fgParallaxScale, rightSway * 1.1);

      ctx.restore();

      // ==========================================
      // LAYER 8: ATMOSPHERIC PARTICLES
      // (Spore motes, sea-spray aerosols dancing in light)
      // ==========================================
      ctx.save();
      particlesRef.current.forEach((pt) => {
        // Continuous upward drift & horizontal drift
        pt.x = (pt.x + pt.speedX + t * 0.2) % width;
        pt.y = pt.y - pt.speedY;
        if (pt.y < 0) pt.y = height + 10;
        if (pt.y > height + 10) pt.y = 0;

        const pulseAlpha = pt.opacity * (0.6 + 0.4 * Math.sin(t * pt.pulseSpeed * 60 + pt.phase));
        ctx.fillStyle = `rgba(255, 250, 230, ${pulseAlpha})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * (1 - p * 0.15), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // ==========================================
      // LAYER 9: ENVIRONMENTAL INTELLIGENCE CUES (3.0s - 4.5s)
      // (Wind streamlines & microclimate sensing nodes)
      // ==========================================
      if (introTime >= 2.8 && introTime <= 5.8) {
        // Fade in from 3.0s to 3.5s, linger, fade out as pullback peaks
        let intelAlpha = 0;
        if (introTime < 3.5) {
          intelAlpha = (introTime - 2.8) / 0.7;
        } else if (introTime < 4.8) {
          intelAlpha = 1.0;
        } else {
          intelAlpha = Math.max(0, 1 - (introTime - 4.8) / 1.0);
        }

        ctx.save();
        ctx.globalAlpha = intelAlpha * 0.75;

        // Flowing Wind Streamlines tracing Mumbai's Arabian sea-breeze
        streamLinesRef.current.forEach((st, idx) => {
          const streamY = height * st.y;
          const headX = ((t * 180 * st.speed + st.offset) % (width + st.length + 300)) - 100;
          const streamGrad = ctx.createLinearGradient(headX - st.length, streamY, headX, streamY);
          streamGrad.addColorStop(0, "rgba(52, 211, 153, 0)");
          streamGrad.addColorStop(0.7, "rgba(52, 211, 153, 0.45)");
          streamGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.85)");

          ctx.strokeStyle = streamGrad;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(headX - st.length, streamY + Math.sin((headX - st.length) * 0.01 + idx) * 12);
          ctx.bezierCurveTo(
            headX - st.length * 0.5,
            streamY + Math.sin(headX * 0.008 + idx) * 18,
            headX - st.length * 0.2,
            streamY - Math.sin(headX * 0.01) * 14,
            headX,
            streamY
          );
          ctx.stroke();

          // Streamline tip particle
          ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
          ctx.beginPath();
          ctx.arc(headX, streamY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        });

        // Delicate sensing node pulse points across key Mumbai ecological anchors
        const nodePositions = [
          { name: "Sanjay Gandhi NP", x: width * 0.28, y: height * 0.62 },
          { name: "Bandra Coast", x: width * 0.24, y: height * 0.53 },
          { name: "Mahim Bay", x: width * 0.52, y: height * 0.55 },
          { name: "Eastern Mangroves", x: width * 0.76, y: height * 0.65 },
        ];

        nodePositions.forEach((node, nIdx) => {
          const pulse = (t * 2 + nIdx * 1.2) % 3;
          const pulseR = pulse * 18;
          const pulseOp = Math.max(0, 1 - pulse / 3);

          // Pulse ring
          ctx.strokeStyle = `rgba(16, 185, 129, ${pulseOp * 0.8})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(node.x, node.y, pulseR, 0, Math.PI * 2);
          ctx.stroke();

          // Center core
          ctx.fillStyle = "#10B981";
          ctx.beginPath();
          ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.restore();
      }

      // Soft vignette / cinematic letterbox atmosphere
      const vignette = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        width * 0.35,
        width * 0.5,
        height * 0.5,
        width * 0.75
      );
      vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
      vignette.addColorStop(1, "rgba(10, 24, 18, 0.25)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [currentTime, pullbackProgress, isAmbientMode]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-0"
      style={{ display: "block" }}
    />
  );
};
