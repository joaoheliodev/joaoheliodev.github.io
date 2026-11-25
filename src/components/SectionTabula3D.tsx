import { TESSERAE, type TesseraSkill } from '../data/tesseraeData';

interface SectionTabula3DProps {
  activeSkill: TesseraSkill | null;
  pressCount: number;
  soundEnabled: boolean;
  webglAvailable: boolean;
  onToggleSound: () => void;
  onPressTessera: (id: string) => void;
}

export function SectionTabula3D({
  activeSkill,
  pressCount,
  soundEnabled,
  webglAvailable,
  onToggleSound,
  onPressTessera,
}: SectionTabula3DProps) {
  return (
    <section
      className="tabula-3d-stage"
      id="tabula-3d"
      aria-label="Tabula Romana 3D Interativa"
    >
      <div className="tabula-sticky-header">
        <div className="container tabula-header-inner">
          <div className="tabula-header-eyebrow">
            <span className="latin-incipit">
              {activeSkill
                ? `Tessera ${activeSkill.roman} (${activeSkill.layer}) — ${activeSkill.latin}`
                : 'Tabula Romana — Duodecim Tesserae'}
            </span>
          </div>

          <h2 className={`tabula-monumental-title ${activeSkill ? 'is-skill-active' : ''}`}>
            {activeSkill ? activeSkill.title : 'Tabula Romana'}
          </h2>

          <p className="tabula-header-desc" role="status" aria-live="polite">
            {activeSkill
              ? activeSkill.desc
              : webglAvailable
                ? 'Toque nas doze tésseras esculpidas em mármore ou acione as teclas 1–9, 0, - e = no teclado.'
                : 'Selecione uma das doze tésseras abaixo ou acione as teclas 1–9, 0, - e = no teclado.'}
          </p>

          <div className="tabula-header-actions">
            {activeSkill && (
              <a className="editorial-link" href={activeSkill.targetHref}>
                Ler dossiê correspondente ({activeSkill.layer})
              </a>
            )}
            <button
              type="button"
              className="chrome-btn"
              onClick={onToggleSound}
              aria-pressed={soundEnabled}
            >
              {soundEnabled ? 'Ressonância: Ativa' : 'Ressonância: Silenciada'}
            </button>
            <span className="marginalia-stamp">
              Leituras no altar: {String(pressCount).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Responsive mobile / WebGL-fallback tactile grid */}
      <div
        className={`container tabula-mobile-dock-wrap ${
          webglAvailable ? 'tabula-dock-mobile-only' : ''
        }`}
      >
        <div className="tabula-dock" role="group" aria-label="Atalhos das 12 tésseras técnicas">
          {TESSERAE.map((skill) => {
            const isActive = activeSkill?.id === skill.id;
            return (
              <button
                key={skill.id}
                type="button"
                className={`dock-tessera-btn ${isActive ? 'is-active' : ''}`}
                onClick={() => onPressTessera(skill.id)}
              >
                <span className="dock-key">{skill.keyHint}</span>
                <span className="dock-code">{skill.code}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
