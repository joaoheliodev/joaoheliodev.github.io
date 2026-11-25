import { useMemo, useState } from 'react';
import { CANONICAL_IOSEPHUS_EVENT, type IosephusEvent } from '../data/codexData';
import { sha256Hex } from '../utils/sha256';
import { FolioReveal } from './FolioReveal';

type PipelineMode = 'synced' | 'partial_fault' | 'reconciled';

export function SectionCustody() {
  const anchoredHash = useMemo(() => sha256Hex(JSON.stringify(CANONICAL_IOSEPHUS_EVENT)), []);
  const [currentEvent, setCurrentEvent] = useState<IosephusEvent>({ ...CANONICAL_IOSEPHUS_EVENT });
  const [checkedHash, setCheckedHash] = useState<string | null>(null);
  const [pipelineMode, setPipelineMode] = useState<PipelineMode>('synced');
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
    setPipelineMode('synced');
    setCheckedHash(sha256Hex(JSON.stringify(clean)));
  };

  const triggerPartialFault = () => {
    const unpromoted: IosephusEvent = {
      ...CANONICAL_IOSEPHUS_EVENT,
      preservado: false,
    };
    setCurrentEvent(unpromoted);
    setPipelineMode('partial_fault');
    setCheckedHash(null);
  };

  const runReconciler = () => {
    const healed = { ...CANONICAL_IOSEPHUS_EVENT, preservado: true };
    setCurrentEvent(healed);
    setPipelineMode('reconciled');
    setCheckedHash(sha256Hex(JSON.stringify(healed)));
  };

  const isIntact = checkedHash !== null && checkedHash === anchoredHash;
  const isTampered = checkedHash !== null && checkedHash !== anchoredHash;

  return (
    <section className="chapter-band chapter-band--l7" id="pars-iv">
      <FolioReveal className="container">
        <div className="custody-header-row">
          <div className="chapter-marker">
            <span className="chapter-numeral">IV</span>
            <div>
              <p className="latin-incipit">Verba volant, hash manet — Operações de Segurança e Nuvem</p>
              <h2 className="chapter-heading">Iosephus — Custos Datorum</h2>
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
              <span className="spread-latin">Fólio Verso — Factum Crudum (MongoDB 8.0)</span>
              <code className="spread-objectid">ObjectId("6920f1a8c4e29b0014a91e07")</code>
            </div>
            <pre className="json-view">{JSON.stringify(currentEvent, null, 2)}</pre>
          </div>

          <div className="spread-spine" aria-hidden="true" />

          <div className="spread-page spread-page--right">
            <div className="spread-page-head">
              <span className="spread-latin">Fólio Recto — Decisio Signata (MySQL 8.4)</span>
              <span className="marginalia-stamp marginalia-stamp--critica">
                SLA Crítica: 15 min / 240 min
              </span>
            </div>

            <div className="custody-anchor-block">
              <div className="anchor-meta-row">
                <span>Incidente registrado</span>
                <code>INC-2026-0042 — Prefeitura de Vale Verde</code>
              </div>
              <div className="anchor-meta-row">
                <span>Ativo monitorado</span>
                <code>SRV-ARQUIVOS (10.20.0.15) — CVE-2019-0708</code>
              </div>
              <div className="anchor-meta-row">
                <span>Âncora imutável (COMMIT ACID + UNIQUE alerta_origem_id)</span>
                <code className="anchor-hash">{anchoredHash}</code>
              </div>
            </div>

            <div className="workbench-controls">
              <button
                type="button"
                className="btn-codex btn-codex--primary btn-compact"
                onClick={verifyCustody}
              >
                Conferir SHA-256
              </button>
              <button
                type="button"
                className="btn-codex btn-codex--ghost btn-compact"
                onClick={simulateTamper}
              >
                Adulterar documento Mongo
              </button>
              <button
                type="button"
                className="btn-codex btn-codex--ghost btn-compact"
                onClick={restoreEvidence}
              >
                Restaurar canônico
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
              {checkedHash === null && pipelineMode === 'partial_fault' && (
                <span>
                  <strong>Falha parcial entre bancos simulada:</strong> o incidente já sofreu{' '}
                  <code>COMMIT</code> no MySQL 8.4, porém o documento no MongoDB ficou com{' '}
                  <code>preservado: false</code>. Acione o <strong>Reconciliador de 5 min</strong>{' '}
                  abaixo.
                </span>
              )}
              {checkedHash === null && pipelineMode !== 'partial_fault' && (
                <span>
                  Acione <strong>Conferir SHA-256</strong> para recalcular o digest da evidência em
                  tempo real e confrontá-lo com o registro transacional do MySQL.
                </span>
              )}
              {isIntact && (
                <div>
                  <strong>
                    {pipelineMode === 'reconciled'
                      ? 'Reconciliação idempotente concluída — Cadeia SHA-256 íntegra'
                      : 'Custódia íntegra — Digest SHA-256 idêntico bit a bit'}
                  </strong>
                  <div className="verdict-hashes">
                    Calculado: <code>{checkedHash.slice(0, 38)}…</code>
                  </div>
                </div>
              )}
              {isTampered && (
                <div>
                  <strong>Violação de custódia detectada — Divergência criptográfica</strong>
                  <div className="verdict-hashes">
                    Âncora MySQL: <code>{anchoredHash.slice(0, 26)}…</code>
                    <br />
                    Lido no Mongo: <code>{checkedHash.slice(0, 26)}…</code>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interactive 3-Phase Consistency Ledger + Deep Technical Tabs */}
        <div className="custody-deep-section">
          <div className="reconciler-ledger" aria-label="Protocolo de escrita poliglota em 3 fases">
            <div className="reconciler-head">
              <span className="workbench-name">
                Protocolo de Consistência em Três Fases e Reconciliação Idempotente
              </span>
              <div className="reconciler-actions">
                <button
                  type="button"
                  className="btn-codex btn-codex--ghost btn-compact"
                  onClick={triggerPartialFault}
                >
                  Simular queda pós-MySQL
                </button>
                <button
                  type="button"
                  className="btn-codex btn-codex--primary btn-compact"
                  onClick={runReconciler}
                >
                  Rodar Reconciliador (5 min)
                </button>
              </div>
            </div>

            <div className="pipeline-strip">
              <div className="pipeline-step is-complete">
                <span className="pipeline-num">Fase I — Relacional</span>
                <strong>COMMIT ACID no MySQL 8.4</strong>
                <span>
                  Grava incidente, cálculo de SLA, ativo, hash SHA-256 e trilha de auditoria sob{' '}
                  <code>UNIQUE(alerta_origem_id)</code>.
                </span>
              </div>
              <div
                className={`pipeline-step ${
                  pipelineMode === 'partial_fault' ? 'is-fault' : 'is-complete'
                }`}
              >
                <span className="pipeline-num">Fase II — Documento</span>
                <strong>
                  {pipelineMode === 'partial_fault'
                    ? 'Interrompida antes do update!'
                    : 'Promoção no MongoDB 8.0'}
                </strong>
                <span>
                  {pipelineMode === 'partial_fault'
                    ? 'Alerta permaneceu pendente (preservado: false) após queda de rede pós-commit.'
                    : 'Marca alerta como PROMOVIDO e aplica preservado: true para bloquear expiração TTL.'}
                </span>
              </div>
              <div
                className={`pipeline-step ${
                  pipelineMode === 'reconciled' ? 'is-healed' : ''
                }`}
              >
                <span className="pipeline-num">Fase III — Curadoria</span>
                <strong>Reconciliador a cada 5 min</strong>
                <span>
                  {pipelineMode === 'reconciled'
                    ? 'Recuperou o estado no MongoDB sem duplicar o incidente graças à chave única!'
                    : 'Varre alertas pendentes e reaplica a Fase II com idempotência garantida.'}
                </span>
              </div>
            </div>
          </div>

          <div className="dossier-tabs" role="tablist" aria-label="Seções técnicas do Iosephus">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'polyglot'}
              className={`dossier-tab-btn ${activeTab === 'polyglot' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('polyglot')}
            >
              <span className="tab-sec">§ 1</span> Ingestão e Correlação
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'rbac'}
              className={`dossier-tab-btn ${activeTab === 'rbac' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('rbac')}
            >
              <span className="tab-sec">§ 2</span> Argon2, RBAC e SLA
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'devops'}
              className={`dossier-tab-btn ${activeTab === 'devops' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('devops')}
            >
              <span className="tab-sec">§ 3</span> Testes, Docker e AWS CDK
            </button>
          </div>

          {activeTab === 'polyglot' && (
            <div className="tab-panel">
              <p>
                Agentes Winlogbeat, Syslog ou simuladores entregam telemetria em{' '}
                <code>POST /api/eventos</code> autenticados por <code>X-API-Key</code>. O motor de
                correlação avalia janelas a cada 30 segundos, cruza indicadores e executa o
                protocolo em três fases para jamais deixar evidência órfã nem duplicar chamados.
              </p>
            </div>
          )}

          {activeTab === 'rbac' && (
            <div className="tab-panel">
              <ul className="folio-list">
                <li>
                  <strong>Credenciais Argon2 e 5 papéis RBAC:</strong> <code>ADMIN</code>,{' '}
                  <code>ANALISTA_N1</code>, <code>ANALISTA_N2</code>, <code>GESTOR_CLIENTE</code> e{' '}
                  <code>SERVICO</code> governando cinco permissões granulares auditadas.
                </li>
                <li>
                  <strong>Tabela de SLA por severidade:</strong> <code>CRITICA (15m / 240m)</code>,{' '}
                  <code>ALTA (60m / 720m)</code>, <code>MEDIA (240m / 2880m)</code> e{' '}
                  <code>BAIXA (1440m / 10080m)</code>.
                </li>
                <li>
                  <strong>Caso Prefeitura de Vale Verde:</strong> correlação MITRE{' '}
                  <code>T1110.001</code> (sequência de falhas RDP <code>4625</code> seguida de logon{' '}
                  <code>4624</code>) sobre <code>SRV-ARQUIVOS</code> vulnerável à{' '}
                  <code>CVE-2019-0708</code> (CVSS 9.8).
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'devops' && (
            <div className="tab-panel">
              <ul className="folio-list">
                <li>
                  <strong>Ambiente completo em containers:</strong> <code>docker-compose.yml</code>{' '}
                  orquestra bancos, carga de seeds e utilitário administrativo{' '}
                  <code>python -m app.cli</code>.
                </li>
                <li>
                  <strong>Integração contínua:</strong> baterias <code>test_dominio.py</code>,{' '}
                  <code>test_fluxo.py</code> e <code>test_seguranca.py</code> validadas a cada push
                  no <strong>GitHub Actions</strong>.
                </li>
                <li>
                  <strong>Infraestrutura como Código:</strong> topologia de nuvem declarada em{' '}
                  <strong>AWS CDK v2</strong> dentro de <code>infra/iosephus_infra/stack.py</code>.
                </li>
              </ul>
            </div>
          )}

          <div className="editorial-actions">
            <a
              className="editorial-link"
              href="https://github.com/joaoheliodev/Iosephus"
              target="_blank"
              rel="noopener noreferrer"
            >
              Auditar repositório completo em github.com/joaoheliodev/Iosephus
            </a>
          </div>
        </div>
      </FolioReveal>
    </section>
  );
}
