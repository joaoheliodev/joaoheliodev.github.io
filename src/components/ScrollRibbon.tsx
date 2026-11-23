import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';

export function ScrollRibbon() {
  const { scrollYProgress } = useScroll();
  const prefersReduced = useReducedMotion();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 145,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      className="scroll-ribbon"
      style={{ scaleX: prefersReduced ? scrollYProgress : scaleX }}
    />
  );
}
