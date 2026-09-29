import React, { useRef, useEffect } from 'react';

export default function AboutUs({ onBack }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    const img = new Image();
    img.crossOrigin = "Anonymous";
    // Using the local team photo uploaded by the user.
    img.src = '/team.jpg/WhatsApp Image 2026-09-29 at 12.54.12 AM.jpeg'; 

    let animationFrameId;
    let time = 0;
    const offscreen = document.createElement('canvas');
    const octx = offscreen.getContext('2d', { willReadFrequently: true });

    // 8x8 Bayer Matrix for smooth ordered dither
    const bayer = [
      [ 0, 32,  8, 40,  2, 34, 10, 42],
      [48, 16, 56, 24, 50, 18, 58, 26],
      [12, 44,  4, 36, 14, 46,  6, 38],
      [60, 28, 52, 20, 62, 30, 54, 22],
      [ 3, 35, 11, 43,  1, 33,  9, 41],
      [51, 19, 59, 27, 49, 17, 57, 25],
      [15, 47,  7, 39, 13, 45,  5, 37],
      [63, 31, 55, 23, 61, 29, 53, 21]
    ];

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      offscreen.width = rect.width;
      offscreen.height = rect.height;
    };

    window.addEventListener('resize', resize);

    img.onload = () => {
      resize();

      const render = () => {
        time += 1; // animSpeed
        
        // 1. Draw source photo into offscreen canvas
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;
        
        octx.clearRect(0, 0, canvas.width, canvas.height);
        octx.drawImage(img, x, y, w, h);
        
        const imgData = octx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imgData.data;

        // Clear main canvas (bgMode: none -> solid color or transparent. We'll use a dark background)
        ctx.fillStyle = '#050a10';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Configuration for the 'lite texture' fine dither look
        const cellSize = 3; // Reduced for finer detail
        const contrast = 1.58; // 158% contrast multiplier
        const brightness = 0;
        const animIntensity = 60; // 0-100
        const animSpeed = 0.05;

        // 2 & 3. Process grid
        for (let cy = 0; cy < canvas.height; cy += cellSize) {
          for (let cx = 0; cx < canvas.width; cx += cellSize) {
            
            // Sample center of cell
            const pX = Math.floor(cx + cellSize / 2);
            const pY = Math.floor(cy + cellSize / 2);
            
            if (pX >= canvas.width || pY >= canvas.height) continue;
            
            const i = (pY * canvas.width + pX) * 4;
            let r = pixels[i];
            let g = pixels[i+1];
            let b = pixels[i+2];

            // 4. Color adjustments (Contrast & Brightness)
            r = ((r / 255 - 0.5) * contrast + 0.5 + brightness / 255) * 255;
            g = ((g / 255 - 0.5) * contrast + 0.5 + brightness / 255) * 255;
            b = ((b / 255 - 0.5) * contrast + 0.5 + brightness / 255) * 255;
            
            r = Math.min(255, Math.max(0, r));
            g = Math.min(255, Math.max(0, g));
            b = Math.min(255, Math.max(0, b));

            let luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // 8. Animation - Shimmer style
            // Shimmer applies a moving noise/wave across the image
            const shimmer = Math.sin(time * animSpeed + (cx * 0.01) + (cy * 0.02)) * animIntensity;
            luminance = Math.min(255, Math.max(0, luminance + shimmer));

            // Setup cell color
            ctx.fillStyle = `rgb(${r},${g},${b})`;

            // renderMode: "dither"
            // For the true 21st.dev 'dither' effect, the whole cell is rendered
            // if its luminance beats the threshold in the bayer matrix.
            const gridX = Math.floor(cx / cellSize);
            const gridY = Math.floor(cy / cellSize);
            const threshold = (bayer[gridY % 8][gridX % 8] / 64) * 255;

            // Turn on the entire cell block if luminance is above the bayer threshold
            if (luminance > threshold) {
              ctx.fillRect(cx, cy, cellSize, cellSize);
            }
          }
        }
        
        animationFrameId = requestAnimationFrame(render);
      };
      
      render();
    };

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-50 bg-[#030712] overflow-hidden flex flex-col animate-[fadeInUp_0.5s_ease-out_forwards]">
      <div className="absolute top-0 left-0 w-full p-6 md:p-12 flex justify-between items-center z-[60]">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-white hover:text-emerald-400 bg-[rgba(17,24,39,0.6)] backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 hover:border-emerald-500/50 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back to Home
        </button>
        <div className="text-emerald-400 font-semibold tracking-wider text-sm uppercase bg-[rgba(17,24,39,0.6)] backdrop-blur-md px-5 py-2.5 rounded-full border border-emerald-500/30">
          The Team
        </div>
      </div>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
