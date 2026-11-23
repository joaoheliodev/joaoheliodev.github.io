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
      aria-label="Tabula Lapidea 3D Interativa"
    >
      {/* Sticky centered monumental header modeled on Naresh-Khatri/3d-portfolio skills.tsx */}
      <div className="tabula-sticky-header">
        <div className="container tabula-header-inner">
          <div className="tabula-header-eyebrow">
            <span className="latin-incipit">
              {activeSkill
                ? `${activeSkill.layer} · ${activeSkill.latin}`
                : 'Tabula Lapidea · Ars Technica'}
            </span>
          </div>

          <h2 className={`tabula-monumental-title ${activeSkill ? 'is-skill-active' : ''}`}>
            {activeSkill ? activeSkill.title : 'Tabula Lapidea'}
          </h2>

          <p className="tabula-header-desc" role="status" aria-live="polite">
            {activeSkill
              ? activeSkill.desc
              : webglAvailable
                ? '(dica: clique nas tésseras de mármore 3D ou pressione 1–9, 0, -, =)'
                : '(selecione uma téssera abaixo ou pressione 1–9, 0, -, =)'}
          </p>

          <div className="tabula-header-actions">
            {activeSkill && (
              <a className="btn-inline-rule" href={activeSkill.targetHref}>
                Abrir dossiê ({activeSkill.layer}) →
              </a>
            )}
            <button
              type="button"
              className="chrome-btn"
              onClick={onToggleSound}
              aria-pressed={soundEnabled}
            >
              {soundEnabled ? 'Som: Ligado' : 'Som: Mudo'}
            </button>
            <span className="seal-state">Acionadas: {String(pressCount).padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      {/* Responsive mobile/WebGL-fallback tactile grid (hidden on desktop when 3D canvas is active) */}
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
