import { useState } from 'react';
import { CISCO_NODES, type CiscoNodeKey } from '../data/codexData';

interface IosLog {
  id: number;
  text: string;
  level: 'ok' | 'warn';
}

export function SectionNetwork() {
  const [selectedNode, setSelectedNode] = useState<CiscoNodeKey>('sw1');
  const [failover, setFailover] = useState(false);
  const [activeTab, setActiveTab] = useState<'core' | 'scale' | 'acls'>('core');
  const [logs, setLogs] = useState<IosLog[]>([
    {
      id: 1,
      text: '[IOS] %HSRP-5-STATECHANGE: Vlan10..230 active on Switch1-3 (priority 110 preempt).',
      level: 'ok',
    },
  ]);

  const activeSpec = CISCO_NODES[selectedNode];

  const toggleFailover = () => {
    const next = !failover;
    setFailover(next);
    setLogs((prev) => [
      {
        id: Date.now(),
        text: next
          ? '[IOS] %LINEPROTO-5-UPDOWN: Switch1-3 down. %HSRP-5-STATECHANGE: Standby -> Active on Switch2-3!'
          : '[IOS] %HSRP-5-STATECHANGE: Switch1-3 preempted Active on 21 VLANs. Switch2-3 -> Standby.',
        level: next ? 'warn' : 'ok',
      },
      ...prev.slice(0, 4),
    ]);
  };

  return (
    <section className="chapter-band chapter-band--l3" id="pars-iii">
      <div className="container">
        {/* Full-width unfolded architectural blueprint plate */}
        <div className="blueprint-plate" aria-label="Prancha topológica Collapsed Core UNIFEOB">
          <div className="blueprint-header">
            <div>
              <span className="blueprint-caption">TABULA TOPOLOGICA · CAMPUS UNIFEOB</span>
              <span className="blueprint-scale">6 Prédios · 21 VLANs · ~389 Hosts · 54 APs</span>
            </div>
            <div className="blueprint-actions">
              <span className={`seal-state ${failover ? 'seal-state--warn' : 'seal-state--ok'}`}>
                {failover ? 'FAILOVER: SW2 ATIVO' : 'HSRP: SW1 ATIVO'}
              </span>
              <button
                type="button"
                className="btn-codex btn-codex--primary btn-compact"
                onClick={toggleFailover}
              >
                {failover ? 'Restaurar Switch1-3' : 'Simular Failover HSRP'}
              </button>
            </div>
          </div>

          <div className="topo-svg-wrap">
            <svg
              className="topo-svg"
              viewBox="0 0 640 250"
              fill="none"
              aria-label="Topologia Collapsed Core Cisco"
            >
              <line className="topo-link topo-link--active" x1="320" y1="38" x2="320" y2="62" />
              <line
                className={`topo-link ${failover ? 'topo-link--fault' : 'topo-link--active'}`}
                x1="286"
                y1="94"
                x2="178"
                y2="124"
              />
              <line
                className={`topo-link ${failover ? 'topo-link--active' : 'topo-link--standby'}`}
                x1="354"
                y1="94"
                x2="462"
                y2="124"
              />
              <line className="topo-link topo-link--active" x1="262" y1="145" x2="378" y2="145" />
              <line
                className={`topo-link ${failover ? 'topo-link--fault' : 'topo-link--active'}`}
                x1="156"
                y1="166"
                x2="156"
                y2="198"
              />
              <line
                className={`topo-link ${failover ? 'topo-link--active' : 'topo-link--standby'}`}
                x1="418"
                y1="166"
                x2="220"
                y2="198"
              />
              <line
                className={`topo-link ${failover ? 'topo-link--fault' : 'topo-link--active'}`}
                x1="224"
                y1="166"
                x2="424"
                y2="198"
              />
              <line
                className={`topo-link ${failover ? 'topo-link--active' : 'topo-link--standby'}`}
                x1="478"
                y1="166"
                x2="478"
                y2="198"
              />

              <g
                className={`topo-node ${selectedNode === 'isp' ? 'is-selected' : ''}`}
                onClick={() => setSelectedNode('isp')}
              >
                <rect
                  x="220"
                  y="10"
                  width="200"
                  height="28"
                  rx="10"
                  fill="var(--surface-folio)"
                  stroke="var(--border-strong)"
                />
                <text
                  x="320"
                  y="28"
                  textAnchor="middle"
                  fill="var(--ink)"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="10"
                >
                  ISP Cisco 2911 (8.8.8.1)
                </text>
              </g>

              <g
                className={`topo-node ${selectedNode === 'asa' ? 'is-selected' : ''}`}
                onClick={() => setSelectedNode('asa')}
              >
                <rect
                  x="166"
                  y="62"
                  width="308"
                  height="32"
                  rx="10"
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
                  fontSize="9.8"
                  fontWeight="600"
                >
                  Firewall Cisco ASA 5506-X (Stateful + PAT)
                </text>
              </g>

              <g
                className={`topo-node ${selectedNode === 'sw1' ? 'is-selected' : ''}`}
                onClick={() => setSelectedNode('sw1')}
              >
                <rect
                  x="68"
                  y="124"
                  width="194"
                  height="42"
                  rx="10"
                  fill="var(--surface-folio)"
                  stroke={failover ? 'var(--wax-bright)' : 'var(--gold-bright)'}
                  strokeWidth="1.5"
                />
                <text
                  x="165"
                  y="141"
                  textAnchor="middle"
                  fill="var(--ink)"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9.5"
                  fontWeight="600"
                >
                  Switch1-3 (Catalyst 3650)
                </text>
                <text
                  x="165"
                  y="157"
                  textAnchor="middle"
                  fill={failover ? 'var(--wax-bright)' : 'var(--ok)'}
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="8.5"
                >
                  {failover ? 'FALHA · ISOLADO' : 'ATIVO · Prio 110'}
                </text>
              </g>

              <g
                className={`topo-node ${selectedNode === 'sw2' ? 'is-selected' : ''}`}
                onClick={() => setSelectedNode('sw2')}
              >
                <rect
                  x="378"
                  y="124"
                  width="194"
                  height="42"
                  rx="10"
                  fill="var(--surface-folio)"
                  stroke={failover ? 'var(--gold-bright)' : 'var(--ink-subtle)'}
                  strokeWidth="1.5"
                />
                <text
                  x="475"
                  y="141"
                  textAnchor="middle"
                  fill="var(--ink)"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9.5"
                  fontWeight="600"
                >
                  Switch2-3 (Catalyst 3650)
                </text>
                <text
                  x="475"
                  y="157"
                  textAnchor="middle"
                  fill={failover ? 'var(--gold-bright)' : 'var(--ink-muted)'}
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="8.5"
                >
                  {failover ? 'ATIVO · FAILOVER' : 'STANDBY · Prio 100'}
                </text>
              </g>

              <g
                className={`topo-node ${selectedNode === 'swsrv' ? 'is-selected' : ''}`}
                onClick={() => setSelectedNode('swsrv')}
              >
                <rect
                  x="66"
                  y="198"
                  width="200"
                  height="42"
                  rx="10"
                  fill="var(--surface-folio)"
                  stroke="var(--border-strong)"
                />
                <text
                  x="166"
                  y="216"
                  textAnchor="middle"
                  fill="var(--ink)"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9.8"
                  fontWeight="600"
                >
                  SW L2 Servidores
                </text>
                <text
                  x="166"
                  y="231"
                  textAnchor="middle"
                  fill="var(--ink-muted)"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="8.5"
                >
                  VLAN 230 · DHCP 192.168.230.1
                </text>
              </g>

              <g
                className={`topo-node ${selectedNode === 'access' ? 'is-selected' : ''}`}
                onClick={() => setSelectedNode('access')}
              >
                <rect
                  x="356"
                  y="198"
                  width="224"
                  height="42"
                  rx="10"
                  fill="var(--surface-folio)"
                  stroke="var(--border-strong)"
                />
                <text
                  x="468"
                  y="216"
                  textAnchor="middle"
                  fill="var(--ink)"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9.8"
                  fontWeight="600"
                >
                  12× Acesso 2960 + 54 APs
                </text>
                <text
                  x="468"
                  y="231"
                  textAnchor="middle"
                  fill="var(--ink-muted)"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="8.5"
                >
                  Prédios A–F · 20 ACLs Inter-VLAN
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* Lower asymmetric notes with 3 deep tabs + inspector split */}
        <div className="network-lower-grid">
          <article className="editorial-column">
            <div className="chapter-marker">
              <span className="chapter-numeral">III</span>
              <div>
                <p className="latin-incipit">Duplex via, nulla mora · Cisco IOS</p>
                <h2 className="chapter-heading">Infraestrutura de Campus · UNIFEOB</h2>
              </div>
            </div>

            <div className="dossier-tabs" role="tablist" aria-label="Detalhes da rede campus">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'core'}
                className={`dossier-tab-btn ${activeTab === 'core' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('core')}
              >
                Collapsed Core
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'scale'}
                className={`dossier-tab-btn ${activeTab === 'scale' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('scale')}
              >
                Escala &amp; 6 Prédios
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'acls'}
                className={`dossier-tab-btn ${activeTab === 'acls' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('acls')}
              >
                VLSM &amp; 20 ACLs
              </button>
            </div>

            {activeTab === 'core' && (
              <div className="tab-panel">
                <p>
                  Topologia de núcleo colapsado unindo comutação L3 e distribuição em um par
                  redundante de <strong>Catalyst 3650-24PS</strong> com trunks 802.1Q e links
                  roteados independentes até o firewall <strong>Cisco ASA 5506-X</strong>.
                </p>
                <ul className="folio-list">
                  <li>
                    <strong>FHRP com HSRP:</strong> <code>Switch1-3</code> ativo (
                    <code>priority 110 preempt</code>) e <code>Switch2-3</code> standby (
                    <code>priority 100</code>), número de grupo idêntico ao ID da VLAN.
                  </li>
                  <li>
                    <strong>Dual-homing L2:</strong> 12 switches de acesso Catalyst 2960-24TT com
                    uplinks separados (<code>Gi0/1</code> e <code>Gi0/2</code>) + PVST+.
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
                        <th>Camada / Item</th>
                        <th>Ativos</th>
                        <th>Dimensionamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Prédios atendidos</td>
                        <td>A (Admin) + B, C, D, E, F</td>
                        <td>6 edifícios integrados</td>
                      </tr>
                      <tr>
                        <td>Borda &amp; ISP</td>
                        <td>Cisco 2911 + ASA 5506-X</td>
                        <td>Stateful + PAT (200.0.0.0/30)</td>
                      </tr>
                      <tr>
                        <td>Acesso &amp; Wi-Fi</td>
                        <td>12× 2960 + 1× Srv + 54 APs</td>
                        <td>~389 hosts · VLANs 70/80/100</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'acls' && (
              <div className="tab-panel">
                <p>
                  Sub-redes calculadas via <strong>VLSM</strong> no padrão mnemônico{' '}
                  <code>192.168.[VLAN_ID].0</code> (<code>/24</code> Wi-Fi até <code>/29</code>{' '}
                  admin) e <strong>20 ACLs estendidas</strong> aplicadas em <code>in</code> nas SVIs:
                </p>
                <ol className="folio-list">
                  <li>Liberação prioritária de DHCP Discover/Request na entrada.</li>
                  <li>Garantia de tráfego intra-VLAN e acesso ao gateway virtual SVI.</li>
                  <li>Permissão estrita apenas às matrizes interdepartamentais autorizadas.</li>
                </ol>
                <p>
                  Artefatos canônicos no repo: arquivos <code>.cfg</code>,{' '}
                  <code>acls_intervlan.txt</code>, <code>dhcp_scopes_reference.txt</code> e{' '}
                  <code>campus_network_v1.0.pkt</code>.
                </p>
              </div>
            )}

            <div className="editorial-actions">
              <a
                className="btn-inline-rule"
                href="https://github.com/joaoheliodev/infra_campus_feob"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver configurações e topologia no GitHub →
              </a>
            </div>
          </article>

          <div className="workbench-folio">
            <div className="node-inspector-box">
              <div className="node-inspector-role">{activeSpec.role}</div>
              <div className="node-inspector-title">{activeSpec.title}</div>
              <p className="node-inspector-detail">{activeSpec.detail}</p>
            </div>
            <div className="log-console" aria-label="Logs Cisco IOS">
              {logs.map((entry) => (
                <div key={entry.id} className={`log-line log-line--${entry.level}`}>
                  {entry.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
