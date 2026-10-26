/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp, Compass, Play, Pause, Sun, Moon, Sparkles, ArrowRight, Calendar } from 'lucide-react';
import { SCENES, SUITE_OPTIONS } from './data/scenesData';
import { ResortCanvas, LightingPreset } from './components/ResortCanvas';
import { BookingModal } from './components/BookingModal';

export default function App() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('sunrise');
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [isAutoCruising, setIsAutoCruising] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSuiteId, setSelectedSuiteId] = useState(SUITE_OPTIONS[0].id);
  const [quickCheckIn, setQuickCheckIn] = useState('2026-11-12');
  const [quickCheckOut, setQuickCheckOut] = useState('2026-11-16');
  const [inspectedLandmark, setInspectedLandmark] = useState<{
    title: string;
    subtitle: string;
  } | null>(null);

  const autoCruiseRef = useRef(isAutoCruising);
  useEffect(() => {
    autoCruiseRef.current = isAutoCruising;
  }, [isAutoCruising]);

  // Synchronize window scroll position with normalized progress (0..1)
  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const current = window.scrollY;
      const normalized = Math.min(1, Math.max(0, current / maxScroll));
      setScrollProgress(normalized);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcut 'H' to toggle bottom control dock, Arrow keys to navigate scenes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isBookingModalOpen) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'h' || e.key === 'H') {
        setIsDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBookingModalOpen]);

  // Smoothly scroll window to a specific normalized progress (0..1)
  const scrollToProgress = useCallback((targetProgress: number) => {
    const clamped = Math.min(1, Math.max(0, targetProgress));
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({
      top: clamped * maxScroll,
      behavior: 'smooth',
    });
  }, []);

  const jumpToScene = useCallback(
    (sceneIndex: number) => {
      setIsAutoCruising(false);
      const target = sceneIndex / (SCENES.length - 1);
      scrollToProgress(target);
    },
    [scrollToProgress]
  );

  // Auto-Cruise continuous camera flight mode
  useEffect(() => {
    if (!isAutoCruising) return;
    let rafId = 0;
    let lastTime = performance.now();

    const stepCruise = (now: number) => {
      if (!autoCruiseRef.current) return;
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const nextY = window.scrollY + maxScroll * 0.038 * dt;
      if (nextY >= maxScroll) {
        window.scrollTo(0, maxScroll);
        setIsAutoCruising(false);
        return;
      }
      window.scrollTo(0, nextY);
      rafId = requestAnimationFrame(stepCruise);
    };

    rafId = requestAnimationFrame(stepCruise);
    return () => cancelAnimationFrame(rafId);
  }, [isAutoCruising]);

  // Determine active scene index (0..5) and continuous scene float index
  const floatIndex = scrollProgress * (SCENES.length - 1);
  const activeSceneIndex = Math.min(SCENES.length - 1, Math.max(0, Math.round(floatIndex)));
  const activeScene = SCENES[activeSceneIndex];

  // Calculate smooth fade & parallax transform for the current scene's editorial card
  const distanceFromSceneCenter = floatIndex - activeSceneIndex;
  const cardOpacity = Math.max(0, 1 - Math.abs(distanceFromSceneCenter) * 2.15);
  const cardTranslateY = distanceFromSceneCenter * -42;

  const openReservationWithSuite = (suiteId?: string) => {
    if (suiteId) setSelectedSuiteId(suiteId);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="relative min-h-[660vh] bg-[#0B1914] text-[#F7F3E8] select-none">
      {/* 1. Continuous 3D WebGL Resort World */}
      <ResortCanvas
        scrollProgress={scrollProgress}
        lightingPreset={lightingPreset}
        onInspectLandmark={setInspectedLandmark}
      />

      {/* 2. Subtle Procedural 35mm Film Grain & Measured Vignette Scrim */}
      <svg
        className="pointer-events-none fixed inset-0 z-20 w-full h-full opacity-[0.045]"
        aria-hidden="true"
      >
        <filter id="villa-aurelia-film-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.82"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#villa-aurelia-film-grain)" />
      </svg>

      <div
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          background:
            'radial-gradient(circle at 55% 45%, rgba(11,25,20,0.05) 0%, rgba(8,19,15,0.48) 70%, rgba(6,14,11,0.84) 100%)',
        }}
      />

      {/* 3. Top Navigation Bar (Strict 3-Zone Top Bar Contract) */}
      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between gap-8 px-6 sm:px-10 py-4 bg-[#0B1914]/90 border-b border-[#C8A45D]/25">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#scene-0"
          onClick={(e) => {
            e.preventDefault();
            jumpToScene(0);
          }}
          className="font-display text-xl sm:text-2xl tracking-wide text-[#F7F3E8] hover:text-[#C8A45D] transition-colors whitespace-nowrap shrink-0"
        >
          Villa Aurelia
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav aria-label="Resort chapters" className="hidden md:flex items-center gap-7 text-xs tracking-[0.16em] text-[#F7F3E8]/75">
          {SCENES.slice(0, 5).map((scene) => {
            const isActive = activeSceneIndex === scene.id;
            return (
              <a
                key={scene.id}
                href={`#scene-${scene.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  jumpToScene(scene.id);
                }}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b ${
                  isActive
                    ? 'text-[#C8A45D] border-[#C8A45D]'
                    : 'border-transparent hover:text-[#F7F3E8]'
                }`}
              >
                {scene.number}. {scene.navLabel}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => {
              if (activeSceneIndex === 5) {
                openReservationWithSuite();
              } else {
                jumpToScene(5);
              }
            }}
            className="px-5 py-2.5 text-xs font-medium tracking-[0.14em] bg-[#C8A45D] text-[#0B1914] hover:bg-[#DFBE78] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Reserve Your Stay
          </button>
        </div>
      </header>

      {/* 4. Thin Left & Right Editorial Side Captions & Scene Numbers */}
      <aside
        aria-label="Scene index and elevation metadata"
        className="pointer-events-none fixed inset-y-0 left-6 z-20 hidden xl:flex flex-col justify-between py-24 text-[#F7F3E8]/65"
      >
        <div className="flex flex-col items-start gap-2">
          <span className="font-mono-tabular text-xs tracking-[0.25em] text-[#C8A45D]">
            {activeScene.number} / 06
          </span>
          <div className="w-px h-16 bg-[#C8A45D]/35 ml-2" />
          <span
            className="text-[11px] tracking-[0.2em] text-[#F7F3E8]/70 transition-transform duration-300"
            style={{
              writingMode: 'vertical-rl',
              transform: `rotate(180deg) translateY(${distanceFromSceneCenter * 14}px)`,
            }}
          >
            {activeScene.sideCaptionLeft}
          </span>
        </div>

        <div className="flex flex-col items-start gap-1.5 font-mono-tabular text-[11px] text-[#F7F3E8]/55">
          <span>{activeScene.elevationMetric}</span>
          <span className="text-[#C8A45D]/80">{activeScene.coordinates}</span>
        </div>
      </aside>

      <aside
        aria-label="Architectural specifications"
        className="pointer-events-none fixed inset-y-0 right-6 z-20 hidden xl:flex flex-col justify-between items-end py-24 text-[#F7F3E8]/65"
      >
        <div className="flex flex-col items-end gap-2">
          <span className="font-mono-tabular text-xs tracking-[0.2em] text-[#C8A45D]">
            DEPTH {Math.round(scrollProgress * 100)}%
          </span>
          <div className="w-px h-24 bg-[#C8A45D]/25 mr-2 relative overflow-hidden">
            <div
              className="w-full bg-[#C8A45D] transition-transform duration-150 origin-top"
              style={{
                height: '100%',
                transform: `scaleY(${Math.max(0.05, scrollProgress)})`,
              }}
            />
          </div>
          <span
            className="text-[11px] tracking-[0.2em] text-[#F7F3E8]/70 transition-transform duration-300"
            style={{
              writingMode: 'vertical-rl',
              transform: `translateY(${distanceFromSceneCenter * -14}px)`,
            }}
          >
            {activeScene.sideCaptionRight}
          </span>
        </div>

        {inspectedLandmark ? (
          <div className="bg-[#0B1914]/95 border border-[#C8A45D]/50 px-3.5 py-2 text-right max-w-xs">
            <p className="font-display text-xs text-[#C8A45D]">{inspectedLandmark.title}</p>
            <p className="text-[11px] text-[#F7F3E8]/75">{inspectedLandmark.subtitle}</p>
          </div>
        ) : (
          <div className="text-right text-[11px] text-[#F7F3E8]/55">
            <span>Scroll to Fly Through Estate</span>
          </div>
        )}
      </aside>

      {/* 5. Main Editorial Scene Narrative Overlay (Unobstructed 3D Center) */}
      <main className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between pt-20 pb-28 px-6 sm:px-12 xl:px-24">
        {/* Top-left subtle chapter indicator on smaller screens & architectural note */}
        <div className="flex items-center justify-between">
          <div
            className="inline-flex items-center gap-3 text-xs tracking-[0.18em] text-[#C8A45D]"
            style={{
              opacity: cardOpacity,
              transform: `translateY(${cardTranslateY * 0.4}px)`,
            }}
          >
            <span className="font-mono-tabular font-medium">SCENE {activeScene.number}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#F7F3E8]/85">{activeScene.kicker}</span>
          </div>
        </div>

        {/* Lower Editorial Frame or Scene 06 Booking Experience */}
        <div
          className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8"
          style={{
            opacity: cardOpacity,
            transform: `translateY(${cardTranslateY}px)`,
          }}
        >
          {activeSceneIndex < 5 ? (
            <>
              {/* Scenes 01–05: Compact Luxury Editorial Story Block on Bottom-Left */}
              <div className="pointer-events-auto max-w-xl bg-[#0B1914]/88 border border-[#C8A45D]/35 p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center gap-2 text-xs text-[#C8A45D] mb-2">
                  <span>Chapter {activeScene.number}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeScene.subtitle}</span>
                </div>

                <h1 className="font-display text-2xl sm:text-4xl font-normal text-[#F7F3E8] tracking-tight leading-[1.15] mb-3">
                  {activeScene.title}
                </h1>

                <p className="text-sm sm:text-base text-[#F7F3E8]/80 leading-relaxed mb-5">
                  {activeScene.description}
                </p>

                <div className="pt-4 border-t border-[#C8A45D]/20 flex flex-wrap items-center justify-between gap-4">
                  <span className="text-xs text-[#F7F3E8]/60">{activeScene.architecturalNote}</span>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => jumpToScene(activeSceneIndex + 1)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#C8A45D] border border-[#C8A45D]/45 hover:bg-[#C8A45D] hover:text-[#0B1914] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>Proceed to {SCENES[activeSceneIndex + 1].navLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right-hand quick jump to reservation or next chapter */}
              <div className="pointer-events-auto hidden sm:flex flex-col items-end gap-2 bg-[#0B1914]/85 border border-[#C8A45D]/25 px-5 py-4">
                <span className="text-[11px] tracking-[0.18em] text-[#C8A45D]">
                  NEXT VISTA · 0{activeSceneIndex + 2}
                </span>
                <p className="font-display text-lg text-[#F7F3E8]">
                  {SCENES[activeSceneIndex + 1].title}
                </p>
                <button
                  type="button"
                  onClick={() => openReservationWithSuite()}
                  className="mt-1 text-xs text-[#C8A45D] hover:text-[#DFBE78] underline underline-offset-4 cursor-pointer whitespace-nowrap shrink-0"
                >
                  Direct Concierge Reservation →
                </button>
              </div>
            </>
          ) : (
            /* Scene 06: The Sanctuary Awaits — Interactive Booking Section with "Reserve Your Stay" Button */
            <div className="pointer-events-auto w-full bg-[#0B1914]/92 border border-[#C8A45D]/45 p-6 sm:p-8 shadow-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Left Column: Editorial Invitation */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#C8A45D] mb-2">
                      <span>Chapter 06</span>
                      <span aria-hidden="true">·</span>
                      <span>Private Cliffside Belvedere</span>
                    </div>
                    <h1 className="font-display text-3xl sm:text-4xl font-normal text-[#F7F3E8] leading-tight mb-3">
                      {activeScene.title}
                    </h1>
                    <p className="text-sm text-[#F7F3E8]/80 leading-relaxed">
                      {activeScene.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#C8A45D]/20 space-y-2 text-xs text-[#F7F3E8]/70">
                    <div className="flex items-center justify-between">
                      <span>Complimentary Transfer</span>
                      <span className="text-[#C8A45D]">Riva Aquarama or Heliport Arrival</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Estate Hospitality</span>
                      <span className="text-[#C8A45D]">24-Hour Private Maggiordomo</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Suite Selector & Reserve Your Stay Action */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-5 lg:border-l lg:border-[#C8A45D]/25 lg:pl-8">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {SUITE_OPTIONS.map((suite) => {
                      const isSelected = suite.id === selectedSuiteId;
                      return (
                        <button
                          key={suite.id}
                          type="button"
                          onClick={() => setSelectedSuiteId(suite.id)}
                          className={`text-left p-3.5 border transition-colors cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#142D23] border-[#C8A45D]'
                              : 'bg-[#0E2019] border-[#C8A45D]/25 hover:border-[#C8A45D]/60'
                          }`}
                        >
                          <div>
                            <p className="font-display text-sm text-[#F7F3E8] mb-1">{suite.name}</p>
                            <p className="text-[11px] text-[#F7F3E8]/65">{suite.size} · {suite.view}</p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-[#C8A45D]/20 flex items-baseline justify-between">
                            <span className="text-[10px] text-[#F7F3E8]/55">Per Night</span>
                            <span className="font-mono-tabular text-xs font-medium text-[#C8A45D]">
                              €{suite.nightlyRate.toLocaleString()}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick Dates + Primary "Reserve Your Stay" CTA */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-1">
                    <div>
                      <label className="block text-[11px] text-[#F7F3E8]/70 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#C8A45D]" />
                        <span>Check-In</span>
                      </label>
                      <input
                        type="date"
                        value={quickCheckIn}
                        onChange={(e) => setQuickCheckIn(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0E2019] border border-[#C8A45D]/35 text-xs text-[#F7F3E8] font-mono-tabular focus:outline-none focus:border-[#C8A45D]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#F7F3E8]/70 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#C8A45D]" />
                        <span>Check-Out</span>
                      </label>
                      <input
                        type="date"
                        value={quickCheckOut}
                        onChange={(e) => setQuickCheckOut(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0E2019] border border-[#C8A45D]/35 text-xs text-[#F7F3E8] font-mono-tabular focus:outline-none focus:border-[#C8A45D]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => openReservationWithSuite(selectedSuiteId)}
                      className="w-full py-2.5 px-5 text-xs font-semibold tracking-[0.14em] bg-[#C8A45D] text-[#0B1914] hover:bg-[#DFBE78] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Reserve Your Stay
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 6. Unified Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
      <div
        className="fixed left-1/2 z-30 -translate-x-1/2 transition-transform duration-300"
        style={{
          bottom: '16px',
          width: 'min(920px, 94vw)',
          transform: `translateX(-50%) translateY(${isDockCollapsed ? 'calc(100% - 28px)' : '0px'})`,
        }}
      >
        {/* Collapse / Expand Toggle Handle */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setIsDockCollapsed((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-4 py-1 text-[11px] tracking-[0.16em] bg-[#0B1914] text-[#C8A45D] border border-b-0 border-[#C8A45D]/35 hover:text-[#F7F3E8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            aria-expanded={!isDockCollapsed}
          >
            {isDockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Show Controls (H)</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Hide Controls (H)</span>
              </>
            )}
          </button>
        </div>

        {/* Main Dock Body */}
        <div className="bg-[#0B1914]/95 border border-[#C8A45D]/40 px-4 sm:px-6 py-3 shadow-2xl flex flex-wrap items-center justify-between gap-4">
          {/* Scene Chapter Pills + Scrubber */}
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <Compass className="w-4 h-4 text-[#C8A45D] shrink-0 hidden sm:block" />
            <div className="flex items-center gap-1 overflow-x-auto">
              {SCENES.map((scene) => {
                const active = activeSceneIndex === scene.id;
                return (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={() => jumpToScene(scene.id)}
                    className={`px-2.5 py-1 text-xs font-mono-tabular transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#C8A45D] text-[#0B1914] font-semibold'
                        : 'text-[#F7F3E8]/70 hover:text-[#C8A45D]'
                    }`}
                    title={`${scene.number}. ${scene.title}`}
                  >
                    {scene.number} · {scene.navLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Continuous Camera Zoom Slider */}
          <div className="hidden lg:flex items-center gap-2.5 w-44">
            <span className="text-[10px] tracking-widest text-[#F7F3E8]/60 whitespace-nowrap">
              CAMERA
            </span>
            <input
              type="range"
              min={0}
              max={1000}
              value={Math.round(scrollProgress * 1000)}
              onChange={(e) => {
                setIsAutoCruising(false);
                const val = Number(e.target.value) / 1000;
                const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
                window.scrollTo(0, val * maxScroll);
              }}
              aria-label="Camera dolly zoom progress"
              className="w-full accent-[#C8A45D] cursor-pointer h-1 bg-[#163026]"
            />
          </div>

          {/* Atmosphere Presets & Auto-Cruise Flight Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-[#0E2019] border border-[#C8A45D]/25 p-0.5">
              <button
                type="button"
                onClick={() => setLightingPreset('sunrise')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  lightingPreset === 'sunrise'
                    ? 'bg-[#C8A45D] text-[#0B1914] font-medium'
                    : 'text-[#F7F3E8]/70 hover:text-[#F7F3E8]'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Dawn</span>
              </button>
              <button
                type="button"
                onClick={() => setLightingPreset('mediterranean')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  lightingPreset === 'mediterranean'
                    ? 'bg-[#C8A45D] text-[#0B1914] font-medium'
                    : 'text-[#F7F3E8]/70 hover:text-[#F7F3E8]'
                }`}
              >
                <Sun className="w-3 h-3" />
                <span>Noon</span>
              </button>
              <button
                type="button"
                onClick={() => setLightingPreset('candlelight')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  lightingPreset === 'candlelight'
                    ? 'bg-[#C8A45D] text-[#0B1914] font-medium'
                    : 'text-[#F7F3E8]/70 hover:text-[#F7F3E8]'
                }`}
              >
                <Moon className="w-3 h-3" />
                <span>Soirée</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (scrollProgress >= 0.98 && !isAutoCruising) {
                  window.scrollTo(0, 0);
                }
                setIsAutoCruising((prev) => !prev);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isAutoCruising
                  ? 'bg-[#C8A45D] text-[#0B1914] border-[#C8A45D] font-medium'
                  : 'border-[#C8A45D]/40 text-[#C8A45D] hover:border-[#C8A45D]'
              }`}
            >
              {isAutoCruising ? (
                <>
                  <Pause className="w-3 h-3" />
                  <span>Pause Tour</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  <span>Auto-Flight</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 7. Semantic Scroll Anchors for the 6 Architectural Scenes */}
      <div className="relative z-0 pointer-events-none">
        {SCENES.map((scene) => (
          <section
            key={scene.id}
            id={`scene-${scene.id}`}
            aria-label={`${scene.number}. ${scene.title}`}
            className="h-[110vh] w-full"
          />
        ))}
      </div>

      {/* 8. Interactive Concierge Reservation Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        initialSuiteId={selectedSuiteId}
      />
    </div>
  );
}
