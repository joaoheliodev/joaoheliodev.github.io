import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';

const FOLIO_STOPS = [
  { href: '#prologus', code: '00', title: 'Prologus' },
  { href: '#tabula-3d', code: '✦', title: 'Tabula Romana' },
  { href: '#pars-i', code: 'I', title: 'Pars I — Silício e ESP32' },
  { href: '#pars-ii', code: 'II', title: 'Pars II — Forense .blend' },
  { href: '#pars-iii', code: 'III', title: 'Pars III — Rede UNIFEOB' },
  { href: '#pars-iv', code: 'IV', title: 'Pars IV — Iosephus SOC' },
  { href: '#github-archive', code: 'V', title: 'Index Codicum' },
  { href: '#colophon', code: '§', title: 'Explicit' },
];

export function FolioMarginRail() {
  const { scrollYProgress } = useScroll();
  const prefersReduced = useReducedMotion();

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 210,
    damping: 32,
    restDelta: 0.001,
  });

  return (
    <aside className="folio-margin-rail" aria-label="Índice marginal de fólios">
      <div className="folio-rail-track" aria-hidden="true">
        <motion.div
          className="folio-rail-fill"
          style={{ scaleY: prefersReduced ? scrollYProgress : scaleY }}
        />
      </div>
      <nav className="folio-rail-links">
        {FOLIO_STOPS.map((stop) => (
          <a key={stop.href} href={stop.href} className="folio-rail-link" title={stop.title}>
            {stop.code}
          </a>
        ))}
      </nav>
    </aside>
  );
}
