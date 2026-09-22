import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, ExternalLink, Sliders } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { HomeSlider } from '../../types';

interface HomeCarouselProps {
  onNavigate: (tab: string) => void;
  isAdmin?: boolean;
}

export function HomeCarousel({ onNavigate, isAdmin = false }: HomeCarouselProps) {
  const [sliders, setSliders] = useState<HomeSlider[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Touch swipe support
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const fetchSliders = async () => {
    try {
      setIsLoading(true);
      const res = await apiRequest<{ sliders: HomeSlider[] }>('/api/sliders/public');
      if (res && res.sliders && res.sliders.length > 0) {
        setSliders(res.sliders);
      }
    } catch (err) {
      console.warn('Could not fetch sliders, using fallbacks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSliders();
  }, []);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (sliders.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sliders.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [sliders.length, isPaused]);

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (sliders.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + sliders.length) % sliders.length);
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (sliders.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % sliders.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      // Swiped left -> Next
      handleNext();
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> Prev
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleActionClick = (slider: HomeSlider, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const link = slider.buttonLink || 'wallet';
    if (link.startsWith('http://') || link.startsWith('https://')) {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      // Normalize internal tab name (e.g. '/wallet' -> 'wallet')
      const targetTab = link.replace(/^\//, '') || 'wallet';
      onNavigate(targetTab);
    }
  };

  if (isLoading && sliders.length === 0) {
    return (
      <div className="w-full h-36 sm:h-44 md:h-52 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse flex items-center justify-center text-slate-500 text-xs">
        <span>Loading banners...</span>
      </div>
    );
  }

  if (sliders.length === 0) {
    return null;
  }

  const currentSlide = sliders[currentIndex] || sliders[0];

  return (
    <div
      id="user-home-carousel"
      className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-950 shadow-2xl group select-none transition-all"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => handleActionClick(currentSlide)}
      role="region"
      aria-label="Promotional Carousel"
    >
      {/* Aspect Ratio Container: Wide panoramic like user screenshot */}
      <div className="relative w-full min-h-[160px] sm:min-h-[190px] md:min-h-[220px] lg:min-h-[240px] flex items-center overflow-hidden cursor-pointer">
        
        {/* Background Banner Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={currentSlide.imageUrl}
            alt={currentSlide.title}
            className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            referrerPolicy="no-referrer"
          />
          {/* Subtle gradient vignette to guarantee crisp contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent sm:via-slate-950/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
        </div>

        {/* Banner Content Layout */}
        <div className="relative z-10 w-full px-5 sm:px-8 md:px-12 py-6 flex flex-col justify-between max-w-2xl sm:max-w-3xl space-y-2">
          
          {/* Tag Pill (e.g. মাত্র ১X ওয়েজারিং! or Special Offer) */}
          <div className="flex items-center gap-2">
            {currentSlide.tag ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-600 text-white font-black text-[11px] sm:text-xs shadow-md tracking-tight uppercase animate-pulse">
                <Sparkles className="w-3 h-3" />
                <span>{currentSlide.tag}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[11px] uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>স্পেশাল অফার</span>
              </span>
            )}

            {isAdmin && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                <Sliders className="w-2.5 h-2.5" />
                Slide #{currentIndex + 1}
              </span>
            )}
          </div>

          {/* Headline Title */}
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
            {currentSlide.title}
          </h2>

          {/* Subtitle / Description */}
          {currentSlide.subtitle && (
            <p className="text-xs sm:text-sm md:text-base text-slate-200 font-medium max-w-xl line-clamp-2 drop-shadow leading-relaxed">
              {currentSlide.subtitle}
            </p>
          )}

          {/* Action CTA Button */}
          {currentSlide.buttonText && (
            <div className="pt-2">
              <button
                type="button"
                onClick={(e) => handleActionClick(currentSlide, e)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-950/40 transform active:scale-95 transition cursor-pointer"
              >
                <span>{currentSlide.buttonText}</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          )}
        </div>

        {/* Carousel Left Navigation Button (Exact style matching user image) */}
        {sliders.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 sm:left-4 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-950/80 hover:bg-slate-900 active:scale-90 border border-white/10 text-white flex items-center justify-center backdrop-blur-md shadow-xl transition cursor-pointer"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5 text-slate-200" />
          </button>
        )}

        {/* Carousel Right Navigation Button (Exact style matching user image) */}
        {sliders.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 sm:right-4 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-950/80 hover:bg-slate-900 active:scale-90 border border-white/10 text-white flex items-center justify-center backdrop-blur-md shadow-xl transition cursor-pointer"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5 text-slate-200" />
          </button>
        )}

        {/* Bottom Carousel Indicator Dots */}
        {sliders.length > 1 && (
          <div
            className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/5"
            onClick={(e) => e.stopPropagation()}
          >
            {sliders.map((s, idx) => (
              <button
                key={s.id || idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === currentIndex
                    ? 'w-6 h-1.5 bg-amber-400 shadow-sm shadow-amber-400/50'
                    : 'w-1.5 h-1.5 bg-slate-500/60 hover:bg-slate-300'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
