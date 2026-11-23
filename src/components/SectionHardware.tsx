import { useState } from 'react';
import { ESP32_MILESTONES } from '../data/codexData';

const TOTAL_VAGAS = 12;
const COOLDOWN_MS = 1200;

interface LogEntry {
  id: number;
  text: string;
  level: 'ok' | 'warn' | 'crit' | 'info';
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function SectionHardware() {
  const [vagasLivres, setVagasLivres] = useState(8);
  const [lastTrigger, setLastTrigger] = useState(0);
  const [packetSeq, setPacketSeq] = useState(42);
  const [fsmState, setFsmState] = useState<'IDLE' | 'GATE_IN' | 'GATE_OUT' | 'COOLDOWN'>('IDLE');
  const [activeTab, setActiveTab] = useState<'arch' | 'pins' | 'timeline'>('arch');
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 2,
      text: '[MQTT] topic="estacionamento/vagas" payload={"livres":8,"ocupadas":4,"tls":"1.3"}',
      level: 'info',
    },
    {
      id: 1,
      text: '[BOOT] ESP32 DevKit V1 · Anti-crosstalk e cooldown (1.2s) prontos.',
      level: 'ok',
    },
  ]);

  const pushLog = (text: string, level: LogEntry['level']) => {
    setLogs((prev) => [{ id: Date.now() + Math.random(), text, level }, ...prev].slice(0, 6));
  };

  const triggerSensor = (direction: 'ENTRADA' | 'SAIDA') => {
    const now = Date.now();
    if (now - lastTrigger < COOLDOWN_MS) {
      setFsmState('COOLDOWN');
      pushLog(
        `[DEBOUNCE] Pulso ${direction} descartado: cooldown físico anti-crosstalk ativo (1.2s).`,
        'warn'
      );
      window.setTimeout(() => setFsmState('IDLE'), 650);
      return;
    }

    setLastTrigger(now);
    setFsmState(direction === 'ENTRADA' ? 'GATE_IN' : 'GATE_OUT');
    window.setTimeout(() => setFsmState('IDLE'), 650);

    if (direction === 'ENTRADA') {
      if (vagasLivres <= 0) {
        pushLog('[STATE] Pátio lotado (00/12 livres). Entrada recusada.', 'crit');
        return;
      }
      const next = vagasLivres - 1;
      const nextSeq = packetSeq + 1;
      setVagasLivres(next);
      setPacketSeq(nextSeq);
      pushLog(
        `[MQTT #${nextSeq}] payload={"livres":${next},"ocupadas":${TOTAL_VAGAS - next},"evento":"ENTRADA","tls":"1.3"}`,
        'ok'
      );
    } else {
      if (vagasLivres >= TOTAL_VAGAS) {
        pushLog('[STATE] Pátio já livre (12/12). Saída ignorada.', 'warn');
        return;
      }
      const next = vagasLivres + 1;
      const nextSeq = packetSeq + 1;
      setVagasLivres(next);
      setPacketSeq(nextSeq);
      pushLog(
        `[MQTT #${nextSeq}] payload={"livres":${next},"ocupadas":${TOTAL_VAGAS - next},"evento":"SAIDA","tls":"1.3"}`,
        'ok'
      );
    }
  };

  const resetBancada = () => {
    setVagasLivres(8);
    setLastTrigger(0);
    setFsmState('IDLE');
    pushLog('[RESET] Estado restaurado para 08/12 vagas livres.', 'info');
  };

  const ocupadas = TOTAL_VAGAS - vagasLivres;
  const bays = Array.from({ length: TOTAL_VAGAS }, (_, idx) => ({
    code: `V${pad2(idx + 1)}`,
    occupied: idx < ocupadas,
  }));

  return (
    <section className="chapter-band chapter-band--l1" id="pars-i">
      <div className="container hardware-split">
        {/* Obsidian & Gold Architectural Gate Floorplan Instrument (Replaces basic green LCD) */}
        <div className="workbench-folio" aria-label="Instrumento arquitetônico ESP32">
          <div className="workbench-head">
            <span className="workbench-name">Instrumentum ESP32 — Matriz de Vagas &amp; TLS</span>
            <span
              className={`seal-state ${
                fsmState === 'COOLDOWN'
                  ? 'seal-state--warn'
                  : fsmState === 'GATE_IN' || fsmState === 'GATE_OUT'
                    ? 'seal-state--ok'
                    : ''
              }`}
            >
              FSM: {fsmState}
            </span>
          </div>

          {/* I2C Telemetry Register Strip in Obsidian & Antique Gold */}
          <div className="register-strip" role="status" aria-live="polite">
            <div className="register-cell">
              <span className="register-label">VAGAS LIVRES</span>
              <strong className="register-value">{pad2(vagasLivres)} / 12</strong>
            </div>
            <div className="register-cell">
              <span className="register-label">OCUPAÇÃO ATUAL</span>
              <strong className="register-value">{pad2(ocupadas)}</strong>
            </div>
            <div className="register-cell">
              <span className="register-label">CANAL I2C / CLOUD</span>
              <strong className="register-value register-value--ok">TLS 1.3 · 0x27</strong>
            </div>
          </div>

          {/* 12-Bay Architectural Parking Floorplan */}
          <div className="floorplan-chamber" aria-label="Planta de 12 vagas monitoradas">
            <div className="bays-row">
              {bays.slice(0, 6).map((b) => (
                <div
                  key={b.code}
                  className={`parking-bay ${b.occupied ? 'is-occupied' : 'is-free'}`}
                >
                  <span className="bay-id">{b.code}</span>
                  <span className="bay-status">{b.occupied ? 'OCUP' : 'LIVRE'}</span>
                </div>
              ))}
            </div>

            <div className="gate-lane">
              <span className={`gate-pill ${fsmState === 'GATE_IN' ? 'is-pulsing' : ''}`}>
                Entrada · HC-SR04 #1 (GPIO 4/2)
              </span>
              <span className="lane-divider" aria-hidden="true" />
              <span className={`gate-pill ${fsmState === 'GATE_OUT' ? 'is-pulsing' : ''}`}>
                Saída · HC-SR04 #2 (GPIO 26/25)
              </span>
            </div>

            <div className="bays-row">
              {bays.slice(6, 12).map((b) => (
                <div
                  key={b.code}
                  className={`parking-bay ${b.occupied ? 'is-occupied' : 'is-free'}`}
                >
                  <span className="bay-id">{b.code}</span>
                  <span className="bay-status">{b.occupied ? 'OCUP' : 'LIVRE'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="workbench-controls">
            <button
              type="button"
              className="btn-codex btn-codex--primary btn-compact"
              onClick={() => triggerSensor('ENTRADA')}
            >
              Registrar Entrada (#1)
            </button>
            <button
              type="button"
              className="btn-codex btn-codex--ghost btn-compact"
              onClick={() => triggerSensor('SAIDA')}
            >
              Registrar Saída (#2)
            </button>
            <button
              type="button"
              className="btn-codex btn-codex--ghost btn-compact"
              onClick={resetBancada}
            >
              Resetar
            </button>
          </div>

          <div className="log-console" aria-label="Log MQTT do ESP32">
            {logs.map((entry) => (
              <div key={entry.id} className={`log-line log-line--${entry.level}`}>
                {entry.text}
              </div>
            ))}
          </div>
        </div>

        {/* Deepened Editorial Column with 3 Technical Tabs */}
        <article className="editorial-column">
          <div className="chapter-marker">
            <span className="chapter-numeral">I</span>
            <div>
              <p className="latin-incipit">Signum ex materia · C++ &amp; IoT</p>
              <h2 className="chapter-heading">Estacionamento Inteligente · ESP32</h2>
            </div>
          </div>

          <div className="dossier-tabs" role="tablist" aria-label="Detalhes do projeto ESP32">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'arch'}
              className={`dossier-tab-btn ${activeTab === 'arch' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('arch')}
            >
              Arquitetura
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'pins'}
              className={`dossier-tab-btn ${activeTab === 'pins' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('pins')}
            >
              Pinagem &amp; Hardware
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'timeline'}
              className={`dossier-tab-btn ${activeTab === 'timeline' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              Evolução (13 Marcos)
            </button>
          </div>

          {activeTab === 'arch' && (
            <div className="tab-panel">
              <p>
                Desenvolvido pela <strong>Equipe 13 (Ciência da Computação — UNIFEOB)</strong>, o
                firmware em C++ transforma um <strong>ESP32 DevKit V1</strong> num controlador
                autônomo de pátio com contagem determinística e telemetria criptografada em nuvem.
              </p>
              <ul className="folio-list">
                <li>
                  <strong>Máquina de estados + Anti-crosstalk:</strong> os disparos dos dois
                  sensores HC-SR04 são intercalados e protegidos por janela de <em>cooldown</em>{' '}
                  físico, eliminando eco cruzado e dupla contagem.
                </li>
                <li>
                  <strong>Display LCD 16×2 sem flickering:</strong> o barramento I2C só recebe
                  redesenho diferencial quando a contagem realmente muda.
                </li>
                <li>
                  <strong>MQTT seguro e assíncrono:</strong> migração de <code>WiFiClient</code>{' '}
                  para <code>WiFiClientSecure</code> com TLS rumo ao broker <strong>HiveMQ Cloud</strong>,
                  com reconexão não-bloqueante para nunca travar a leitura física.
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'pins' && (
            <div className="tab-panel">
              <p>
                Mapeamento completo dos periféricos conectados ao barramento do ESP32 DevKit V1
                conforme documentado em <code>src/main.cpp</code>:
              </p>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Função</th>
                      <th>Pino ESP32</th>
                      <th>Hardware</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>TRIG / ECHO Entrada</td>
                      <td>GPIO 4 / GPIO 2</td>
                      <td>Sensor HC-SR04 #1</td>
                    </tr>
                    <tr>
                      <td>TRIG / ECHO Saída</td>
                      <td>GPIO 26 / GPIO 25</td>
                      <td>Sensor HC-SR04 #2</td>
                    </tr>
                    <tr>
                      <td>LCD I2C SDA / SCL</td>
                      <td>GPIO 21 / GPIO 22</td>
                      <td>Display LCD 16×2 I2C</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="tab-panel">
              <p>
                Histórico progressivo documentado diretamente na árvore de commits do repositório:
              </p>
              <ul className="folio-list">
                {ESP32_MILESTONES.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="editorial-actions">
            <a
              className="btn-inline-rule"
              href="https://github.com/joaoheliodev/projeto-pi-estacionamento-inteligente"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver código no GitHub →
            </a>
          </div>
        </article>
      </div>
    </section>
  );
}
