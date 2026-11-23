import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';

interface TornPaperSeamProps {
  idTarget?: string;
  roman: string;
  latin: string;
  layerNote: string;
}

export function TornPaperSeam({ roman, latin, layerNote }: TornPaperSeamProps) {
  const seamRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: seamRef,
    offset: ['start 92%', 'center 54%'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 130,
    damping: 28,
    restDelta: 0.001,
  });

  const leftX = useTransform(smoothProgress, [0, 1], ['0%', '-72%']);
  const rightX = useTransform(smoothProgress, [0, 1], ['0%', '72%']);
  const leftRotate = useTransform(smoothProgress, [0, 1], [0, -2.0]);
  const rightRotate = useTransform(smoothProgress, [0, 1], [0, 2.0]);
  const sheetOpacity = useTransform(smoothProgress, [0, 0.72, 1], [0.96, 0.68, 0.14]);
  const revealOpacity = useTransform(smoothProgress, [0.08, 0.55, 1], [0.35, 0.9, 1]);
  const revealScale = useTransform(smoothProgress, [0.08, 1], [0.96, 1]);

  return (
    <div className="torn-seam" ref={seamRef} aria-hidden="true">
      {/* Revealed underlying chapter marker */}
      <motion.div
        className="torn-seam-under"
        style={
          prefersReduced
            ? { opacity: 1 }
            : { opacity: revealOpacity, scale: revealScale }
        }
      >
        <span className="torn-seam-rule" />
        <div className="torn-seam-copy">
          <span className="torn-seam-roman">{roman}</span>
          <span className="torn-seam-latin">{latin}</span>
          <span className="torn-seam-note">{layerNote}</span>
        </div>
        <span className="torn-seam-rule" />
      </motion.div>

      {/* Left tearing parchment leaf */}
      <motion.div
        className="torn-seam-leaf torn-seam-leaf--left"
        style={
          prefersReduced
            ? { x: '-62%', opacity: 0.14 }
            : { x: leftX, rotateZ: leftRotate, opacity: sheetOpacity }
        }
      >
        <svg viewBox="0 0 600 100" preserveAspectRatio="none" className="torn-leaf-svg">
          {/* Exposed fibrous paper tear edge */}
          <path
            d="M0,0 L562,0 L548,14 L571,27 L552,42 L578,56 L556,72 L574,86 L558,100 L0,100 Z"
            fill="var(--tear-fiber)"
          />
          {/* Main parchment surface */}
          <path
            d="M0,0 L554,0 L541,14 L563,27 L544,42 L570,56 L548,72 L566,86 L550,100 L0,100 Z"
            fill="var(--surface-folio)"
          />
          <path
            d="M554,0 L541,14 L563,27 L544,42 L570,56 L548,72 L566,86 L550,100"
            fill="none"
            stroke="var(--border-strong)"
            strokeWidth="1.2"
          />
        </svg>
      </motion.div>

      {/* Right tearing parchment leaf */}
      <motion.div
        className="torn-seam-leaf torn-seam-leaf--right"
        style={
          prefersReduced
            ? { x: '62%', opacity: 0.14 }
            : { x: rightX, rotateZ: rightRotate, opacity: sheetOpacity }
        }
      >
        <svg viewBox="0 0 600 100" preserveAspectRatio="none" className="torn-leaf-svg">
          {/* Exposed fibrous paper tear edge */}
          <path
            d="M42,0 L600,0 L600,100 L38,100 L54,86 L36,72 L58,56 L32,42 L51,27 L29,14 Z"
            fill="var(--tear-fiber)"
          />
          {/* Main parchment surface */}
          <path
            d="M50,0 L600,0 L600,100 L46,100 L62,86 L44,72 L66,56 L40,42 L59,27 L37,14 Z"
            fill="var(--surface-folio)"
          />
          <path
            d="M50,0 L37,14 L59,27 L40,42 L66,56 L44,72 L62,86 L46,100"
            fill="none"
            stroke="var(--border-strong)"
            strokeWidth="1.2"
          />
        </svg>
      </motion.div>
    </div>
  );
}
