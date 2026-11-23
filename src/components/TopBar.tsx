import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { ThemeMode } from '../data/codexData';

interface TopBarProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenPalette: () => void;
}

const NAV_CHAPTERS = [
  { href: '#prologus', roman: '00', title: 'Prologus', latin: 'Ex silicio ad nubem' },
  { href: '#tabula-3d', roman: '✦', title: 'Tabula Lapidea 3D', latin: 'Ars technica interactiva' },
  { href: '#pars-i', roman: 'I', title: 'Estacionamento ESP32', latin: 'Signum ex materia' },
  { href: '#pars-ii', roman: 'II', title: 'Análise .blend', latin: 'Nihil executum, omnia inspecta' },
  { href: '#pars-iii', roman: 'III', title: 'Rede Campus UNIFEOB', latin: 'Duplex via, nulla mora' },
  { href: '#pars-iv', roman: 'IV', title: 'Iosephus SOC', latin: 'Verba volant, hash manet' },
  { href: '#github-archive', roman: 'V', title: 'Arquivo & GitHub', latin: 'Tabula codicum publicorum' },
  { href: '#colophon', roman: '∞', title: 'Colophon', latin: 'Ad Maiorem Scientiae Gloriam' },
];

export function TopBar({ theme, onToggleTheme, onOpenPalette }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <header className={`topbar ${menuOpen ? 'is-menu-open' : ''}`}>
      <div className="topbar-inner">
        <a
          className="brand"
          href="#prologus"
          aria-label="Início — João Hélio"
          onClick={() => setMenuOpen(false)}
        >
          <span className="brand-chirho" aria-hidden="true">
            ☧
          </span>
          <span className="brand-name">João Hélio</span>
        </a>

        {/* Clean desktop quick tabs */}
        <nav className="topbar-tabs" aria-label="Atalhos principais">
          <a href="#tabula-3d">Tabula 3D</a>
          <a href="#pars-i">Projetos</a>
          <a href="#github-archive">Arquivo</a>
        </nav>

        <div className="topbar-actions">
          {/* Dedicated GitHub Tab/Link visible across desktop and mobile */}
          <a
            className="chrome-btn chrome-github-tab"
            href="https://github.com/joaoheliodev"
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir GitHub @joaoheliodev"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.69-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.07.78 2.15 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
            </svg>
            <span className="chrome-btn-label">GitHub</span>
          </a>

          <button
            type="button"
            className="chrome-btn"
            onClick={onToggleTheme}
            aria-pressed={theme === 'light'}
            title="Alternar edição Vigília Noturna / Pergaminho"
          >
            <span>{theme === 'dark' ? 'Vigília' : 'Pergaminho'}</span>
          </button>

          <button
            type="button"
            className="chrome-btn"
            onClick={onOpenPalette}
            title="Abrir console do Codex (Ctrl+K)"
          >
            <span aria-hidden="true">⌘</span>
            <span className="chrome-btn-label">Console</span>
          </button>

          <button
            type="button"
            className="chrome-menu-toggle"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Fechar navegação' : 'Abrir navegação'}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span className="menu-word">{menuOpen ? 'Fechar' : 'Menu'}</span>
            <span className={`burger-lines ${menuOpen ? 'is-active' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="nav-overlay"
            initial={
              prefersReduced
                ? { opacity: 0 }
                : { opacity: 0, clipPath: 'inset(0 0 100% 0)' }
            }
            animate={
              prefersReduced
                ? { opacity: 1 }
                : { opacity: 1, clipPath: 'inset(0 0 0% 0)' }
            }
            exit={
              prefersReduced
                ? { opacity: 0 }
                : { opacity: 0, clipPath: 'inset(0 0 100% 0)' }
            }
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <nav className="container nav-overlay-grid" aria-label="Capítulos do Codex">
              {NAV_CHAPTERS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="nav-overlay-link"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="nav-overlay-roman">{item.roman}</span>
                  <span className="nav-overlay-text">
                    <strong>{item.title}</strong>
                    <em>{item.latin}</em>
                  </span>
                </a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
