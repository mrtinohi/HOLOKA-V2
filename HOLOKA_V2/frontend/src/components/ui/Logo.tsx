import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'horizontal' | 'vertical' | 'icon-only';
  showSubtitle?: boolean;
  className?: string;
  animate?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'horizontal',
  showSubtitle = true,
  className = '',
  animate = true,
}) => {
  // Dimensions based on size
  const iconSizes = {
    sm: 32,
    md: 40,
    lg: 52,
    xl: 68,
  };

  const textSizes = {
    sm: { title: 'text-base font-bold tracking-wider', sub: 'text-[9px] tracking-widest' },
    md: { title: 'text-lg font-extrabold tracking-widest', sub: 'text-[10px] tracking-wider' },
    lg: { title: 'text-2xl font-black tracking-widest', sub: 'text-xs tracking-widest' },
    xl: { title: 'text-4xl font-black tracking-widest', sub: 'text-sm tracking-widest' },
  };

  const iconDim = iconSizes[size];

  return (
    <div
      className={`inline-flex items-center gap-3 select-none group ${
        variant === 'vertical' ? 'flex-col text-center' : 'flex-row'
      } ${className}`}
    >
      {/* ─── Animated 3D Isometric / Cyber-Architectural Mark ─── */}
      <div
        className="relative flex items-center justify-center flex-shrink-0 cursor-pointer"
        style={{ width: iconDim, height: iconDim }}
      >
        {/* Ambient Backlight Glow with soft pulse */}
        <div
          className={`absolute inset-0 rounded-2xl filter blur-md opacity-60 transition-all duration-700 ${
            animate ? 'animate-pulse-glow' : ''
          }`}
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.8) 0%, rgba(139,92,246,0.6) 45%, rgba(6,182,212,0.4) 80%, transparent 100%)',
            transform: 'scale(1.25)',
          }}
        />

        {/* Outer Rotating Micro Ring for High-Tech feel */}
        {animate && (
          <div
            className="absolute inset-[-4px] rounded-2xl border border-indigo-400/20 border-dashed pointer-events-none group-hover:border-cyan-400/40 transition-colors duration-500"
            style={{
              animation: 'spin 24s linear infinite',
            }}
          />
        )}

        {/* Core SVG Logo Mark */}
        <svg
          viewBox="0 0 100 100"
          width={iconDim}
          height={iconDim}
          className={`relative z-10 filter drop-shadow-[0_4px_12px_rgba(99,102,241,0.45)] transition-transform duration-500 ease-out ${
            animate ? 'group-hover:scale-105' : ''
          }`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradients for 3D isometric faceted building / "H" monolith */}
            <linearGradient id="holoka_grad_left" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="60%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#312e81" />
            </linearGradient>

            <linearGradient id="holoka_grad_right" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="40%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>

            <linearGradient id="holoka_grad_roof" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a5b4fc" />
              <stop offset="50%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>

            <linearGradient id="holoka_bridge" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>

            <filter id="laser_glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Rounded Shield Container */}
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="24"
            fill="#090d1a"
            stroke="url(#holoka_grad_roof)"
            strokeWidth="1.5"
            strokeOpacity="0.4"
          />

          {/* Background Grid Pattern inside badge */}
          <path
            d="M20 28H80M20 50H80M20 72H80M32 16V84M50 16V84M68 16V84"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />

          {/* Left Tower of "H" (Modern Architectural Skyscraper) */}
          <path
            d="M24 38L38 30V76L24 68V38Z"
            fill="url(#holoka_grad_left)"
          />
          <path
            d="M38 30L44 34V80L38 76V30Z"
            fill="url(#holoka_grad_right)"
            fillOpacity="0.85"
          />
          <path
            d="M24 38L30 34L44 34L38 30L24 38Z"
            fill="url(#holoka_grad_roof)"
          />

          {/* Right Tower of "H" (Higher Twin Tower - Smart Monolith) */}
          <path
            d="M56 26L70 18V64L56 56V26Z"
            fill="url(#holoka_grad_left)"
          />
          <path
            d="M70 18L76 22V68L70 64V18Z"
            fill="url(#holoka_grad_right)"
          />
          <path
            d="M56 26L62 22L76 22L70 18L56 26Z"
            fill="url(#holoka_grad_roof)"
          />

          {/* Sky-Bridge connecting the H (Smart Automation / Connectivity) */}
          <path
            d="M38 48L56 42V51L38 57V48Z"
            fill="url(#holoka_bridge)"
            filter="url(#laser_glow)"
          />
          <path
            d="M38 48L44 44L62 38L56 42L38 48Z"
            fill="#e0e7ff"
            fillOpacity="0.9"
          />

          {/* Beacon / AI Sensor Signal at Top Right Tower */}
          <circle cx="70" cy="18" r="3" fill="#22d3ee" className="animate-ping" style={{ animationDuration: '3s' }} />
          <circle cx="70" cy="18" r="2.5" fill="#ffffff" />

          {/* Light Speed Data Dot */}
          <circle cx="47" cy="45" r="1.8" fill="#38bdf8">
            <animate
              attributeName="cx"
              values="39;55;39"
              dur="2.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="cy"
              values="49;41;49"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>

      {/* ─── Typography & Slogan ─── */}
      {variant !== 'icon-only' && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span
              className={`${textSizes[size].title} font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-cyan-200 transition-all duration-300 group-hover:from-white group-hover:to-cyan-400`}
              style={{
                fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
                letterSpacing: '0.12em',
                textShadow: '0 2px 10px rgba(99,102,241,0.25)',
              }}
            >
              HOLOKA
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
          </div>

          {showSubtitle && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`${textSizes[size].sub} font-semibold uppercase text-slate-400 group-hover:text-indigo-300 transition-colors duration-300`}
                style={{ letterSpacing: '0.18em' }}
              >
                Property Intelligence
              </span>
              <span className="inline-block px-1 py-0.2 rounded text-[8px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
