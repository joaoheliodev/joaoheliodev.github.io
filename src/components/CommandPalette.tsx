import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MANIFESTO_CANON, type ThemeMode } from '../data/codexData';
import { sha256Hex } from '../utils/sha256';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

const SHORTCUTS = [
  { label: 'Tabula Romana 3D', cmd: 'goto tabula-3d' },
  { label: 'Pars I — ESP32 e C++', cmd: 'goto pars-i' },
  { label: 'Pars II — Forense .blend', cmd: 'goto pars-ii' },
  { label: 'Pars III — Rede UNIFEOB', cmd: 'goto pars-iii' },
  { label: 'Pars IV — Iosephus SOC', cmd: 'goto pars-iv' },
  { label: 'Index Codicum (GitHub)', cmd: 'goto github-archive' },
  { label: 'whoami (identificação)', cmd: 'whoami' },
  { label: 'stats (telemetria WebGL)', cmd: 'stats' },
  { label: 'sha256 (manifesto)', cmd: 'sha256' },
  { label: 'Alternar Vigília / Pergaminho', cmd: 'theme' },
];

export function CommandPalette({ open, onClose, theme, onToggleTheme }: CommandPaletteProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState(
    'Terminal do Codex pronto. Digite "help" e pressione Enter, ou acione um comando abaixo:'
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const prefersReduced = useReducedMotion();
  const manifestoHash = useMemo(() => sha256Hex(MANIFESTO_CANON), []);

  useEffect(() => {
    if (open) {
      setInput('');
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const execute = (raw: string) => {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;

    if (cmd === 'help' || cmd === '?') {
      setOutput(
        'Comandos disponíveis:\n' +
          '  whoami      Identificação acadêmica e canais de contato\n' +
          '  ls          Lista os 4 dossiês públicos verificados\n' +
          '  stack       Inventário técnico da camada L1 à L7\n' +
          '  stats       Telemetria em tempo real do motor WebGL (draw calls / instâncias)\n' +
          '  sha256      Digest SHA-256 do manifesto canônico\n' +
          '  theme       Alterna entre Vigília Noturna e Pergaminho\n' +
          '  goto <id>   Salta para seção (prologus, tabula-3d, pars-i..iv, github-archive, colophon)'
      );
      return;
    }

    if (cmd === 'whoami') {
      setOutput(
        'João Hélio dos Reis Souza (@joaoheliodev)\n' +
          'Graduação: Ciência da Computação — UNIFEOB (Brasil)\n' +
          'Foco: C, C++, Python, Cibersegurança, Forense Estática, Redes Cisco, IoT e Cloud\n' +
          'GitHub  : https://github.com/joaoheliodev\n' +
          'LinkedIn: https://www.linkedin.com/in/joao-helio-dos-reis-souza-982091238\n' +
          'E-mail  : joaohelio396@gmail.com'
      );
      return;
    }

    if (cmd === 'ls') {
      setOutput(
        '[I]   projeto-pi-estacionamento-inteligente  (C++ / ESP32 / I2C / MQTT TLS)\n' +
          '[II]  malicious-blend-analysis               (Python / SDNA / Seekable Zstd)\n' +
          '[III] infra_campus_feob                      (Cisco 3650 & ASA / 21 VLANs)\n' +
          '[IV]  Iosephus                               (FastAPI / MySQL 8.4 / MongoDB 8.0 / AWS CDK)'
      );
      return;
    }

    if (cmd === 'stack') {
      setOutput(
        'L1 Silício  : C, C++, ESP32 DevKit V1, HC-SR04, I2C diferencial, MQTT TLS\n' +
          'L2 Forense  : Python, Blender SDNA, Seekable Zstd, ChaCha20, IOCs desarmados\n' +
          'L3 Redes    : Cisco IOS, Catalyst 3650/2960, ASA 5506-X, VLSM, HSRP, PVST+, ACLs\n' +
          'L7 Custódia : FastAPI, MySQL 8.4, MongoDB 8.0, Argon2, Docker, AWS CDK v2, Dart'
      );
      return;
    }

    if (cmd === 'stats') {
      const stats = window.__CODEX_WEBGL_STATS__?.();
      if (stats) {
        setOutput(
          `Telemetria WebGL (Santuário 3D PBR):\n` +
            `  Draw calls por frame : ${stats.drawCalls}\n` +
            `  Triângulos ativos    : ${stats.triangles}\n` +
            `  Instâncias GPU       : ${stats.instances} (InstancedMesh consolidados)`
        );
      } else {
        setOutput('Modo de contingência estático ativo (WebGL indisponível neste dispositivo).');
      }
      return;
    }

    if (cmd === 'sha256') {
      setOutput(`CODEX JH-MMXXVI SHA-256:\n${manifestoHash}`);
      return;
    }

    if (cmd === 'theme') {
      onToggleTheme();
      const nextName = theme === 'dark' ? 'Pergaminho' : 'Vigília Noturna';
      setOutput(`Edição alterada instantaneamente para: ${nextName}.`);
      return;
    }

    if (cmd.startsWith('goto ')) {
      const targetId = cmd.replace('goto ', '').trim();
      const el = document.getElementById(targetId);
      if (el) {
        onClose();
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        setOutput(
          `Fólio "${targetId}" não localizado. Use: prologus, tabula-3d, pars-i, pars-ii, pars-iii, pars-iv, github-archive, colophon.`
        );
      }
      return;
    }

    setOutput(`Instrução não reconhecida: "${cmd}". Digite "help" para consultar o índice.`);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="palette-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReduced ? 0.01 : 0.18 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="palette-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="palette-lbl"
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.985 }}
            animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.985 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="palette-header">
              <span className="palette-prompt" id="palette-lbl">
                custos@codex:~$
              </span>
              <input
                ref={inputRef}
                className="palette-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    execute(input);
                  }
                }}
                placeholder="whoami, ls, stats, sha256, theme, help..."
                aria-label="Instrução do terminal"
              />
              <button type="button" className="chrome-btn" onClick={onClose}>
                Esc
              </button>
            </div>

            <div className="palette-body">
              <pre className="palette-output">{output}</pre>
              <div className="palette-actions">
                {SHORTCUTS.map((item) => (
                  <button
                    key={item.cmd}
                    type="button"
                    className="palette-item"
                    onClick={() => execute(item.cmd)}
                  >
                    <span>{item.label}</span>
                    <code className="palette-cmd-hint">{item.cmd}</code>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
