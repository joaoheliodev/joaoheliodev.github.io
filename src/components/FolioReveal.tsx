import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';

interface FolioRevealProps {
  children: React.ReactNode;
  className?: string;
  yOffset?: number;
}

export function FolioReveal({ children, className, yOffset = 14 }: FolioRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 98%', 'start 84%'],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: 240,
    damping: 32,
    mass: 0.75,
    restDelta: 0.001,
  });

  const y = useTransform(smooth, [0, 1], [yOffset, 0]);
  const opacity = useTransform(smooth, [0, 1], [0.72, 1]);

  if (prefersReduced) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ y, opacity, willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
}
