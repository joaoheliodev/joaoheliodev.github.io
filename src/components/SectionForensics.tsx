import { useState } from 'react';
import { BLEND_STAGES, BLEND_TOOLS, DEFANGED_IOCS } from '../data/codexData';
import { TearableWaxSeal } from './TearableWaxSeal';

export function SectionForensics() {
  const [activeStage, setActiveStage] = useState(0);
  const [activeTab, setActiveTab] = useState<'discovery' | 'symbols' | 'tools'>('discovery');

  const currentStage = BLEND_STAGES[activeStage];

  return (
    <section className="chapter-band chapter-band--l2" id="pars-ii">
      <div className="container">
        <div className="forensics-layout">
          {/* Left column with 3 deep forensic tabs */}
          <article className="editorial-column forensics-marginalia">
            <div className="chapter-marker">
              <span className="chapter-numeral">II</span>
              <div>
                <p className="latin-incipit">Nihil executum, omnia inspecta · Forense</p>
                <h2 className="chapter-heading">Análise Estática de .blend Malicioso</h2>
              </div>
            </div>

            <div className="dossier-tabs" role="tablist" aria-label="Detalhes da análise estática">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'discovery'}
                className={`dossier-tab-btn ${activeTab === 'discovery' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('discovery')}
              >
                Descoberta &amp; Patch
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'symbols'}
                className={`dossier-tab-btn ${activeTab === 'symbols' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('symbols')}
              >
                SDNA &amp; Loader
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'tools'}
                className={`dossier-tab-btn ${activeTab === 'tools' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('tools')}
              >
                Ferramentas (tools/)
              </button>
            </div>

            {activeTab === 'discovery' && (
              <div className="tab-panel">
                <p>
                  Investigação 100% estática — o Blender nunca foi aberto e nenhum código da amostra
                  foi executado — de um artefato salvo no build <strong>5.2.1 (9e2066aef7ef)</strong>{' '}
                  capaz de rodar Python <strong>mesmo com Auto Run desligado</strong>.
                </p>
                <ul className="folio-list">
                  <li>
                    <strong>Cadeia inédita (nov/2026):</strong> combina texto sem flag{' '}
                    <code>TXT_ISSCRIPT</code> + Freestyle em modo script + strip no Sequencer +
                    Outliner trocado para preview <em>Rendered</em>.
                  </li>
                  <li>
                    <strong>Falha em <code>FRS_freestyle.cpp</code>:</strong> <code>prepare()</code>{' '}
                    não verificava <code>G_FLAG_SCRIPT_AUTOEXEC</code>; corrigida no{' '}
                    <strong>PR #165375</strong> (versões <strong>5.2.3, 4.5.15 e 5.3.0</strong>;
                    séries 5.0 e 5.1 sem correção).
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
                        <th>Símbolo (5.2.1)</th>
                        <th>Valor</th>
                        <th>Papel no Exploit</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>TXT_ISSCRIPT</td>
                        <td>1 &lt;&lt; 4 (ausente)</td>
                        <td><code>flags = 0x405</code> oculta o script</td>
                      </tr>
                      <tr>
                        <td>OB_RENDER</td>
                        <td>6</td>
                        <td>Força render no preview do sequencer</td>
                      </tr>
                      <tr>
                        <td>STRIP_TYPE_SCENE</td>
                        <td>2</td>
                        <td>Strip <code>fs_strip</code> chama <code>FS_Scene</code></td>
                      </tr>
                      <tr>
                        <td>R_EDGE_FRS</td>
                        <td>1 &lt;&lt; 25</td>
                        <td>Freestyle <code>SCRIPT_MODE = 1</code></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p style={{ marginTop: '0.75rem' }}>
                  <strong>Loader:</strong> <code>timer 2s</code> → verifica{' '}
                  <code>%TEMP%\sim_cache.idx</code> → <code>GET /k :8787</code> ignorando proxy (
                  <code>ProxyHandler(&#123;&#125;)</code>) → valida <code>HMAC-SHA256</code> →
                  decifra <code>ChaCha20</code> + XOR + <code>FILTER_LZMA2</code> →{' '}
                  <code>%TEMP%\sim_cache.exe</code>.
                </p>
              </div>
            )}

            {activeTab === 'tools' && (
              <div className="tab-panel">
                <p>
                  Scripts escritos em Python puro para auditar o binário com segurança e publicar
                  apenas IOCs comportamentais/desarmados:
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
                className="btn-inline-rule"
                href="https://github.com/joaoheliodev/malicious-blend-analysis"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver análise completa no GitHub →
              </a>
            </div>
          </article>

          {/* Wide right 6-stage interactive SDNA chain inspector */}
          <div className="workbench-folio" aria-label="Inspetor de cadeia estática">
            <div className="workbench-head">
              <span className="workbench-name">Cadeia Estática — 6 Etapas no SDNA</span>
              <span className="seal-state seal-state--critica">
                ETAPA {currentStage.numeral} / VI
              </span>
            </div>

            <div className="chain-steps" role="tablist" aria-label="Etapas do gatilho">
              {BLEND_STAGES.map((stage, idx) => (
                <button
                  key={stage.numeral}
                  type="button"
                  role="tab"
                  aria-selected={idx === activeStage}
                  className={`chain-step-btn ${idx === activeStage ? 'is-active' : ''}`}
                  onClick={() => setActiveStage(idx)}
                >
                  <span className="chain-step-num">Etapa {stage.numeral}</span>
                  <span>{stage.label}</span>
                </button>
              ))}
            </div>

            <div className="forensic-inspector">
              <div className="forensic-symbol">{currentStage.symbol}</div>
              <p className="forensic-desc">{currentStage.desc}</p>
              <pre className="forensic-hex">{currentStage.hex}</pre>
            </div>
          </div>
        </div>

        {/* Full-width tearable wax-sealed parchment envelope containing unarmed IOCs */}
        <div className="quarantine-band">
          <TearableWaxSeal
            sealTitle="QVARANTENA · IOCs DESARMADOS"
            sealSubtitle="Indicadores de rede e host isolados em pergaminho lacrado. Rompa o selo para inspecionar os artefatos desarmados."
            buttonLabel="Romper selo e rasgar pergaminho"
            resealLabel="Selar quarentena novamente"
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
      </div>
    </section>
  );
}
