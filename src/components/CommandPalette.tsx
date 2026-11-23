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
  { label: 'Tabula 3D · Altar das Tésseras', cmd: 'goto tabula-3d' },
  { label: 'Pars I · Estacionamento ESP32', cmd: 'goto pars-i' },
  { label: 'Pars II · Análise .blend', cmd: 'goto pars-ii' },
  { label: 'Pars III · Rede UNIFEOB', cmd: 'goto pars-iii' },
  { label: 'Pars IV · Iosephus SOC', cmd: 'goto pars-iv' },
  { label: 'Arquivo & GitHub', cmd: 'goto github-archive' },
  { label: 'whoami', cmd: 'whoami' },
  { label: 'sha256', cmd: 'sha256' },
  { label: 'Alternar Vigília / Pergaminho', cmd: 'theme' },
];

export function CommandPalette({ open, onClose, theme, onToggleTheme }: CommandPaletteProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState(
    'Console do Codex pronto. Digite "help" e pressione Enter ou escolha um atalho:'
  );
  const inputRef = useRef<HTMLInputElement>(null);
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
          '  whoami      -> Identidade e foco técnico\n' +
          '  ls          -> Os 4 dossiês (Pars I a IV)\n' +
          '  stack       -> Inventário por camada L1 -> L7\n' +
          '  sha256      -> Digest do manifesto do Codex\n' +
          '  theme       -> Alternar Vigília Noturna / Pergaminho\n' +
          '  goto <id>   -> Navegar (prologus, tabula-3d, pars-i, pars-ii, pars-iii, pars-iv, github-archive)'
      );
      return;
    }

    if (cmd === 'whoami') {
      setOutput(
        'João Hélio (@joaoheliodev) · Ciência da Computação — UNIFEOB (Brasil)\n' +
          'C, C++, Python · Cibersegurança, Análise Estática, Redes Cisco, IoT & Cloud.\n' +
          'LinkedIn: https://www.linkedin.com/in/joao-helio-dos-reis-souza-982091238\n' +
          'E-mail: joaohelio396@gmail.com'
      );
      return;
    }

    if (cmd === 'ls') {
      setOutput(
        '[I]   projeto-pi-estacionamento-inteligente  (C++ / ESP32 / MQTT TLS)\n' +
          '[II]  malicious-blend-analysis               (Python / SDNA / Zstd)\n' +
          '[III] infra_campus_feob                      (Cisco 3650 & ASA / 21 VLANs)\n' +
          '[IV]  Iosephus                               (FastAPI / MySQL / MongoDB / AWS CDK)'
      );
      return;
    }

    if (cmd === 'stack') {
      setOutput(
        'L1 Silício  : C, C++, ESP32, HC-SR04, I2C, MQTT TLS\n' +
          'L2 Forense  : Python, SDNA, Seekable Zstd, ChaCha20, IOCs\n' +
          'L3 Redes    : Cisco IOS, ASA 5506-X, VLSM, HSRP, PVST+, ACLs\n' +
          'L7 Custódia : FastAPI, MySQL 8.4, MongoDB 8.0, Docker, AWS CDK v2, Dart'
      );
      return;
    }

    if (cmd === 'sha256') {
      setOutput(`CODEX JH-MMXXVI SHA-256:\n${manifestoHash}`);
      return;
    }

    if (cmd === 'theme') {
      onToggleTheme();
      const nextName = theme === 'dark' ? 'Pergaminho' : 'Vigília Noturna';
      setOutput(`Edição alterada para: ${nextName}.`);
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
          `Seção "${targetId}" não encontrada. Tente: prologus, tabula-3d, pars-i, pars-ii, pars-iii, pars-iv, github-archive, colophon.`
        );
      }
      return;
    }

    setOutput(`Comando desconhecido: "${cmd}". Digite "help" para ver os disponíveis.`);
  };

  if (!open) return null;

  return (
    <div
      className="palette-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="palette-dialog" role="dialog" aria-modal="true" aria-labelledby="palette-lbl">
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
            placeholder="whoami, ls, sha256, theme, help..."
            aria-label="Comando do console"
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
                <span aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
