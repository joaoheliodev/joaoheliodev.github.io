import { useState } from 'react';
import { ESP32_MILESTONES } from '../data/codexData';
import { FolioReveal } from './FolioReveal';

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
  const [skippedRedraws, setSkippedRedraws] = useState(14);
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
      text: '[BOOT] ESP32 DevKit V1 pronto: isolamento de crosstalk e cooldown de 1,2 s ativos.',
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
      setSkippedRedraws((s) => s + 1);
      pushLog(
        `[DEBOUNCE] Pulso ${direction} ignorado: janela física anti-crosstalk (1,2 s) preservou o barramento I2C.`,
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
        setSkippedRedraws((s) => s + 1);
        pushLog('[STATE] Pátio lotado (00/12 livres). Contagem inalterada; I2C poupado.', 'crit');
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
        setSkippedRedraws((s) => s + 1);
        pushLog('[STATE] Pátio integralmente livre (12/12). Saída descartada; I2C poupado.', 'warn');
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
    pushLog('[RESET] Planta restaurada para 08/12 vagas livres.', 'info');
  };

  const ocupadas = TOTAL_VAGAS - vagasLivres;
  const bays = Array.from({ length: TOTAL_VAGAS }, (_, idx) => ({
    code: `V${pad2(idx + 1)}`,
    occupied: idx < ocupadas,
  }));

  const lcdLine1 = `VAGAS LIVRES: ${pad2(vagasLivres)}`;
  const lcdLine2 =
    vagasLivres === 0
      ? 'ESTADO: LOTADO  '
      : fsmState === 'COOLDOWN'
        ? 'HOLD 1200ms I2C '
        : `OCUP:${pad2(ocupadas)} MQTT:TLS`;

  return (
    <section className="chapter-band chapter-band--l1" id="pars-i">
      <FolioReveal className="container hardware-split">
        <div className="workbench-folio" aria-label="Instrumento arquitetônico ESP32">
          <div className="workbench-head">
            <span className="workbench-name">Instrumentum I — Pátio Monitorado e Barramento I2C</span>
            <span
              className={`marginalia-stamp ${
                fsmState === 'COOLDOWN'
                  ? 'marginalia-stamp--warn'
                  : fsmState === 'GATE_IN' || fsmState === 'GATE_OUT'
                    ? 'marginalia-stamp--ok'
                    : ''
              }`}
            >
              Estado FSM: {fsmState}
            </span>
          </div>

          {/* Differential I2C 0x27 Character Readout + Telemetry Strip */}
          <div className="i2c-readout-bar" aria-label="Espelho diferencial do barramento LCD 16x2 I2C">
            <div className="i2c-char-screen">
              <span className="i2c-screen-caption">Barramento I2C 0x27 (GPIO 21 SDA / 22 SCL)</span>
              <code className="i2c-char-line">{lcdLine1}</code>
              <code className="i2c-char-line i2c-char-line--sub">{lcdLine2}</code>
            </div>
            <div className="i2c-metrics-col">
              <div className="register-cell">
                <span className="register-label">Livres / Total</span>
                <strong className="register-value">{pad2(vagasLivres)} / 12</strong>
              </div>
              <div className="register-cell">
                <span className="register-label">Escritas I2C poupadas</span>
                <strong className="register-value register-value--ok">{skippedRedraws} ciclos</strong>
              </div>
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
                  <span className="bay-status">{b.occupied ? 'Ocup.' : 'Livre'}</span>
                </div>
              ))}
            </div>

            <div className="gate-lane">
              <span className={`gate-sensor-tag ${fsmState === 'GATE_IN' ? 'is-pulsing' : ''}`}>
                Canal #1 Entrada (GPIO 4/2)
              </span>
              <span className="lane-divider" aria-hidden="true" />
              <span className={`gate-sensor-tag ${fsmState === 'COOLDOWN' ? 'is-warn' : ''}`}>
                Janela 1,2 s
              </span>
              <span className="lane-divider" aria-hidden="true" />
              <span className={`gate-sensor-tag ${fsmState === 'GATE_OUT' ? 'is-pulsing' : ''}`}>
                Canal #2 Saída (GPIO 26/25)
              </span>
            </div>

            <div className="bays-row">
              {bays.slice(6, 12).map((b) => (
                <div
                  key={b.code}
                  className={`parking-bay ${b.occupied ? 'is-occupied' : 'is-free'}`}
                >
                  <span className="bay-id">{b.code}</span>
                  <span className="bay-status">{b.occupied ? 'Ocup.' : 'Livre'}</span>
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
              Pulso de Entrada (#1)
            </button>
            <button
              type="button"
              className="btn-codex btn-codex--ghost btn-compact"
              onClick={() => triggerSensor('SAIDA')}
            >
              Pulso de Saída (#2)
            </button>
            <button
              type="button"
              className="btn-codex btn-codex--ghost btn-compact"
              onClick={resetBancada}
            >
              Restaurar Pátio
            </button>
          </div>

          <div className="log-console" aria-label="Telemetria MQTT do ESP32">
            {logs.map((entry) => (
              <div key={entry.id} className={`log-line log-line--${entry.level}`}>
                {entry.text}
              </div>
            ))}
          </div>
        </div>

        <article className="editorial-column">
          <div className="chapter-marker">
            <span className="chapter-numeral">I</span>
            <div>
              <p className="latin-incipit">Signum ex materia — Firmware C++ e IoT</p>
              <h2 className="chapter-heading">Estacionamento Inteligente sobre ESP32</h2>
            </div>
          </div>

          <div className="dossier-tabs" role="tablist" aria-label="Seções do dossiê ESP32">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'arch'}
              className={`dossier-tab-btn ${activeTab === 'arch' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('arch')}
            >
              <span className="tab-sec">§ 1</span> Arquitetura
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'pins'}
              className={`dossier-tab-btn ${activeTab === 'pins' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('pins')}
            >
              <span className="tab-sec">§ 2</span> Pinagem GPIO
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'timeline'}
              className={`dossier-tab-btn ${activeTab === 'timeline' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              <span className="tab-sec">§ 3</span> 13 Marcos
            </button>
          </div>

          {activeTab === 'arch' && (
            <div className="tab-panel">
              <p>
                Construído pela <strong>Equipe 13 (Ciência da Computação — UNIFEOB)</strong>, o
                firmware em C++ converte um <strong>ESP32 DevKit V1</strong> em controlador autônomo
                de pátio com contagem determinística e publicação cifrada em nuvem.
              </p>
              <ul className="folio-list">
                <li>
                  <strong>Isolamento de eco cruzado (anti-crosstalk):</strong> as leituras dos dois
                  transdutores ultrassônicos HC-SR04 operam intercaladas sob janela física de{' '}
                  <em>cooldown</em> (<code>1200 ms</code>), impedindo dupla contagem na cancela.
                </li>
                <li>
                  <strong>Escrita I2C diferencial:</strong> o visor LCD 16×2 só recebe comando de
                  redesenho quando o saldo de vagas realmente se altera, zerando cintilação e ruído.
                </li>
                <li>
                  <strong>Telemetria TLS não-bloqueante:</strong> transição de{' '}
                  <code>WiFiClient</code> para <code>WiFiClientSecure</code> conectado ao broker{' '}
                  <strong>HiveMQ Cloud</strong>, mantendo a amostragem física livre mesmo em quedas de
                  rede.
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'pins' && (
            <div className="tab-panel">
              <p>
                Mapa elétrico dos periféricos ligados ao microcontrolador conforme especificado em{' '}
                <code>src/main.cpp</code>:
              </p>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Canal</th>
                      <th>Barramento ESP32</th>
                      <th>Periférico</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>TRIG / ECHO Entrada</td>
                      <td>GPIO 4 / GPIO 2</td>
                      <td>Transdutor HC-SR04 #1</td>
                    </tr>
                    <tr>
                      <td>TRIG / ECHO Saída</td>
                      <td>GPIO 26 / GPIO 25</td>
                      <td>Transdutor HC-SR04 #2</td>
                    </tr>
                    <tr>
                      <td>SDA / SCL (0x27)</td>
                      <td>GPIO 21 / GPIO 22</td>
                      <td>Visor LCD 16×2 I2C</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="tab-panel">
              <p>
                Progressão de engenharia registrada commit a commit no histórico do repositório:
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
              className="editorial-link"
              href="https://github.com/joaoheliodev/projeto-pi-estacionamento-inteligente"
              target="_blank"
              rel="noopener noreferrer"
            >
              Inspecionar fonte C++ em github.com/joaoheliodev/projeto-pi-estacionamento-inteligente
            </a>
          </div>
        </article>
      </FolioReveal>
    </section>
  );
}
