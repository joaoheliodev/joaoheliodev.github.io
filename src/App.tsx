import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CommandPalette } from './components/CommandPalette';

const CodexSanctuary3D = lazy(() =>
  import('./components/CodexSanctuary3D').then((m) => ({ default: m.CodexSanctuary3D }))
);
import { FolioMarginRail } from './components/FolioMarginRail';
import { HeroPrologus } from './components/HeroPrologus';
import { ScrollRibbon } from './components/ScrollRibbon';
import { SectionCustody } from './components/SectionCustody';
import { SectionForensics } from './components/SectionForensics';
import { SectionHardware } from './components/SectionHardware';
import { SectionIndexColophon } from './components/SectionIndexColophon';
import { SectionNetwork } from './components/SectionNetwork';
import { SectionTabula3D } from './components/SectionTabula3D';
import { TopBar } from './components/TopBar';
import { TornPaperSeam } from './components/TornPaperSeam';
import type { ThemeMode } from './data/codexData';
import { TESSERAE } from './data/tesseraeData';
import { printCodexDevtoolsBanner } from './utils/devtoolsBanner';
import { playTesseraChime } from './utils/sanctuaryAudio';

export function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('codex_theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [selectedTesseraId, setSelectedTesseraId] = useState<string | null>(null);
  const [hoveredTesseraId, setHoveredTesseraId] = useState<string | null>(null);
  const [pressCount, setPressCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [webglAvailable, setWebglAvailable] = useState(true);
  const pressPulseRef = useRef<Record<string, number>>({});

  useEffect(() => {
    printCodexDevtoolsBanner();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('codex_theme', theme);
    } catch {
      // ignore storage failure in private browsing
    }
  }, [theme]);

  const handleSelectTessera = useCallback(
    (id: string) => {
      const skill = TESSERAE.find((t) => t.id === id);
      if (!skill) return;
      pressPulseRef.current[id] = performance.now();
      setSelectedTesseraId(id);
      setPressCount((c) => c + 1);
      playTesseraChime(skill.freqHz, soundEnabled);
    },
    [soundEnabled]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
        return;
      }

      if (e.key === 'Escape') {
        setPaletteOpen(false);
        return;
      }

      if (paletteOpen || isTyping || e.ctrlKey || e.metaKey || e.altKey) return;

      const matched = TESSERAE.find((t) => t.keyHint === e.key);
      if (matched) {
        handleSelectTessera(matched.id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [paletteOpen, handleSelectTessera]);

  const activeSkill = useMemo(() => {
    const id = hoveredTesseraId ?? selectedTesseraId;
    return id ? TESSERAE.find((t) => t.id === id) ?? null : null;
  }, [hoveredTesseraId, selectedTesseraId]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <div className="codex-shell">
      <Suspense fallback={<div className="webgl-fallback" aria-hidden="true" />}>
        <CodexSanctuary3D
          theme={theme}
          pressCount={pressCount}
          selectedId={selectedTesseraId}
          hoveredId={hoveredTesseraId}
          pressPulseRef={pressPulseRef}
          onHoverTessera={setHoveredTesseraId}
          onSelectTessera={handleSelectTessera}
          onWebGLStatus={setWebglAvailable}
        />
      </Suspense>

      <ScrollRibbon />
      <FolioMarginRail />
      <TopBar
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenPalette={() => setPaletteOpen(true)}
      />

      <main className="codex-main canvas-overlay-mode">
        <HeroPrologus />

        <SectionTabula3D
          activeSkill={activeSkill}
          pressCount={pressCount}
          soundEnabled={soundEnabled}
          webglAvailable={webglAvailable}
          onToggleSound={() => setSoundEnabled((s) => !s)}
          onPressTessera={handleSelectTessera}
        />

        <TornPaperSeam
          roman="PARS I"
          latin="De Silicio et Signis"
          layerNote="Fólio I Recto — Camada Física, Firmware C++ e Telemetria TLS"
        />
        <SectionHardware />

        <TornPaperSeam
          roman="PARS II"
          latin="De Anatomia Codicis"
          layerNote="Fólio II Verso — Dissecação Estática SDNA e Indicadores Desarmados"
        />
        <SectionForensics />

        <TornPaperSeam
          roman="PARS III"
          latin="De Retibus et Finibus"
          layerNote="Fólio III Recto — Núcleo Colapsado Cisco, HSRP e Perímetro ASA"
        />
        <SectionNetwork />

        <TornPaperSeam
          roman="PARS IV"
          latin="De Custodia et Auditoria"
          layerNote="Fólio IV Verso — Persistência Poliglota e Âncora Criptográfica SHA-256"
        />
        <SectionCustody />

        <SectionIndexColophon />
      </main>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
}

export default App;
