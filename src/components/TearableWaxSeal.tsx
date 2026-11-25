import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface TearableWaxSealProps {
  sealTitle: string;
  sealSubtitle: string;
  buttonLabel?: string;
  resealLabel?: string;
  children: React.ReactNode;
}

const TEAR_SPRING = {
  type: 'spring' as const,
  stiffness: 190,
  damping: 26,
  mass: 0.95,
};

export function TearableWaxSeal({
  sealTitle,
  sealSubtitle,
  buttonLabel = 'Romper lacre e abrir pergaminho',
  resealLabel = 'Restaurar lacre de quarentena',
  children,
}: TearableWaxSealProps) {
  const [torn, setTorn] = useState(false);
  const prefersReduced = useReducedMotion();

  const durationZero = { duration: 0.01 };

  return (
    <div className={`wax-seal-chamber ${torn ? 'is-torn' : 'is-sealed'}`}>
      {/* Underlying content revealed as flaps rip apart */}
      <motion.div
        className="wax-seal-content"
        initial={false}
        animate={{
          opacity: torn ? 1 : 0.08,
          scale: torn ? 1 : 0.985,
        }}
        transition={prefersReduced ? durationZero : { duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden={!torn}
      >
        <div className="wax-seal-revealed-bar">
          <span className="wax-seal-status-tag">Sigillum Fractum — Evidências Desarmadas à Vista</span>
          <button
            type="button"
            className="editorial-link"
            onClick={() => setTorn(false)}
          >
            {resealLabel}
          </button>
        </div>
        {children}
      </motion.div>

      {/* Torn parchment overlay flaps + fractured crimson wax stamp */}
      <div
        className="wax-seal-overlay"
        style={{ pointerEvents: torn ? 'none' : 'auto' }}
        aria-hidden={torn}
      >
        <motion.div
          className="wax-flap wax-flap--left"
          initial={false}
          animate={
            torn
              ? { x: '-62%', rotateZ: -4.5, opacity: 0 }
              : { x: '0%', rotateZ: 0, opacity: 1 }
          }
          transition={prefersReduced ? durationZero : TEAR_SPRING}
        >
          <svg
            viewBox="0 0 400 220"
            preserveAspectRatio="none"
            className="wax-flap-svg"
          >
            <path
              d="M0,0 L386,0 L372,28 L394,54 L368,86 L396,118 L374,152 L392,188 L378,220 L0,220 Z"
              fill="var(--tear-fiber)"
            />
            <path
              d="M0,0 L378,0 L364,28 L386,54 L360,86 L388,118 L366,152 L384,188 L370,220 L0,220 Z"
              fill="var(--surface-vellum)"
            />
            <path
              d="M378,0 L364,28 L386,54 L360,86 L388,118 L366,152 L384,188 L370,220"
              fill="none"
              stroke="var(--border-strong)"
              strokeWidth="1.3"
            />
          </svg>
        </motion.div>

        <motion.div
          className="wax-flap wax-flap--right"
          initial={false}
          animate={
            torn
              ? { x: '62%', rotateZ: 4.5, opacity: 0 }
              : { x: '0%', rotateZ: 0, opacity: 1 }
          }
          transition={prefersReduced ? durationZero : TEAR_SPRING}
        >
          <svg
            viewBox="0 0 400 220"
            preserveAspectRatio="none"
            className="wax-flap-svg"
          >
            <path
              d="M22,0 L400,0 L400,220 L14,220 L28,188 L6,152 L32,118 L4,86 L30,54 L10,28 Z"
              fill="var(--tear-fiber)"
            />
            <path
              d="M30,0 L400,0 L400,220 L22,220 L36,188 L14,152 L40,118 L12,86 L38,54 L18,28 Z"
              fill="var(--surface-vellum)"
            />
            <path
              d="M30,0 L18,28 L38,54 L12,86 L40,118 L14,152 L36,188 L22,220"
              fill="none"
              stroke="var(--border-strong)"
              strokeWidth="1.3"
            />
          </svg>
        </motion.div>

        {/* Central fracture seam & interactive crimson wax stamp */}
        <div className="wax-seal-center">
          <motion.div
            className="wax-stamp-wrap"
            initial={false}
            animate={
              torn
                ? { x: -38, y: -14, rotate: -26, opacity: 0, scale: 0.82 }
                : { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 }
            }
            transition={prefersReduced ? durationZero : TEAR_SPRING}
            style={{ clipPath: 'polygon(0 0, 56% 0, 42% 100%, 0 100%)' }}
          >
            <WaxStampGraphic />
          </motion.div>

          <motion.div
            className="wax-stamp-wrap wax-stamp-wrap--overlay"
            initial={false}
            animate={
              torn
                ? { x: 38, y: 14, rotate: 26, opacity: 0, scale: 0.82 }
                : { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 }
            }
            transition={prefersReduced ? durationZero : TEAR_SPRING}
            style={{ clipPath: 'polygon(56% 0, 100% 0, 100% 100%, 42% 100%)' }}
          >
            <WaxStampGraphic />
          </motion.div>

          <motion.div
            className="wax-seal-prompt"
            initial={false}
            animate={{ opacity: torn ? 0 : 1, y: torn ? 10 : 0 }}
            transition={prefersReduced ? durationZero : { duration: 0.2 }}
          >
            <div className="wax-seal-title">{sealTitle}</div>
            <p className="wax-seal-subtitle">{sealSubtitle}</p>
            <button
              type="button"
              className="btn-wax"
              onClick={() => setTorn(true)}
              tabIndex={torn ? -1 : 0}
            >
              {buttonLabel}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function WaxStampGraphic() {
  return (
    <svg className="wax-stamp-svg" viewBox="0 0 88 88" fill="none" aria-hidden="true">
      <path
        d="M44,5 C52,4 58,9 65,11 C72,13 79,19 81,27 C83,35 86,42 83,50 C80,58 80,66 73,72 C66,78 58,82 49,83 C40,84 32,81 24,78 C16,74 10,67 7,58 C4,49 5,40 8,31 C11,22 16,14 25,10 C32,7 37,6 44,5 Z"
        fill="var(--wax)"
        stroke="#6B191A"
        strokeWidth="2"
      />
      <circle cx="44" cy="44" r="27" stroke="#F3EBD8" strokeOpacity="0.48" strokeWidth="1.2" />
      <circle cx="44" cy="44" r="23" stroke="#E4C766" strokeOpacity="0.55" strokeWidth="0.9" strokeDasharray="3 2" />
      <text
        x="44"
        y="47"
        textAnchor="middle"
        fill="#F3EBD8"
        fontFamily="Fraunces, Georgia, serif"
        fontSize="8.5"
        fontWeight="700"
        letterSpacing="1.6"
      >
        SIGILLVM
      </text>
    </svg>
  );
}
