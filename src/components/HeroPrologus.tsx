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
      }, 105 * (idx + 1));
    });
  };

  return (
    <section className="prologus" id="prologus">
      <div className="container prologus-stage-grid">
        <div className="prologus-copy">
          <div className="hero-folio-sig">
            <span className="hero-folio-ref">Fólio Prologi — UNIFEOB, Brasil</span>
            <span className="hero-folio-rule" aria-hidden="true" />
            <em className="hero-latin-whisper">Ex silicio ad nubem</em>
          </div>

          <h1 className="hero-title">
            João
            <br />
            <span className="hero-title-surname">Hélio</span>
          </h1>

          <p className="hero-subtitle">
            Estudante de Ciência da Computação dedicado à engenharia que atravessa a máquina inteira:
            firmware determinístico em C++, dissecação estática de binários, redes corporativas Cisco
            e custódia criptográfica de incidentes em Python e nuvem.
          </p>

          <div className="hero-actions">
            <a className="btn-codex btn-codex--primary" href="#tabula-3d">
              Operar Tabula Romana 3D
            </a>
            <a
              className="btn-codex btn-codex--ghost"
              href="https://github.com/joaoheliodev"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/joaoheliodev
            </a>
          </div>

          <div className="hero-seal-ledger" aria-label="Assinatura SHA-256 do Codex">
            <div className="hero-seal-meta">
              <button type="button" className="editorial-link" onClick={runVerify}>
                Conferir integridade SHA-256
              </button>

              <span
                className={`marginalia-stamp ${
                  verifyStep === 'verified'
                    ? 'marginalia-stamp--ok'
                    : verifyStep === 'sweeping'
                      ? 'marginalia-stamp--warn'
                      : ''
                }`}
              >
                {verifyStep === 'verified'
                  ? 'Sigillum Integrum'
                  : verifyStep === 'sweeping'
                    ? 'Calculando digest…'
                    : `sha256: ${manifestoHash.slice(0, 14)}…`}
              </span>
            </div>

            <nav className="hero-roman-seals" aria-label="Quatro partes do tratado">
              {CHAPTERS.map((ch, idx) => (
                <a
                  key={ch.roman}
                  href={ch.href}
                  className={`roman-seal ${idx < litCount ? 'is-verified' : ''}`}
                  title={`Pars ${ch.roman} — ${ch.label}`}
                >
                  <span className="roman-seal-num">{ch.roman}</span>
                  <span className="roman-seal-lbl">{ch.label}</span>
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* Open 3D sanctuary viewport */}
        <div className="prologus-canvas-window" />
      </div>

      <a className="plumb-cue" href="#tabula-3d" aria-label="Descer para a Tabula Romana 3D">
        <span className="plumb-cue-label">Tabula Romana</span>
        <span className="plumb-cue-line" aria-hidden="true" />
      </a>
    </section>
  );
}
