"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, Activity, Leaf, ShieldAlert, Database, Layers } from "lucide-react";
import { DocumentationModal } from "./DocumentationModal";

export interface LandingPageProps {
  onLaunch: () => void;
  onShowAboutUs: () => void;
}

export function LandingPage({ onLaunch, onShowAboutUs }: LandingPageProps) {
  const globeRef = useRef<HTMLDivElement | null>(null);
  const [docModalOpen, setDocModalOpen] = useState(false);

  useEffect(() => {
    if (!globeRef.current) return;

    let world: any = null;
    let cleanup = false;
    let adjustCamera: (() => void) | null = null;
    let lightingTimeout: any = null;

    const initGlobe = async () => {
      try {
        const GlobeModule = (await import("globe.gl")).default;
        const THREE = await import("three");

        if (cleanup || !globeRef.current) return;

        // Initialize the 3D globe (Protected implementation)
        world = (GlobeModule as any)()(globeRef.current)
          .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
          .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
          .backgroundColor("rgba(0,0,0,0)")
          .showAtmosphere(true)
          .atmosphereColor("#10b981")
          .atmosphereAltitude(0.15);

      // Controls
      world.controls().autoRotate = true;
      world.controls().autoRotateSpeed = 0.5;
      world.controls().enableZoom = false;

      // Position camera for a cinematic view
      world.pointOfView({ altitude: 2.5 });

      // Responsive camera position
      adjustCamera = () => {
        if (!world) return;
        if (window.innerWidth < 768) {
          world.pointOfView({ altitude: 3.0 });
          if (globeRef.current) {
            globeRef.current.style.transform = "none";
          }
        } else {
          world.pointOfView({ altitude: 2.5 });
          if (globeRef.current) {
            globeRef.current.style.transform = "translateX(20vw)";
          }
        }
      };

      window.addEventListener("resize", adjustCamera);
      adjustCamera();

      // Add clouds sphere
      const CLOUDS_IMG_URL = "https://raw.githubusercontent.com/turban/webgl-earth/master/images/clouds.png";
      const CLOUDS_ALT = 0.004;
      const CLOUDS_ROTATION_SPEED = -0.006;

      new THREE.TextureLoader().load(CLOUDS_IMG_URL, (cloudsTexture) => {
        if (cleanup || !world) return;
        const clouds = new THREE.Mesh(
          new THREE.SphereGeometry(world.getGlobeRadius() * (1 + CLOUDS_ALT), 75, 75),
          new THREE.MeshPhongMaterial({ map: cloudsTexture, transparent: true, opacity: 0.8 })
        );
        world.scene().add(clouds);

        (function rotateClouds() {
          if (cleanup) return;
          clouds.rotation.y += (CLOUDS_ROTATION_SPEED * Math.PI) / 180;
          requestAnimationFrame(rotateClouds);
        })();
      });

      // Add custom lighting to make the globe look more premium and bright
      lightingTimeout = setTimeout(() => {
        if (cleanup || !world) return;
        const scene = world.scene();

        const ambientLight = scene.children.find((obj: any) => obj.type === "AmbientLight");
        const directionalLight = scene.children.find((obj: any) => obj.type === "DirectionalLight");

        if (ambientLight) {
          ambientLight.intensity = 2.5;
        } else {
          scene.add(new THREE.AmbientLight(0xffffff, 2.5));
        }

        if (directionalLight) {
          directionalLight.intensity = 3.0;
          directionalLight.position.set(1, 1, 1);
        } else {
          const dirLight = new THREE.DirectionalLight(0xffffff, 3.0);
          dirLight.position.set(1, 1, 1);
          scene.add(dirLight);
        }

        const rimLight = new THREE.DirectionalLight(0x10b981, 2.5);
        rimLight.position.set(-1, 0, -1);
        scene.add(rimLight);

        const blueLight = new THREE.DirectionalLight(0x3b82f6, 2.0);
        blueLight.position.set(1, 1, -1);
        scene.add(blueLight);
      }, 100);

      } catch (e) {
        console.error("Error initializing globe:", e);
      }
    };

    initGlobe();

    return () => {
      cleanup = true;
      if (lightingTimeout) clearTimeout(lightingTimeout);
      if (adjustCamera) window.removeEventListener("resize", adjustCamera);
      if (globeRef.current) {
        globeRef.current.innerHTML = "";
      }
    };
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-[#030712] font-sans text-white selection:bg-emerald-500/30 overflow-x-hidden">
      {/* ========================================================= */}
      {/* HERO SECTION — EXACT FRIEND VISUAL MATCH                  */}
      {/* ========================================================= */}
      <div className="relative w-full h-screen overflow-hidden">
        {/* 3D Globe Background Canvas */}
        <div
          ref={globeRef}
          className="absolute top-0 left-0 w-[100vw] h-[100vh] z-0 cursor-grab active:cursor-grabbing"
        />

        {/* Gradient Overlay for text readability */}
        <div
          className="absolute top-0 left-0 w-[100vw] h-[100vh] z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, rgba(3,7,18,0.95) 0%, rgba(3,7,18,0.7) 40%, rgba(3,7,18,0) 70%)",
          }}
        />

        {/* Header Navigation */}
        <header className="absolute top-0 left-0 w-full z-30 p-6 md:p-12 flex justify-between items-center pointer-events-auto animate-[fadeInUp_0.8s_ease-out_forwards]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-900"
              >
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight">EcoPulse</span>
              <span className="hidden sm:inline text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80 font-semibold">
                Mumbai
              </span>
            </div>
          </div>

          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <button
              onClick={() => scrollToSection("platform")}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Platform
            </button>
            <button
              onClick={() => scrollToSection("sources")}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Data Sources
            </button>
            <button
              onClick={() => setDocModalOpen(true)}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Documentation
            </button>
            <button
              onClick={onShowAboutUs}
              className="hover:text-emerald-400 transition-colors cursor-pointer text-left"
            >
              About Us
            </button>
          </nav>

          <button
            onClick={onLaunch}
            className="pointer-events-auto bg-[rgba(17,24,39,0.6)] backdrop-blur-md border border-white/10 px-6 py-2.5 rounded-full text-sm font-medium hover:bg-white/10 transition-colors hover:border-white/40 cursor-pointer"
          >
            Launch App
          </button>
        </header>

        {/* Hero Main Content */}
        <div className="absolute top-0 left-0 w-full h-full z-20 flex flex-col pointer-events-none p-6 md:p-12 lg:p-24 justify-center">
          <main className="max-w-3xl mt-20 md:mt-10 pointer-events-auto">
            <div
              className="inline-block bg-[rgba(17,24,39,0.6)] backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-medium text-emerald-400 mb-6 uppercase tracking-wider border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)] opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]"
              style={{ animationDelay: "100ms" }}
            >
              Mumbai Metropolitan Environmental Intelligence
            </div>

            <h1
              className="text-5xl md:text-7xl font-extrabold leading-[1.1] mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-500 opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]"
              style={{ animationDelay: "200ms" }}
            >
              Monitor Earth&apos;s <br />
              Vital Signs
            </h1>

            <p
              className="text-lg md:text-xl text-gray-400 mb-10 max-w-xl leading-relaxed opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]"
              style={{ animationDelay: "300ms" }}
            >
              Real-time air quality, microclimate, and greenery analysis powered by satellite data and direct observations across Mumbai.
            </p>

            <div
              className="flex flex-wrap gap-4 opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]"
              style={{ animationDelay: "400ms" }}
            >
              <button
                onClick={onLaunch}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-full font-medium transition-all transform hover:scale-105 hover:-translate-y-1 shadow-[0_10px_20px_rgba(16,185,129,0.3)] flex items-center gap-2 cursor-pointer"
              >
                <span>Explore Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setDocModalOpen(true)}
                className="bg-[rgba(17,24,39,0.6)] backdrop-blur-md border border-white/10 hover:bg-white/10 text-white px-8 py-4 rounded-full font-medium transition-colors flex items-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>View Documentation</span>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div
              className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-8 border-t border-white/10 pt-8 opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]"
              style={{ animationDelay: "400ms" }}
            >
              <div>
                <div className="text-3xl font-bold text-white mb-1">14 Locations</div>
                <div className="text-sm text-gray-500">Continuous MMR Coverage</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-1">10m Res</div>
                <div className="text-sm text-gray-500">Sentinel-2 Multispectral</div>
              </div>
              <div className="hidden md:block">
                <div className="text-3xl font-bold text-white mb-1">72 Hours</div>
                <div className="text-sm text-gray-500">Diurnal Predictive Forecast</div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PLATFORM / CORE CAPABILITIES SECTION                      */}
      {/* ========================================================= */}
      <section id="platform" className="relative z-20 py-24 px-6 md:px-12 lg:px-24 bg-[#020907] border-t border-emerald-950/80">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-mono uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5" />
                <span>Core Computational Engines</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Three Synchronized Environmental Domains
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md">
              Engineered with zero-fabrication mathematical pipelines. Every calculation provides traceable sensor lineage and CPCB/OECD standards compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 Card */}
            <div className="p-6 rounded-2xl bg-[#051712]/90 border border-emerald-900/60 hover:border-emerald-500/50 transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Air Quality & Microclimate</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time CPCB NAQI sub-indices for 6 monitored pollutants (<span className="text-slate-300">PM2.5, PM10, NO2, SO2, CO, O3</span>) coupled with hyper-local ambient temperature, humidity, wind velocity, and atmospheric pressure.
                </p>
              </div>
              <div className="pt-3 border-t border-emerald-950/80 flex items-center justify-between text-xs text-emerald-400 font-mono">
                <span>Provenance: MODELLED_ANALYSIS</span>
                <button onClick={onLaunch} className="hover:underline flex items-center gap-1 font-sans font-bold">
                  <span>Inspect</span> →
                </button>
              </div>
            </div>

            {/* Feature 2 Card */}
            <div className="p-6 rounded-2xl bg-[#051712]/90 border border-emerald-900/60 hover:border-emerald-500/50 transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-lime-400">
                  <Leaf className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Greenery & Urban Heat</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Copernicus Sentinel-2 MSI 10m Normalized Difference Vegetation Index (NDVI) and Landsat-9 Thermal Infrared Sensor (TIRS) surface heat signatures mapping urban heat island differentials.
                </p>
              </div>
              <div className="pt-3 border-t border-emerald-950/80 flex items-center justify-between text-xs text-lime-400 font-mono">
                <span>Provenance: SATELLITE_BASELINE</span>
                <button onClick={onLaunch} className="hover:underline flex items-center gap-1 font-sans font-bold text-emerald-400">
                  <span>Inspect</span> →
                </button>
              </div>
            </div>

            {/* Feature 3 Card */}
            <div className="p-6 rounded-2xl bg-[#051712]/90 border border-emerald-900/60 hover:border-emerald-500/50 transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-amber-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Risk & 72h Forecast</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Explainable multi-factor environmental risk scoring (0-100) based on weighted physical stressors paired with forward 72-hour hourly diurnal atmospheric predictive trajectories.
                </p>
              </div>
              <div className="pt-3 border-t border-emerald-950/80 flex items-center justify-between text-xs text-amber-400 font-mono">
                <span>Provenance: FORECAST</span>
                <button onClick={onLaunch} className="hover:underline flex items-center gap-1 font-sans font-bold text-emerald-400">
                  <span>Inspect</span> →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* DATA SOURCES & PROVENANCE SECTION                         */}
      {/* ========================================================= */}
      <section id="sources" className="relative z-20 py-24 px-6 md:px-12 lg:px-24 bg-[#030712] border-t border-emerald-950/80">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-xs font-mono uppercase tracking-wider">
              <Database className="w-3.5 h-3.5" />
              <span>Telemetry & Sensor Lineage</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Rigorous Data Provenance Taxonomy
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              EcoPulse Mumbai strictly tags every environmental metric with its origin tier to maintain transparent scientific auditability.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#051712]/80 border border-emerald-900/60 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono text-[11px] font-semibold">
                  DIRECT_OBSERVATION
                </span>
              </div>
              <h4 className="font-bold text-white text-sm">Ground CAAQMS Stations</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Direct continuous measurements streamed from MPCB & SAFAR monitoring stations across Mumbai.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#051712]/80 border border-blue-900/60 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700 font-mono text-[11px] font-semibold">
                  MODELLED_ANALYSIS
                </span>
              </div>
              <h4 className="font-bold text-white text-sm">ECMWF / CAMS Analysis</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Atmospheric reanalysis and chemical transport models assimilated with local meteorology.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#051712]/80 border border-purple-900/60 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700 font-mono text-[11px] font-semibold">
                  SATELLITE_BASELINE
                </span>
              </div>
              <h4 className="font-bold text-white text-sm">Sentinel-2 & Landsat</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Copernicus Sentinel-2 10m multispectral vegetation and Landsat-9 TIRS thermal survey baselines.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#051712]/80 border border-amber-900/60 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 font-mono text-[11px] font-semibold">
                  FORECAST
                </span>
              </div>
              <h4 className="font-bold text-white text-sm">72h Numerical Prediction</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Forward atmospheric trajectory modeling combining Open-Meteo & ECMWF IFS predictions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FOOTER                                                    */}
      {/* ========================================================= */}
      <footer className="relative z-20 py-8 px-6 md:px-12 border-t border-emerald-950/80 bg-[#020705] text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-400" />
            <span className="text-white font-semibold">EcoPulse Mumbai</span>
            <span>• Urban Environmental Intelligence</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => setDocModalOpen(true)} className="hover:text-emerald-400 transition-colors cursor-pointer">
              Documentation
            </button>
            <button onClick={onShowAboutUs} className="hover:text-emerald-400 transition-colors cursor-pointer">
              About Us
            </button>
            <button onClick={onLaunch} className="text-emerald-400 font-bold hover:underline cursor-pointer">
              Launch App →
            </button>
          </div>
        </div>
      </footer>

      {/* Documentation Modal */}
      <DocumentationModal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        onLaunchDashboard={onLaunch}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `,
        }}
      />
    </div>
  );
}

export default LandingPage;
