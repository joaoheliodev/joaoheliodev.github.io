import { useState } from 'react';
import { BLEND_STAGES, BLEND_TOOLS, DEFANGED_IOCS } from '../data/codexData';
import { FolioReveal } from './FolioReveal';
import { TearableWaxSeal } from './TearableWaxSeal';

const BINARY_REGIONS = [
  { id: 'header', label: 'Cabeçalho 5.2.1', meta: 'Load UI ativo' },
  { id: 'sdna', label: 'Blocos SDNA', meta: 'Layout + OB_RENDER + fs_strip' },
  { id: 'freestyle', label: 'FRS_freestyle', meta: '0x405 sem TXT_ISSCRIPT' },
  { id: 'zstd', label: 'Cauda Zstd (~4,7 MB)', meta: 'ChaCha20 + LZMA2' },
] as const;

export function SectionForensics() {
  const [activeStage, setActiveStage] = useState(0);
  const [activeTab, setActiveTab] = useState<'discovery' | 'symbols' | 'tools'>('discovery');

  const currentStage = BLEND_STAGES[activeStage];

  return (
    <section className="chapter-band chapter-band--l2" id="pars-ii">
      <FolioReveal className="container">
        <div className="forensics-layout">
          <article className="editorial-column forensics-marginalia">
            <div className="chapter-marker">
              <span className="chapter-numeral">II</span>
              <div>
                <p className="latin-incipit">Nihil executum, omnia inspecta — Forense Binária</p>
                <h2 className="chapter-heading">Dissecação Estática de Artefato .blend</h2>
              </div>
            </div>

            <div className="dossier-tabs" role="tablist" aria-label="Seções da análise estática">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'discovery'}
                className={`dossier-tab-btn ${activeTab === 'discovery' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('discovery')}
              >
                <span className="tab-sec">§ 1</span> Cadeia e Correção
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'symbols'}
                className={`dossier-tab-btn ${activeTab === 'symbols' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('symbols')}
              >
                <span className="tab-sec">§ 2</span> Símbolos SDNA
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'tools'}
                className={`dossier-tab-btn ${activeTab === 'tools' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('tools')}
              >
                <span className="tab-sec">§ 3</span> Utilitários Python
              </button>
            </div>

            {activeTab === 'discovery' && (
              <div className="tab-panel">
                <p>
                  Auditoria conduzida integralmente em repouso — sem instanciar o Blender nem
                  executar um único byte da amostra — sobre um documento salvo no build{' '}
                  <strong>5.2.1 (9e2066aef7ef)</strong> capaz de disparar Python{' '}
                  <strong>mesmo com Auto Run desabilitado</strong>.
                </p>
                <ul className="folio-list">
                  <li>
                    <strong>Vetor de seis elos:</strong> texto oculto sem a flag{' '}
                    <code>TXT_ISSCRIPT</code> acionado por Freestyle em modo script, engatilhado via
                    strip de cena no Sequencer cujo painel substitui o Outliner em modo{' '}
                    <em>Rendered</em>.
                  </li>
                  <li>
                    <strong>Raiz no código-fonte:</strong> em <code>FRS_freestyle.cpp</code>, a
                    rotina <code>prepare()</code> deixava de exigir{' '}
                    <code>G_FLAG_SCRIPT_AUTOEXEC</code>; brecha sanada no{' '}
                    <strong>PR #165375</strong> (versões <strong>5.2.3, 4.5.15 e 5.3.0</strong>;
                    ramos 5.0 e 5.1 permaneceram sem backport).
                  </li>
                </ul>
              </div>
            )}

            {activeTab === 'symbols' && (
              <div className="tab-panel">
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Constante (5.2.1)</th>
                        <th>Valor</th>
                        <th>Efeito na Cadeia</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>TXT_ISSCRIPT</td>
                        <td>1 &lt;&lt; 4 (omitido)</td>
                        <td><code>flags = 0x405</code> esconde o bloco Python</td>
                      </tr>
                      <tr>
                        <td>OB_RENDER</td>
                        <td>6</td>
                        <td>Obriga avaliação completa no preview inicial</td>
                      </tr>
                      <tr>
                        <td>STRIP_TYPE_SCENE</td>
                        <td>2</td>
                        <td>Strip <code>fs_strip</code> invoca <code>FS_Scene</code></td>
                      </tr>
                      <tr>
                        <td>R_EDGE_FRS</td>
                        <td>1 &lt;&lt; 25</td>
                        <td>Ativa Freestyle com <code>SCRIPT_MODE = 1</code></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p style={{ marginTop: '0.75rem' }}>
                  <strong>Estágio final do loader:</strong> temporizador de <code>2 s</code> confere{' '}
                  <code>%TEMP%\sim_cache.idx</code>, requisita 32 bytes em{' '}
                  <code>GET /k :8787</code> com <code>ProxyHandler(&#123;&#125;)</code>, valida{' '}
                  <code>HMAC-SHA256</code>, decifra via <code>ChaCha20</code> + XOR +{' '}
                  <code>FILTER_LZMA2</code> e materializa <code>%TEMP%\sim_cache.exe</code>.
                </p>
              </div>
            )}

            {activeTab === 'tools' && (
              <div className="tab-panel">
                <p>
                  Conjunto autoral em Python puro para inspecionar o binário sem superfície de
                  execução e extrair indicadores desarmados:
                </p>
                <ul className="folio-list">
                  {BLEND_TOOLS.map((tool) => (
                    <li key={tool.name}>
                      <code>{tool.name}</code> — {tool.role}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="editorial-actions">
              <a
                className="editorial-link"
                href="https://github.com/joaoheliodev/malicious-blend-analysis"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ler relatório completo em github.com/joaoheliodev/malicious-blend-analysis
              </a>
            </div>
          </article>

          <div className="workbench-folio" aria-label="Inspetor de cadeia estática no SDNA">
            <div className="workbench-head">
              <span className="workbench-name">Instrumentum II — Anatomia do Binário e Grafo SDNA</span>
              <span className="marginalia-stamp marginalia-stamp--critica">
                Elo {currentStage.numeral} de VI
              </span>
            </div>

            {/* Interactive Binary Offset / Structure Strip */}
            <div className="binary-map-strip" aria-label="Segmentos internos do arquivo .blend">
              {BINARY_REGIONS.map((reg) => {
                const isLit = currentStage.region === reg.id;
                return (
                  <div
                    key={reg.id}
                    className={`binary-segment ${isLit ? 'is-lit' : ''}`}
                  >
                    <span className="binary-seg-title">{reg.label}</span>
                    <span className="binary-seg-meta">{reg.meta}</span>
                  </div>
                );
              })}
            </div>

            <div className="chain-steps" role="tablist" aria-label="Seis elos do gatilho">
              {BLEND_STAGES.map((stage, idx) => (
                <button
                  key={stage.numeral}
                  type="button"
                  role="tab"
                  aria-selected={idx === activeStage}
                  className={`chain-step-btn ${idx === activeStage ? 'is-active' : ''}`}
                  onClick={() => setActiveStage(idx)}
                >
                  <span className="chain-step-num">Elo {stage.numeral}</span>
                  <span>{stage.label}</span>
                </button>
              ))}
            </div>

            <div className="forensic-inspector">
              <div className="forensic-source-ref">{currentStage.sourceRef}</div>
              <div className="forensic-symbol">{currentStage.symbol}</div>
              <p className="forensic-desc">{currentStage.desc}</p>
              <pre className="forensic-hex">{currentStage.hex}</pre>
            </div>

            <div className="forensic-step-nav">
              <button
                type="button"
                className="btn-codex btn-codex--ghost btn-compact"
                onClick={() =>
                  setActiveStage((prev) => (prev - 1 + BLEND_STAGES.length) % BLEND_STAGES.length)
                }
              >
                Elo anterior
              </button>
              <button
                type="button"
                className="btn-codex btn-codex--primary btn-compact"
                onClick={() => setActiveStage((prev) => (prev + 1) % BLEND_STAGES.length)}
              >
                Próximo elo ({BLEND_STAGES[(activeStage + 1) % BLEND_STAGES.length].numeral})
              </button>
            </div>
          </div>
        </div>

        <div className="quarantine-band">
          <TearableWaxSeal
            sealTitle="Quarentena Documental — Indicadores Desarmados"
            sealSubtitle="Endereços, artefatos de host e assinaturas de decifragem extraídos por leitura estática. Rompa o lacre para abrir o fólio."
            buttonLabel="Romper lacre e abrir pergaminho"
            resealLabel="Restaurar lacre de quarentena"
          >
            <div className="ioc-table-grid">
              {DEFANGED_IOCS.map((ioc) => (
                <div key={ioc.kind} className="ioc-ledger-item">
                  <span className="ioc-kind">{ioc.kind}</span>
                  <code className="ioc-value">{ioc.value}</code>
                  <span className="ioc-note">{ioc.note}</span>
                </div>
              ))}
            </div>
          </TearableWaxSeal>
        </div>
      </FolioReveal>
    </section>
  );
}
