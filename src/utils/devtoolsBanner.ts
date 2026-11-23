export function printCodexDevtoolsBanner(): void {
  try {
    console.log(
      '%c ☧ CODEX CVSTODIS · IOANNES HELIVS ',
      'background:#141A2E;color:#E4C766;font-family:Georgia,serif;font-size:14px;padding:6px 10px;border:1px solid #C9A227;'
    );
    console.log(
      '%cEx silicio ad nubem — Dicas rápidas:\n' +
        '• Pressione 1–9, 0, -, = para acionar as tésseras de mármore 3D\n' +
        '• Pressione Ctrl+K para abrir o console do Codex\n' +
        '• Na Pars II, rompa o selo de cera para revelar os IOCs em quarentena',
      'color:#B7AF9C;font-family:monospace;font-size:11px;line-height:1.6;'
    );
  } catch {
    // ignore
  }
}
