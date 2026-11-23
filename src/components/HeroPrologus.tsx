import { useMemo, useState } from 'react';
import { MANIFESTO_CANON } from '../data/codexData';
import { sha256Hex } from '../utils/sha256';

const CHAPTERS = [
  { roman: 'I', href: '#pars-i', label: 'Silício' },
  { roman: 'II', href: '#pars-ii', label: 'Forense' },
  { roman: 'III', href: '#pars-iii', label: 'Redes' },
  { roman: 'IV', href: '#pars-iv', label: 'Custódia' },
];

export function HeroPrologus() {
  const manifestoHash = useMemo(() => sha256Hex(MANIFESTO_CANON), []);
  const [verifyStep, setVerifyStep] = useState<'idle' | 'sweeping' | 'verified'>('idle');
  const [litCount, setLitCount] = useState(0);

  const runVerify = () => {
    setVerifyStep('sweeping');
    setLitCount(0);
    CHAPTERS.forEach((_, idx) => {
      window.setTimeout(() => {
        setLitCount(idx + 1);
        if (idx === CHAPTERS.length - 1) {
          setVerifyStep('verified');
        }
      }, 110 * (idx + 1));
    });
  };

  return (
    <section className="prologus" id="prologus">
      <div className="container prologus-stage-grid">
        {/* Boxless monumental Naresh-inspired typography */}
        <div className="prologus-copy">
          <p className="hero-salve">
            Salve, eu sou <span className="hero-latin-whisper">· Ex silicio ad nubem</span>
          </p>

          <h1 className="hero-title">
            João
            <br />
            <span className="hero-title-accent">Hélio</span>
          </h1>

          <p className="hero-subtitle">
            Cibersegurança, IoT em C++, Redes &amp; Cloud · Ciência da Computação (UNIFEOB)
          </p>

          <div className="hero-actions">
            <a className="btn-codex btn-codex--primary" href="#tabula-3d">
              Explorar Tabula 3D
            </a>
            <a
              className="btn-codex btn-codex--ghost"
              href="https://github.com/joaoheliodev"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub @joaoheliodev
            </a>
          </div>

          <div className="hero-seal-inline" aria-label="Assinatura SHA-256 do Codex">
            <button type="button" className="btn-inline-rule" onClick={runVerify}>
              Verificar SHA-256
            </button>

            <span
              className={`seal-state ${
                verifyStep === 'verified'
                  ? 'seal-state--ok'
                  : verifyStep === 'sweeping'
                    ? 'seal-state--warn'
                    : ''
              }`}
            >
              {verifyStep === 'verified'
                ? 'SIGILLUM INTEGRUM'
                : verifyStep === 'sweeping'
                  ? 'VERIFICANDO...'
                  : `${manifestoHash.slice(0, 12)}…`}
            </span>

            <nav className="hero-roman-dots" aria-label="Capítulos verificados">
              {CHAPTERS.map((ch, idx) => (
                <a
                  key={ch.roman}
                  href={ch.href}
                  className={`roman-dot ${idx < litCount ? 'is-verified' : ''}`}
                  title={`Pars ${ch.roman} — ${ch.label}`}
                >
                  {ch.roman}
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* Open 3D sanctuary viewport */}
        <div className="prologus-canvas-window" />
      </div>

      <a className="scroll-cue" href="#tabula-3d" aria-label="Rolar para a Tabula Lapidea 3D">
        <span className="scroll-cue-mouse" aria-hidden="true">
          <span className="scroll-cue-dot" />
        </span>
      </a>
    </section>
  );
}
