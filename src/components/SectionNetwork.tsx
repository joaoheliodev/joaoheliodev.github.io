import { useState } from 'react';
import { CAMPUS_VLAN_SLICES, CISCO_NODES, type CiscoNodeKey } from '../data/codexData';
import { FolioReveal } from './FolioReveal';

interface IosLog {
  id: number;
  text: string;
  level: 'ok' | 'warn';
}

export function SectionNetwork() {
  const [selectedNode, setSelectedNode] = useState<CiscoNodeKey>('sw1');
  const [failover, setFailover] = useState(false);
  const [activeTab, setActiveTab] = useState<'core' | 'scale' | 'acls'>('core');
  const [selectedSliceId, setSelectedSliceId] = useState<string>(CAMPUS_VLAN_SLICES[0].id);
  const [logs, setLogs] = useState<IosLog[]>([
    {
      id: 1,
      text: '[IOS] %HSRP-5-STATECHANGE: Vlan10..230 Active em Switch1-3 (prio 110 preempt, Gi1/0/13 up).',
      level: 'ok',
    },
  ]);

  const activeSpec = CISCO_NODES[selectedNode];
  const activeSlice =
    CAMPUS_VLAN_SLICES.find((s) => s.id === selectedSliceId) ?? CAMPUS_VLAN_SLICES[0];

  const toggleFailover = () => {
    const next = !failover;
    setFailover(next);
    setSelectedNode(next ? 'sw2' : 'sw1');
    setLogs((prev) => [
      {
        id: Date.now(),
        text: next
          ? '[IOS] %LINEPROTO-5-UPDOWN: Switch1-3 isolado. %HSRP-5-STATECHANGE: Switch2-3 assumiu 21 SVIs!'
          : '[IOS] %HSRP-5-STATECHANGE: Switch1-3 retomou Active (preempt) nas 21 VLANs; Switch2-3 em Standby.',
        level: next ? 'warn' : 'ok',
      },
      ...prev.slice(0, 4),
    ]);
  };

  return (
    <section className="chapter-band chapter-band--l3" id="pars-iii">
      <FolioReveal className="container">
        <div className="blueprint-plate" aria-label="Prancha topológica Collapsed Core UNIFEOB">
          <div className="blueprint-header">
            <div>
              <span className="blueprint-caption">Prancha Topológica — Campus Universitário UNIFEOB</span>
              <span className="blueprint-scale">
                6 edifícios integrados, 21 VLANs em VLSM, ~389 estações e 54 APs corporativos
              </span>
            </div>
            <div className="blueprint-actions">
              <span
                className={`marginalia-stamp ${
                  failover ? 'marginalia-stamp--warn' : 'marginalia-stamp--ok'
                }`}
              >
                {failover ? 'Contingência: Switch2-3 Ativo' : 'Nominal: Switch1-3 Ativo'}
              </span>
              <button
                type="button"
                className="btn-codex btn-codex--primary btn-compact"
                onClick={toggleFailover}
              >
                {failover ? 'Restaurar Switch1-3 (Preempt)' : 'Simular Queda do Switch1-3'}
              </button>
            </div>
          </div>

          <div className="topo-svg-wrap">
            <svg
              className="topo-svg"
              viewBox="0 0 640 256"
              fill="none"
              aria-label="Topologia Collapsed Core Cisco clicável"
            >
              {/* WAN & Core Trunks */}
              <line className="topo-link topo-link--active topo-link--flow" x1="320" y1="38" x2="320" y2="62" />
              <line
                className={`topo-link ${
                  failover ? 'topo-link--fault' : 'topo-link--active topo-link--flow'
                }`}
                x1="286"
                y1="94"
                x2="178"
                y2="126"
              />
              <line
                className={`topo-link ${
                  failover ? 'topo-link--active topo-link--flow' : 'topo-link--standby'
                }`}
                x1="354"
                y1="94"
                x2="462"
                y2="126"
              />
              {/* Dedicated 802.1Q HSRP Peering Trunk Gi1/0/13 */}
              <line className="topo-link topo-link--active" x1="262" y1="147" x2="378" y2="147" />
              <text
                x="320"
                y="141"
                textAnchor="middle"
                fill="var(--ink-muted)"
                fontFamily="JetBrains Mono, monospace"
                fontSize="7.8"
              >
                Gi1/0/13 (802.1Q)
              </text>

              {/* Access & Server Dual-Homing Uplinks */}
              <line
                className={`topo-link ${
                  failover ? 'topo-link--fault' : 'topo-link--active topo-link--flow'
                }`}
                x1="156"
                y1="168"
                x2="156"
                y2="202"
              />
              <line
                className={`topo-link ${
                  failover ? 'topo-link--active topo-link--flow' : 'topo-link--standby'
                }`}
                x1="418"
                y1="168"
                x2="220"
                y2="202"
              />
              <line
                className={`topo-link ${
                  failover ? 'topo-link--fault' : 'topo-link--active topo-link--flow'
                }`}
                x1="224"
                y1="168"
                x2="424"
                y2="202"
              />
              <line
                className={`topo-link ${
                  failover ? 'topo-link--active topo-link--flow' : 'topo-link--standby'
                }`}
                x1="478"
                y1="168"
                x2="478"
                y2="202"
              />

              <g
                className={`topo-node ${selectedNode === 'isp' ? 'is-selected' : ''}`}
                onClick={() => setSelectedNode('isp')}
              >
                <rect
                  x="216"
                  y="10"
                  width="208"
                  height="28"
                  rx="4"
                  fill="var(--surface-folio)"
                  stroke="var(--border-strong)"
                />
                <text
                  x="320"
                  y="28"
                  textAnchor="middle"
                  fill="var(--ink)"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9.8"
                >
                  ISP Cisco 2911 (8.8.8.1/24)
                </text>
              </g>

              <g
                className={`topo-node ${selectedNode === 'asa' ? 'is-selected' : ''}`}
                onClick={() => setSelectedNode('asa')}
              >
                <rect
                  x="162"
                  y="62"
                  width="316"
                  height="32"
                  rx="4"
                  fill="var(--surface-folio)"
                  stroke="var(--wax-bright)"
                  strokeWidth="1.4"
                />
                <text
                  x="320"
                  y="82"
                  textAnchor="middle"
                  fill="var(--ink)"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9.6"
                  fontWeight="600"
                >
                  Firewall Cisco ASA 5506-X (Stateful / PAT)
                </text>
              </g>

              <g
                className={`topo-node ${selectedNode === 'sw1' ? 'is-selected' : ''}`}
                onClick={() => setSelectedNode('sw1')}
              >
                <rect
                  x="68"
                  y="126"
                  width="194"
                  height="42"
                  rx="4"
                  fill="var(--surface-folio)"
                  stroke={failover ? 'var(--wax-bright)' : 'var(--gold-bright)'}
                  strokeWidth="1.5"
                />
                <text
                  x="165"
                  y="143"
                  textAnchor="middle"
                  fill="var(--ink)"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9.4"
                  fontWeight="600"
                >
                  Switch1-3 (Catalyst 3650)
                </text>
                <text
                  x="165"
                  y="159"
                  textAnchor="middle"
                  fill={failover ? 'var(--wax-bright)' : 'var(--ok)'}
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="8.4"
                >
                  {failover ? 'Isolado (Link Down)' : 'Active — Prio 110 Preempt'}
                </text>
              </g>

              <g
                className={`topo-node ${selectedNode === 'sw2' ? 'is-selected' : ''}`}
                onClick={() => setSelectedNode('sw2')}
              >
                <rect
                  x="378"
                  y="126"
                  width="194"
                  height="42"
                  rx="4"
                  fill="var(--surface-folio)"
                  stroke={failover ? 'var(--gold-bright)' : 'var(--ink-subtle)'}
                  strokeWidth="1.5"
                />
                <text
                  x="475"
                  y="143"
                  textAnchor="middle"
                  fill="var(--ink)"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9.4"
                  fontWeight="600"
                >
                  Switch2-3 (Catalyst 3650)
                </text>
                <text
                  x="475"
                  y="159"
                  textAnchor="middle"
                  fill={failover ? 'var(--gold-bright)' : 'var(--ink-muted)'}
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="8.4"
                >
                  {failover ? 'Active — Assumiu 21 SVIs' : 'Standby — Prio 100'}
                </text>
              </g>

              <g
                className={`topo-node ${selectedNode === 'swsrv' ? 'is-selected' : ''}`}
                onClick={() => setSelectedNode('swsrv')}
              >
                <rect
                  x="66"
                  y="202"
                  width="200"
                  height="42"
                  rx="4"
                  fill="var(--surface-folio)"
                  stroke="var(--border-strong)"
                />
                <text
                  x="166"
                  y="220"
                  textAnchor="middle"
                  fill="var(--ink)"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9.6"
                  fontWeight="600"
                >
                  SW L2 Servidores (2960)
                </text>
                <text
                  x="166"
                  y="235"
                  textAnchor="middle"
                  fill="var(--ink-muted)"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="8.3"
                >
                  VLAN 230 — DHCP 192.168.230.1
                </text>
              </g>

              <g
                className={`topo-node ${selectedNode === 'access' ? 'is-selected' : ''}`}
                onClick={() => setSelectedNode('access')}
              >
                <rect
                  x="356"
                  y="202"
                  width="224"
                  height="42"
                  rx="4"
                  fill="var(--surface-folio)"
                  stroke="var(--border-strong)"
                />
                <text
                  x="468"
                  y="220"
                  textAnchor="middle"
                  fill="var(--ink)"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9.6"
                  fontWeight="600"
                >
                  12× Catalyst 2960 + 54 APs
                </text>
                <text
                  x="468"
                  y="235"
                  textAnchor="middle"
                  fill="var(--ink-muted)"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="8.3"
                >
                  Prédios A–F (Gi0/1 + Gi0/2)
                </text>
              </g>
            </svg>
          </div>
        </div>

        <div className="network-lower-grid">
          <article className="editorial-column">
            <div className="chapter-marker">
              <span className="chapter-numeral">III</span>
              <div>
                <p className="latin-incipit">Duplex via, nulla mora — Redes e Perímetro Cisco</p>
                <h2 className="chapter-heading">Infraestrutura de Campus UNIFEOB</h2>
              </div>
            </div>

            <div className="dossier-tabs" role="tablist" aria-label="Seções da rede de campus">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'core'}
                className={`dossier-tab-btn ${activeTab === 'core' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('core')}
              >
                <span className="tab-sec">§ 1</span> Núcleo Colapsado
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'scale'}
                className={`dossier-tab-btn ${activeTab === 'scale' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('scale')}
              >
                <span className="tab-sec">§ 2</span> 6 Edifícios
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'acls'}
                className={`dossier-tab-btn ${activeTab === 'acls' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('acls')}
              >
                <span className="tab-sec">§ 3</span> VLSM e 20 ACLs
              </button>
            </div>

            {activeTab === 'core' && (
              <div className="tab-panel">
                <p>
                  Arquitetura em núcleo colapsado unificando distribuição e roteamento inter-VLAN em
                  um par redundante <strong>Catalyst 3650-24PS</strong>, interligado por enlaces
                  ponto a ponto independentes ao firewall <strong>Cisco ASA 5506-X</strong>.
                </p>
                <ul className="folio-list">
                  <li>
                    <strong>Continuidade com HSRP:</strong> <code>Switch1-3</code> opera ativo (
                    <code>priority 110 preempt</code>) e <code>Switch2-3</code> em prontidão (
                    <code>priority 100</code>), mantendo numeração de grupo idêntica ao ID de cada
                    uma das 21 VLANs.
                  </li>
                  <li>
                    <strong>Acesso em dual-homing:</strong> 12 switches Catalyst 2960-24TT sobem por
                    caminhos físicos distintos (<code>Gi0/1</code> e <code>Gi0/2</code>) alinhados
                    via PVST+.
                  </li>
                </ul>
              </div>
            )}

            {activeTab === 'scale' && (
              <div className="tab-panel">
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Segmento</th>
                        <th>Equipamentos</th>
                        <th>Capacidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Blocos prediais</td>
                        <td>Edifício A (Admin) e B a F</td>
                        <td>6 prédios universitários</td>
                      </tr>
                      <tr>
                        <td>Perímetro e WAN</td>
                        <td>Cisco 2911 ISR + ASA 5506-X</td>
                        <td>Stateful + PAT (200.0.0.0/30)</td>
                      </tr>
                      <tr>
                        <td>Acesso e Sem Fio</td>
                        <td>12× 2960 + 1× Srv + 54 APs</td>
                        <td>~389 estações (VLANs 70/80/100)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'acls' && (
              <div className="tab-panel">
                <p>
                  Endereçamento dimensionado com <strong>VLSM</strong> sobre o esquema mnemônico{' '}
                  <code>192.168.[VLAN_ID].0</code> (de máscaras <code>/24</code> para Wi-Fi até{' '}
                  <code>/29</code> em salas administrativas) e <strong>20 ACLs estendidas</strong>{' '}
                  aplicadas na entrada (<code>in</code>) das SVIs:
                </p>
                <ol className="folio-list">
                  <li>Passagem prioritária para quadros DHCP Discover e Request rumo à VLAN 230.</li>
                  <li>Tráfego local intra-VLAN e gerência do próprio gateway virtual SVI.</li>
                  <li>Liberação restrita às matrizes interdepartamentais formalmente permitidas.</li>
                </ol>
                <p>
                  Entregáveis no repositório: configurações <code>.cfg</code> por equipamento,{' '}
                  <code>acls_intervlan.txt</code>, <code>dhcp_scopes_reference.txt</code> e arquivo{' '}
                  <code>campus_network_v1.0.pkt</code>.
                </p>
              </div>
            )}

            <div className="editorial-actions">
              <a
                className="editorial-link"
                href="https://github.com/joaoheliodev/infra_campus_feob"
                target="_blank"
                rel="noopener noreferrer"
              >
                Examinar scripts .cfg e topologia em github.com/joaoheliodev/infra_campus_feob
              </a>
            </div>
          </article>

          <div className="workbench-folio">
            <div className="workbench-head">
              <span className="workbench-name">Instrumentum III — Ativo Selecionado e Plano VLSM</span>
              <span className="marginalia-stamp">Clique nos nós da prancha</span>
            </div>

            <div className="node-inspector-box">
              <div className="node-inspector-role">{activeSpec.role}</div>
              <div className="node-inspector-title">{activeSpec.title}</div>
              <code className="node-inspector-ifaces">{activeSpec.interfaces}</code>
              <p className="node-inspector-detail">{activeSpec.detail}</p>
            </div>

            <div className="vlsm-slice-box">
              <span className="vlsm-box-title">Recortes VLSM e Política Inbound SVI:</span>
              <div className="vlsm-slice-tabs">
                {CAMPUS_VLAN_SLICES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`vlsm-slice-btn ${s.id === activeSlice.id ? 'is-active' : ''}`}
                    onClick={() => setSelectedSliceId(s.id)}
                  >
                    {s.label.split('—')[0].trim()}
                  </button>
                ))}
              </div>
              <div className="vlsm-slice-body">
                <code>{activeSlice.subnet}</code>
                <p>{activeSlice.scope}</p>
                <p className="vlsm-acl-line">
                  <strong>ACL SVI:</strong> {activeSlice.aclPolicy}
                </p>
              </div>
            </div>

            <div className="log-console" aria-label="Console Cisco IOS">
              {logs.map((entry) => (
                <div key={entry.id} className={`log-line log-line--${entry.level}`}>
                  {entry.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </FolioReveal>
    </section>
  );
}
