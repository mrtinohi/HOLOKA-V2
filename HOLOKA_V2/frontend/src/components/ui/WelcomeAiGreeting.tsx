import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Sparkles, Building2, TrendingUp, ShieldCheck, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface WelcomeAiGreetingProps {
  onDone: () => void;
}

export default function WelcomeAiGreeting({ onDone }: WelcomeAiGreetingProps) {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showFeatures, setShowFeatures] = useState(false);
  const [isShrinking, setIsShrinking] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [targetOffset, setTargetOffset] = useState({ x: 500, y: 350 });

  const hasShrunkRef = useRef(false);

  const isVi = language === 'vi';
  const rawName = user?.fullName || (isVi ? 'Quản trị viên' : 'Admin');
  const firstName = rawName.split(' ').pop() || rawName;

  const fullGreeting = useMemo(() => {
    const lines = isVi
      ? [
          `Xin chào ${firstName}! 👋`,
          `Tôi là Trợ lý ảo AI của HOLOKA.`,
          `Dữ liệu tòa nhà, phòng trọ và hóa đơn đã sẵn sàng hỗ trợ bạn quản lý hôm nay!`
        ]
      : [
          `Hello ${firstName}! 👋`,
          `I am your HOLOKA AI Smart Assistant.`,
          `All properties, rooms, and invoices are synced and ready for you today!`
        ];
    return lines.join('\n');
  }, [isVi, firstName]);

  // Compute exact coordinates of the bottom-right FAB button
  const triggerShrink = useCallback(() => {
    if (hasShrunkRef.current) return;
    hasShrunkRef.current = true;

    const fab = document.getElementById('fab-ai-assistant');
    if (fab) {
      const rect = fab.getBoundingClientRect();
      const fabCenterX = rect.left + rect.width / 2;
      const fabCenterY = rect.top + rect.height / 2;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      setTargetOffset({
        x: Math.round(fabCenterX - centerX),
        y: Math.round(fabCenterY - centerY),
      });
    } else {
      setTargetOffset({
        x: Math.round(window.innerWidth / 2 - 64),
        y: Math.round(window.innerHeight / 2 - 64),
      });
    }

    setIsShrinking(true);

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('holoka-ai-arrived'));
      setIsDone(true);
      onDone();
    }, 1100);
  }, [onDone]);

  // Typewriter effect & auto-shrink timer (runs ONCE on mount)
  useEffect(() => {
    let index = 0;
    const textToType = fullGreeting;
    setDisplayText('');
    setIsTyping(true);

    const typeTimer = setInterval(() => {
      index++;
      setDisplayText(textToType.slice(0, index));
      if (index >= textToType.length) {
        clearInterval(typeTimer);
        setIsTyping(false);
        setShowFeatures(true);
      }
    }, 24);

    // Auto-shrink after 7 seconds of comfortable viewing
    const autoShrinkTimer = setTimeout(() => {
      triggerShrink();
    }, 7000);

    return () => {
      clearInterval(typeTimer);
      clearTimeout(autoShrinkTimer);
    };
  }, [fullGreeting, triggerShrink]);

  if (isDone) return null;

  return (
    <>
      <style>{`
        @keyframes ai-levitate {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-8px) rotate(1deg); }
        }
        @keyframes ai-orbit-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ai-orbit-spin-rev {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes ai-wave-hand {
          0%, 100% { transform: rotate(0deg); }
          25%      { transform: rotate(22deg); }
          75%      { transform: rotate(-14deg); }
        }
        @keyframes ai-equalizer {
          0%, 100% { height: 3px; }
          50%      { height: 14px; }
        }
        @keyframes ai-eye-blink {
          0%, 93%, 100% { transform: scaleY(1); }
          95.5%         { transform: scaleY(0.12); }
        }
        @keyframes ai-beacon-ping {
          0%   { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes ai-particle-float {
          0%   { opacity: 0; transform: translateY(0) scale(0.5); }
          50%  { opacity: 0.9; transform: translateY(-12px) scale(1); }
          100% { opacity: 0; transform: translateY(-24px) scale(0.3); }
        }
        @keyframes ai-modal-enter {
          0%   { opacity: 0; transform: scale(0.65) translateY(35px); }
          75%  { transform: scale(1.02) translateY(-3px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes ai-fly-to-corner {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          35% {
            transform: translate(calc(var(--target-x) * 0.25), calc(var(--target-y) * 0.25 - 25px)) scale(0.85);
            opacity: 0.95;
          }
          100% {
            transform: translate(var(--target-x), var(--target-y)) scale(0.06);
            opacity: 0;
          }
        }
        @keyframes ai-backdrop-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes ai-backdrop-fade-out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[199]"
        style={{
          background: 'radial-gradient(circle at center, rgba(15, 23, 42, 0.85) 0%, rgba(3, 7, 18, 0.94) 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          animation: isShrinking
            ? 'ai-backdrop-fade-out 1.1s cubic-bezier(0.4, 0, 0.2, 1) forwards'
            : 'ai-backdrop-fade-in 0.35s ease forwards',
        }}
        onClick={triggerShrink}
      />

      {/* Main Container */}
      <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none p-4">
        <div
          className="pointer-events-auto"
          style={{
            '--target-x': `${targetOffset.x}px`,
            '--target-y': `${targetOffset.y}px`,
            animation: isShrinking
              ? 'ai-fly-to-corner 1.1s cubic-bezier(0.25, 1, 0.5, 1) forwards'
              : 'ai-modal-enter 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            transformOrigin: 'center center',
          } as React.CSSProperties}
        >
          {/* Futuristic Welcome Card */}
          <div
            className="relative rounded-3xl overflow-hidden select-none"
            style={{
              width: 'min(500px, 94vw)',
              background: 'linear-gradient(165deg, rgba(15, 23, 42, 0.96) 0%, rgba(17, 24, 39, 0.98) 60%, rgba(30, 27, 75, 0.96) 100%)',
              border: '1.5px solid rgba(99, 102, 241, 0.35)',
              boxShadow: `
                0 0 0 1px rgba(255,255,255,0.08),
                0 25px 60px -15px rgba(0, 0, 0, 0.8),
                0 0 50px rgba(99, 102, 241, 0.25),
                inset 0 1px 1px rgba(255,255,255,0.12)
              `,
            }}
          >
            {/* Ambient Background Lights */}
            <div
              className="absolute -top-24 -left-24 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)' }}
            />
            <div
              className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)' }}
            />

            {/* Top Bar */}
            <div
              className="px-6 py-3.5 flex items-center justify-between border-b"
              style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.25)' }}
            >
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
                </span>
                <span className="text-xs font-bold tracking-wider text-cyan-300 uppercase flex items-center gap-1.5">
                  <Sparkles size={13} className="text-indigo-400" />
                  HOLOKA AI • {isVi ? 'Trợ Lý Ảo Thông Minh' : 'Smart Assistant'}
                </span>
              </div>

              <button
                type="button"
                onClick={triggerShrink}
                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer px-2.5 py-1 rounded-lg hover:bg-white/10 flex items-center gap-1"
                title={isVi ? 'Đóng và thu về góc màn hình' : 'Close and dock to corner'}
              >
                <span>{isVi ? 'Thu gọn' : 'Dock'}</span>
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 sm:px-8 pt-7 pb-6 flex flex-col items-center text-center">

              {/* ─── ANIMATED AI MASCOT (CON AI ĐỘNG) ─── */}
              <div className="relative mb-5" style={{ animation: 'ai-levitate 3.6s ease-in-out infinite' }}>
                
                {/* Aura Glow */}
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)',
                    transform: 'scale(2.2)',
                  }}
                />

                {/* Outer Dashed Orbit Ring */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    inset: -18,
                    borderRadius: '50%',
                    border: '1.5px dashed rgba(99, 102, 241, 0.45)',
                    animation: 'ai-orbit-spin 12s linear infinite',
                  }}
                />

                {/* Inner Dashed Orbit Ring */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    inset: -8,
                    borderRadius: '50%',
                    border: '1px dashed rgba(6, 182, 212, 0.45)',
                    animation: 'ai-orbit-spin-rev 8s linear infinite',
                  }}
                />

                {/* Sparkling Energy Particles */}
                {[0, 72, 144, 216, 288].map((deg, idx) => (
                  <div
                    key={idx}
                    className="absolute pointer-events-none"
                    style={{
                      width: 8,
                      height: 8,
                      top: '50%',
                      left: '50%',
                      transform: `rotate(${deg}deg) translateX(52px)`,
                      animation: `ai-particle-float ${2 + idx * 0.4}s ease-in-out infinite`,
                      animationDelay: `${idx * 0.3}s`,
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: idx % 2 === 0 ? '#38bdf8' : '#818cf8',
                        boxShadow: idx % 2 === 0 ? '0 0 8px #38bdf8' : '0 0 8px #818cf8',
                      }}
                    />
                  </div>
                ))}

                {/* Robot Mascot Main Vessel */}
                <div
                  className="relative w-28 h-28 rounded-full flex flex-col items-center justify-center p-2 shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #0284c7 100%)',
                    border: '2px solid rgba(165, 180, 252, 0.5)',
                    boxShadow: '0 0 30px rgba(99,102,241,0.6), inset 0 2px 4px rgba(255,255,255,0.3)',
                  }}
                >
                  {/* Robot Antenna on top */}
                  <div className="absolute -top-5 flex flex-col items-center">
                    <div className="relative w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]">
                      <div
                        className="absolute inset-0 rounded-full bg-cyan-300"
                        style={{ animation: 'ai-beacon-ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite' }}
                      />
                    </div>
                    <div className="w-1 h-2.5 bg-gradient-to-b from-indigo-300 to-indigo-600 rounded-sm" />
                  </div>

                  {/* Robot Ear Modules */}
                  <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-7 rounded-l-md bg-indigo-950 border border-indigo-400/50 shadow-md flex items-center justify-center">
                    <div className="w-1 h-3 rounded-full bg-cyan-400 animate-pulse" />
                  </div>
                  <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-7 rounded-r-md bg-indigo-950 border border-indigo-400/50 shadow-md flex items-center justify-center">
                    <div className="w-1 h-3 rounded-full bg-cyan-400 animate-pulse" />
                  </div>

                  {/* Robot Glass Visor (Screen) */}
                  <div
                    className="w-20 h-16 rounded-2xl flex flex-col items-center justify-center gap-1 px-2 relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(180deg, #090d16 0%, #0f172a 100%)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      boxShadow: 'inset 0 0 14px rgba(0,0,0,0.9), 0 0 10px rgba(56,189,248,0.3)',
                    }}
                  >
                    {/* Visor Glare/Gloss Reflection */}
                    <div
                      className="absolute top-0 left-0 right-0 h-4 pointer-events-none rounded-t-2xl opacity-20"
                      style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, transparent 100%)',
                      }}
                    />

                    {/* Robot Eyes (Pure CSS blinking - 0 re-render flicker) */}
                    <div className="flex items-center gap-3 z-10 pt-1">
                      <div
                        className="w-3.5 h-3.5 rounded-full bg-cyan-400"
                        style={{
                          boxShadow: '0 0 10px #22d3ee, 0 0 18px #06b6d4',
                          animation: 'ai-eye-blink 3.4s ease-in-out infinite',
                          transformOrigin: 'center center',
                        }}
                      />
                      <div
                        className="w-3.5 h-3.5 rounded-full bg-cyan-400"
                        style={{
                          boxShadow: '0 0 10px #22d3ee, 0 0 18px #06b6d4',
                          animation: 'ai-eye-blink 3.4s ease-in-out infinite',
                          transformOrigin: 'center center',
                        }}
                      />
                    </div>

                    {/* Robot Mouth: Equalizer while speaking, glowing smile when done */}
                    <div className="flex items-center justify-center z-10 h-3">
                      {isTyping ? (
                        <div className="flex items-center gap-1">
                          {[0.2, 0.4, 0.1, 0.5, 0.3].map((delay, idx) => (
                            <div
                              key={idx}
                              className="w-1 rounded-full bg-indigo-300"
                              style={{
                                animation: 'ai-equalizer 0.7s ease-in-out infinite',
                                animationDelay: `${delay}s`,
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div
                          className="w-6 h-2 rounded-b-full border-b-2 border-l-2 border-r-2 border-cyan-300/80"
                          style={{ boxShadow: '0 2px 6px rgba(34,211,238,0.4)' }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Waving Hand Badge */}
                  <div
                    className="absolute -right-3 bottom-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 border border-white/30 flex items-center justify-center text-sm shadow-lg"
                    style={{
                      animation: 'ai-wave-hand 2s ease-in-out infinite',
                      transformOrigin: 'bottom left',
                    }}
                    title="Xin chào!"
                  >
                    👋
                  </div>
                </div>

                {/* Holographic Ring under the mascot */}
                <div
                  className="w-20 h-2 rounded-full mx-auto mt-2"
                  style={{
                    background: 'radial-gradient(ellipse, rgba(56,189,248,0.6) 0%, transparent 80%)',
                    filter: 'blur(1px)',
                  }}
                />
              </div>

              {/* ─── VIETNAMESE GREETING SPEECH BUBBLE ─── */}
              <div
                className="w-full text-left p-4 sm:p-5 rounded-2xl mb-4 relative"
                style={{
                  minHeight: '100px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)',
                }}
              >
                <div className="text-white font-medium leading-relaxed whitespace-pre-line text-sm sm:text-[15px]">
                  {displayText}
                  {isTyping && (
                    <span
                      className="inline-block w-1.5 h-4 bg-cyan-400 ml-1 align-middle rounded-full animate-pulse"
                    />
                  )}
                </div>
              </div>

              {/* ─── FEATURE PILLS (Fade in gracefully without height jump) ─── */}
              <div
                className="w-full space-y-2 mb-5 transition-all duration-500 ease-out"
                style={{
                  opacity: showFeatures ? 1 : 0,
                  transform: showFeatures ? 'translateY(0)' : 'translateY(8px)',
                  pointerEvents: showFeatures ? 'auto' : 'none',
                }}
              >
                {[
                  {
                    icon: Building2,
                    color: '#38bdf8',
                    bg: 'rgba(56, 189, 248, 0.12)',
                    text: isVi ? 'Theo dõi phòng & tòa nhà theo thời gian thực' : 'Real-time room & building monitoring',
                  },
                  {
                    icon: TrendingUp,
                    color: '#34d399',
                    bg: 'rgba(52, 211, 153, 0.12)',
                    text: isVi ? 'Cảnh báo tự động hóa đơn & nhắc hạn hợp đồng' : 'Automated invoice & contract renewal alerts',
                  },
                  {
                    icon: ShieldCheck,
                    color: '#a78bfa',
                    bg: 'rgba(167, 139, 250, 0.12)',
                    text: isVi ? 'Hỗ trợ 24/7 — Tôi luôn ở góc phải màn hình của bạn!' : '24/7 Support — I am always in your bottom-right corner!',
                  },
                ].map(({ icon: Icon, color, bg, text }) => (
                  <div
                    key={text}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left"
                    style={{
                      background: bg,
                      border: `1px solid ${color}30`,
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}25` }}
                    >
                      <Icon size={15} style={{ color }} />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-slate-200 flex-1">
                      {text}
                    </span>
                  </div>
                ))}
              </div>

              {/* ─── ACTION BUTTONS ─── */}
              <div className="w-full flex items-center gap-3">
                <button
                  type="button"
                  onClick={triggerShrink}
                  className="flex-1 py-3 px-4 rounded-xl text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #06b6d4 100%)',
                  }}
                >
                  <span>{isVi ? 'Bắt đầu làm việc ngay' : 'Start Managing Now'}</span>
                  <ArrowRight size={17} />
                </button>

                <button
                  type="button"
                  onClick={triggerShrink}
                  className="py-3 px-4 rounded-xl text-slate-400 hover:text-white font-medium text-xs sm:text-sm bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                >
                  {isVi ? 'Bỏ qua' : 'Skip'}
                </button>
              </div>

            </div>

            {/* Footer Status Line */}
            <div
              className="px-6 py-2.5 flex items-center justify-center gap-2 border-t"
              style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-slate-400 font-medium">
                {isVi
                  ? 'Hệ thống HOLOKA đang hoạt động an toàn & ổn định'
                  : 'HOLOKA property management engine is operational'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
