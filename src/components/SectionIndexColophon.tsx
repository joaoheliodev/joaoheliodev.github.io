import { useState } from 'react';
import { CAPABILITIES_LEDGER, PUBLIC_REPOS } from '../data/codexData';

export function SectionIndexColophon() {
  const [archiveTab, setArchiveTab] = useState<'github' | 'skills'>('github');

  return (
    <>
      <section className="chapter-band chapter-band--tabula" id="github-archive">
        <div className="container">
          <div className="archive-head-row">
            <div className="chapter-marker">
              <span className="chapter-numeral">V</span>
              <div>
                <p className="latin-incipit">Tabula codicum — Archivum publicum</p>
                <h2 className="chapter-heading">GitHub &amp; Dossiê de Competências</h2>
              </div>
            </div>

            <div className="dossier-tabs" role="tablist" aria-label="Abas do arquivo técnico">
              <button
                type="button"
                role="tab"
                aria-selected={archiveTab === 'github'}
                className={`dossier-tab-btn ${archiveTab === 'github' ? 'is-active' : ''}`}
                onClick={() => setArchiveTab('github')}
              >
                GitHub · Repositórios Públicos
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={archiveTab === 'skills'}
                className={`dossier-tab-btn ${archiveTab === 'skills' ? 'is-active' : ''}`}
                onClick={() => setArchiveTab('skills')}
              >
                Competências &amp; UNIFEOB
              </button>
            </div>
          </div>

          {archiveTab === 'github' && (
            <div className="github-archive-panel">
              {/* Prominent GitHub Profile Banner Card */}
              <div className="github-profile-banner">
                <div>
                  <div className="github-handle-row">
                    <strong>github.com/joaoheliodev</strong>
                    <span className="seal-state seal-state--ok">PERFIL PÚBLICO</span>
                  </div>
                  <p className="github-bio-line">
                    Ciência da Computação (UNIFEOB · Brasil) — C, C++, Python, Cibersegurança, IoT,
                    Redes Corporativas &amp; Cloud Computing.
                  </p>
                </div>

                <div className="github-banner-actions">
                  <a
                    className="btn-codex btn-codex--primary btn-compact"
                    href="https://github.com/joaoheliodev"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir Perfil GitHub ↗
                  </a>
                  <a
                    className="btn-codex btn-codex--ghost btn-compact"
                    href="https://github.com/joaoheliodev/joaoheliodev"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Profile README ↗
                  </a>
                </div>
              </div>

              {/* 4 Flagship Public Repositories with deep highlights */}
              <div className="repo-ledger-grid">
                {PUBLIC_REPOS.map((repo) => (
                  <article key={repo.name} className="repo-ledger-card">
                    <div className="repo-card-top">
                      <span className="repo-layer-tag">{repo.layer}</span>
                      <a
                        className="btn-inline-rule"
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        GitHub ↗
                      </a>
                    </div>
                    <h3 className="repo-card-title">{repo.name}</h3>
                    <div className="repo-card-stack">{repo.language}</div>
                    <p className="repo-card-summary">{repo.summary}</p>
                    <ul className="repo-card-highlights">
                      {repo.highlights.map((hl) => (
                        <li key={hl}>{hl}</li>
                      ))}
                    </ul>
                    <a className="btn-inline-rule" href={repo.labHref}>
                      Ir para laboratório interativo →
                    </a>
                  </article>
                ))}
              </div>
            </div>
          )}

          {archiveTab === 'skills' && (
            <div className="tabula-grid">
              <div className="tabula-ledger">
                <div className="ledger-rows">
                  {CAPABILITIES_LEDGER.map((item) => (
                    <div key={item.layer} className="ledger-row">
                      <div className="ledger-row-head">
                        <strong>{item.layer}</strong>
                        <em>{item.latin}</em>
                      </div>
                      <p>{item.tools}</p>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="academic-margin-folio">
                <p className="latin-incipit">Schola &amp; Collaboratio</p>
                <h3 className="academic-title">Ciência da Computação — UNIFEOB</h3>
                <p>
                  Formação em curso no Brasil com ênfase prática em arquitetura de computadores,
                  segurança ofensiva e defensiva, redes corporativas e sistemas distribuídos.
                </p>
                <div className="academic-project-note">
                  <div className="academic-sub">Colaboração Pública em POO / Backend</div>
                  <p>
                    <strong>AgroGestor — Caderno de Campo</strong> (Dart + MySQL), voltado ao
                    controle de insumos agrícolas em linha com o ODS 12.
                  </p>
                  <a
                    className="btn-inline-rule"
                    href="https://github.com/PI67feob/PI_2026_02"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    PI67feob / PI_2026_02 ↗
                  </a>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>

      <footer className="colophon" id="colophon">
        <svg
          className="colophon-torn-top"
          viewBox="0 0 1200 26"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,26 L1200,26 L1200,10 L1145,20 L1085,7 L1020,21 L955,9 L890,19 L825,6 L760,20 L695,8 L630,22 L565,9 L500,18 L435,7 L370,21 L305,8 L240,19 L175,6 L110,20 L45,9 L0,17 Z"
            fill="var(--band-backdrop)"
          />
        </svg>

        <div className="container colophon-two-col">
          <div className="colophon-card">
            <p className="latin-incipit">In Fine — Ad Maiorem Scientiae Gloriam</p>
            <h2 className="colophon-heading">Vamos trabalhar juntos</h2>
            <p className="colophon-copy">
              Disponível para oportunidades e projetos em Cibersegurança, Infraestrutura de Redes,
              Sistemas Embarcados e Engenharia Backend em Nuvem.
            </p>

            <div className="colophon-links">
              <a
                className="btn-codex btn-codex--primary btn-compact"
                href="https://github.com/joaoheliodev"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub @joaoheliodev ↗
              </a>

              <a
                className="btn-codex btn-codex--ghost btn-compact"
                href="https://www.linkedin.com/in/joao-helio-dos-reis-souza-982091238"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn ↗
              </a>
              <a
                className="btn-codex btn-codex--ghost btn-compact"
                href="mailto:joaohelio396@gmail.com"
              >
                joaohelio396@gmail.com
              </a>
            </div>
          </div>

          <div className="colophon-3d-window" aria-hidden="true" />
        </div>
      </footer>
    </>
  );
}
