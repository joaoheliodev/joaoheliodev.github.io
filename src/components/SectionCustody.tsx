import { useMemo, useState } from 'react';
import { CANONICAL_IOSEPHUS_EVENT, type IosephusEvent } from '../data/codexData';
import { sha256Hex } from '../utils/sha256';

export function SectionCustody() {
  const anchoredHash = useMemo(() => sha256Hex(JSON.stringify(CANONICAL_IOSEPHUS_EVENT)), []);
  const [currentEvent, setCurrentEvent] = useState<IosephusEvent>({ ...CANONICAL_IOSEPHUS_EVENT });
  const [checkedHash, setCheckedHash] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'polyglot' | 'rbac' | 'devops'>('polyglot');

  const verifyCustody = () => {
    setCheckedHash(sha256Hex(JSON.stringify(currentEvent)));
  };

  const simulateTamper = () => {
    const mutated: IosephusEvent = {
      ...CANONICAL_IOSEPHUS_EVENT,
      ip_origem: '10.20.0.99',
      event_id: 4625,
    };
    setCurrentEvent(mutated);
    setCheckedHash(sha256Hex(JSON.stringify(mutated)));
  };

  const restoreEvidence = () => {
    const clean = { ...CANONICAL_IOSEPHUS_EVENT };
    setCurrentEvent(clean);
    setCheckedHash(sha256Hex(JSON.stringify(clean)));
  };

  const isIntact = checkedHash !== null && checkedHash === anchoredHash;
  const isTampered = checkedHash !== null && checkedHash !== anchoredHash;

  return (
    <section className="chapter-band chapter-band--l7" id="pars-iv">
      <div className="container">
        <div className="custody-header-row">
          <div className="chapter-marker">
            <span className="chapter-numeral">IV</span>
            <div>
              <p className="latin-incipit">Verba volant, hash manet · SOC &amp; Cloud</p>
              <h2 className="chapter-heading">IOSEPHVS · custos datorum</h2>
            </div>
          </div>

          <blockquote className="codex-axiom">
            “MongoDB guarda o fato bruto; MySQL guarda a decisão. Os dois bancos se ligam apenas por{' '}
            <code>ObjectId</code> e hash <code>SHA-256</code>.”
          </blockquote>
        </div>

        {/* Open double-page Codex ledger spread */}
        <div className="double-page-spread" aria-label="Livro-razão poliglota do Iosephus">
          <div className="spread-page spread-page--left">
            <div className="spread-page-head">
              <span className="spread-latin">FACTVM CRVDVM · MONGODB 8.0</span>
              <code className="spread-objectid">ObjectId("6920f1a8c4e29b0014a91e07")</code>
            </div>
            <pre className="json-view">{JSON.stringify(currentEvent, null, 2)}</pre>
          </div>

          <div className="spread-spine" aria-hidden="true" />

          <div className="spread-page spread-page--right">
            <div className="spread-page-head">
              <span className="spread-latin">DECISIO SIGNATA · MYSQL 8.4</span>
              <span className="seal-state seal-state--critica">SLA CRÍTICA 15m/240m</span>
            </div>

            <div className="custody-anchor-block">
              <div className="anchor-meta-row">
                <span>Incidente</span>
                <code>INC-2026-0042 · Prefeitura de Vale Verde</code>
              </div>
              <div className="anchor-meta-row">
                <span>Ativo alvo</span>
                <code>SRV-ARQUIVOS (10.20.0.15) · CVE-2019-0708</code>
              </div>
              <div className="anchor-meta-row">
                <span>Hash registrado (COMMIT ACID)</span>
                <code className="anchor-hash">{anchoredHash}</code>
              </div>
            </div>

            <div className="workbench-controls">
              <button
                type="button"
                className="btn-codex btn-codex--primary btn-compact"
                onClick={verifyCustody}
              >
                Verificar SHA-256
              </button>
              <button
                type="button"
                className="btn-codex btn-codex--ghost btn-compact"
                onClick={simulateTamper}
              >
                Simular adulteração de log
              </button>
              <button
                type="button"
                className="btn-codex btn-codex--ghost btn-compact"
                onClick={restoreEvidence}
              >
                Restaurar evidência
              </button>
            </div>

            <div
              className={`custody-verdict ${
                isIntact
                  ? 'custody-verdict--ok'
                  : isTampered
                    ? 'custody-verdict--tamper'
                    : ''
              }`}
              role="status"
              aria-live="polite"
            >
              {checkedHash === null && (
                <span>
                  Clique em <strong>Verificar SHA-256</strong> para recalcular o digest da evidência
                  no MongoDB e confrontá-lo com a âncora ACID no MySQL.
                </span>
              )}
              {isIntact && (
                <div>
                  <strong>CUSTÓDIA ÍNTEGRA — SHA-256 CONFERE ✓</strong>
                  <div className="verdict-hashes">
                    Digest calculado: <code>{checkedHash.slice(0, 36)}…</code> coincide bit a bit.
                  </div>
                </div>
              )}
              {isTampered && (
                <div>
                  <strong>VIOLAÇÃO DETECTADA — HASH DIVERGENTE ✕</strong>
                  <div className="verdict-hashes">
                    Esperado (MySQL): <code>{anchoredHash.slice(0, 26)}…</code>
                    <br />
                    Calculado (Mongo): <code>{checkedHash.slice(0, 26)}…</code>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3-phase pipeline strip + rich technical tabs */}
        <div className="custody-deep-section">
          <div className="pipeline-strip" aria-label="Ordem estrita de consistência entre bancos">
            <div className="pipeline-step">
              <span className="pipeline-num">Fase I</span>
              <strong>COMMIT ACID no MySQL 8.4</strong>
              <span>Insere incidente, SLA, ativo, SHA-256 e auditoria</span>
            </div>
            <div className="pipeline-step">
              <span className="pipeline-num">Fase II</span>
              <strong>Pós-commit no MongoDB 8.0</strong>
              <span>Marca alerta PROMOVIDO + preservado: true (sem TTL)</span>
            </div>
            <div className="pipeline-step">
              <span className="pipeline-num">Fase III</span>
              <strong>Reconciliador 5 min</strong>
              <span>Retoma falhas parciais com UNIQUE(alerta_origem_id)</span>
            </div>
          </div>

          <div className="dossier-tabs" role="tablist" aria-label="Detalhes técnicos do Iosephus">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'polyglot'}
              className={`dossier-tab-btn ${activeTab === 'polyglot' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('polyglot')}
            >
              Consistência Poliglota
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'rbac'}
              className={`dossier-tab-btn ${activeTab === 'rbac' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('rbac')}
            >
              Segurança, RBAC &amp; SLA
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'devops'}
              className={`dossier-tab-btn ${activeTab === 'devops' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('devops')}
            >
              DevOps, CI &amp; AWS CDK
            </button>
          </div>

          {activeTab === 'polyglot' && (
            <div className="tab-panel">
              <p>
                Coletores (Winlogbeat, Syslog ou simulador de ataque) enviam eventos para{' '}
                <code>POST /api/eventos</code> autenticados via <code>X-API-Key</code>. O motor de
                correlação executa a cada 30 segundos, enriquece IoCs e aplica escrita em 3 fases
                para nunca deixar evidência órfã nem duplicar incidentes.
              </p>
            </div>
          )}

          {activeTab === 'rbac' && (
            <div className="tab-panel">
              <ul className="folio-list">
                <li>
                  <strong>Argon2 + RBAC granular:</strong> 5 perfis (<code>ADMIN</code>,{' '}
                  <code>ANALISTA_N1</code>, <code>ANALISTA_N2</code>, <code>GESTOR_CLIENTE</code>,{' '}
                  <code>SERVICO</code>) sobre 5 permissões auditadas.
                </li>
                <li>
                  <strong>SLA automático:</strong> <code>CRITICA (15m / 240m)</code>,{' '}
                  <code>ALTA (60m / 720m)</code>, <code>MEDIA (240m / 2880m)</code> e{' '}
                  <code>BAIXA (1440m / 10080m)</code>.
                </li>
                <li>
                  <strong>Cenário Vale Verde:</strong> detecção MITRE <code>T1110.001</code> (força
                  bruta RDP <code>4625</code> → logon <code>4624</code>) no host{' '}
                  <code>SRV-ARQUIVOS</code> exposto à <code>CVE-2019-0708</code> (CVSS 9.8).
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'devops' && (
            <div className="tab-panel">
              <ul className="folio-list">
                <li>
                  <strong>Containers &amp; CLI:</strong> <code>docker-compose.yml</code> completo
                  com inicialização de usuários, seeds e CLI administrativa via{' '}
                  <code>python -m app.cli</code>.
                </li>
                <li>
                  <strong>CI Automatizado:</strong> suítes <code>test_dominio.py</code>,{' '}
                  <code>test_fluxo.py</code> e <code>test_seguranca.py</code> executadas no{' '}
                  <strong>GitHub Actions</strong>.
                </li>
                <li>
                  <strong>Infraestrutura como Código:</strong> stack completa em{' '}
                  <strong>AWS CDK v2</strong> localizada em <code>infra/iosephus_infra/stack.py</code>.
                </li>
              </ul>
            </div>
          )}

          <div className="editorial-actions">
            <a
              className="btn-inline-rule"
              href="https://github.com/joaoheliodev/Iosephus"
              target="_blank"
              rel="noopener noreferrer"
            >
              Explorar Iosephus no GitHub →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
