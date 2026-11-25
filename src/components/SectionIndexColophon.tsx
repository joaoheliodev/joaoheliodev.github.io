import { useState } from 'react';
import { CAPABILITIES_LEDGER, PUBLIC_REPOS } from '../data/codexData';
import { FolioReveal } from './FolioReveal';

export function SectionIndexColophon() {
  const [archiveTab, setArchiveTab] = useState<'github' | 'skills'>('github');

  return (
    <>
      <section className="chapter-band chapter-band--tabula" id="github-archive">
        <FolioReveal className="container">
          <div className="archive-head-row">
            <div className="chapter-marker">
              <span className="chapter-numeral">V</span>
              <div>
                <p className="latin-incipit">Index codicum publicorum — Catálogo Geral</p>
                <h2 className="chapter-heading">Arquivo GitHub e Matriz de Engenharia</h2>
              </div>
            </div>

            <div className="dossier-tabs" role="tablist" aria-label="Vistas do arquivo técnico">
              <button
                type="button"
                role="tab"
                aria-selected={archiveTab === 'github'}
                className={`dossier-tab-btn ${archiveTab === 'github' ? 'is-active' : ''}`}
                onClick={() => setArchiveTab('github')}
              >
                <span className="tab-sec">§ 1</span> Códices Públicos (GitHub)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={archiveTab === 'skills'}
                className={`dossier-tab-btn ${archiveTab === 'skills' ? 'is-active' : ''}`}
                onClick={() => setArchiveTab('skills')}
              >
                <span className="tab-sec">§ 2</span> Camadas L1–L7 e UNIFEOB
              </button>
            </div>
          </div>

          {archiveTab === 'github' && (
            <div className="github-archive-panel">
              {/* Engraved Archival Masthead (Replaces generic SaaS profile banner card) */}
              <div className="archival-masthead">
                <div className="archival-masthead-copy">
                  <div className="archival-masthead-kicker">
                    <span>Acervo Verificado</span>
                    <span className="marginalia-stamp marginalia-stamp--ok">4 Repositórios Autorais</span>
                  </div>
                  <strong className="archival-handle">github.com/joaoheliodev</strong>
                  <p className="github-bio-line">
                    Ciência da Computação na UNIFEOB (São João da Boa Vista, SP). Código aberto com
                    foco em rastreabilidade forense, sistemas embarcados determinísticos, redes
                    corporativas e arquitetura em nuvem.
                  </p>
                </div>

                <div className="github-banner-actions">
                  <a
                    className="btn-codex btn-codex--primary btn-compact"
                    href="https://github.com/joaoheliodev"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visitar github.com/joaoheliodev
                  </a>
                  <a
                    className="btn-codex btn-codex--ghost btn-compact"
                    href="https://github.com/joaoheliodev/joaoheliodev"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver README de Perfil
                  </a>
                </div>
              </div>

              {/* Asymmetric Open Archival Ledger (Replaces 2x2 SaaS rounded card grid!) */}
              <div className="codex-index-ledger" role="list">
                {PUBLIC_REPOS.map((repo) => (
                  <article key={repo.name} className="codex-index-entry" role="listitem">
                    <div className="codex-entry-meta">
                      <div className="codex-entry-sig">
                        <span className="codex-entry-folio">{repo.folio}</span>
                        <span className="codex-entry-layer">{repo.layerCode}</span>
                      </div>
                      <h3 className="codex-entry-title">
                        <a href={repo.url} target="_blank" rel="noopener noreferrer">
                          {repo.name}
                        </a>
                      </h3>
                      <p className="codex-entry-domain">{repo.domain}</p>
                      <ul className="codex-stack-tags" aria-label="Tecnologias empregadas">
                        {repo.stackList.map((tech) => (
                          <li key={tech}>{tech}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="codex-entry-body">
                      <p className="repo-card-summary">{repo.summary}</p>
                      <ul className="repo-card-highlights">
                        {repo.highlights.map((hl) => (
                          <li key={hl}>{hl}</li>
                        ))}
                      </ul>
                      <div className="codex-entry-links">
                        <a
                          className="editorial-link"
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Repositório no GitHub
                        </a>
                        <a className="editorial-link" href={repo.labHref}>
                          {repo.labLabel}
                        </a>
                      </div>
                    </div>
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
                        <strong>
                          <span className="ledger-folio-num">{item.folio}.</span> {item.layer}
                        </strong>
                        <em>{item.latin}</em>
                      </div>
                      <p>{item.tools}</p>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="academic-margin-folio">
                <p className="latin-incipit">Schola et Collaboratio</p>
                <h3 className="academic-title">Ciência da Computação — UNIFEOB</h3>
                <p>
                  Graduação em andamento com prática intensiva em arquitetura de computadores,
                  segurança defensiva e análise estática, infraestrutura Cisco e engenharia de
                  software distribuída.
                </p>
                <div className="academic-project-note">
                  <div className="academic-sub">Colaboração Acadêmica em POO e Banco Relacional</div>
                  <p>
                    <strong>AgroGestor — Caderno de Campo</strong> (Dart e MySQL), sistema voltado à
                    rastreabilidade de insumos agrícolas alinhado ao ODS 12.
                  </p>
                  <a
                    className="editorial-link"
                    href="https://github.com/PI67feob/PI_2026_02"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Repositório PI67feob/PI_2026_02
                  </a>
                </div>
              </aside>
            </div>
          )}
        </FolioReveal>
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
            <p className="latin-incipit">Explicit Codex Custodis — Ad Maiorem Scientiae Gloriam</p>
            <h2 className="colophon-heading">Contato Direto e Cooperação Técnica</h2>
            <p className="colophon-copy">
              Aberto a oportunidades de estágio, posições júnior e projetos em Cibersegurança,
              Engenharia Backend, Redes Corporativas e Sistemas Embarcados.
            </p>

            <div className="colophon-contact-ledger">
              <div className="colophon-contact-row">
                <span className="colophon-contact-key">GitHub</span>
                <a
                  className="editorial-link"
                  href="https://github.com/joaoheliodev"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  github.com/joaoheliodev
                </a>
              </div>
              <div className="colophon-contact-row">
                <span className="colophon-contact-key">LinkedIn</span>
                <a
                  className="editorial-link"
                  href="https://www.linkedin.com/in/joao-helio-dos-reis-souza-982091238"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  in/joao-helio-dos-reis-souza-982091238
                </a>
              </div>
              <div className="colophon-contact-row">
                <span className="colophon-contact-key">Correio</span>
                <a className="editorial-link" href="mailto:joaohelio396@gmail.com">
                  joaohelio396@gmail.com
                </a>
              </div>
            </div>

            <div className="colophon-links">
              <a
                className="btn-codex btn-codex--primary btn-compact"
                href="mailto:joaohelio396@gmail.com"
              >
                Escrever e-mail
              </a>
              <a
                className="btn-codex btn-codex--ghost btn-compact"
                href="https://www.linkedin.com/in/joao-helio-dos-reis-souza-982091238"
                target="_blank"
                rel="noopener noreferrer"
              >
                Conectar no LinkedIn
              </a>
            </div>
          </div>

          <div className="colophon-3d-window" aria-hidden="true" />
        </div>
      </footer>
    </>
  );
}
