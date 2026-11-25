export function printCodexDevtoolsBanner(): void {
  try {
    console.log(
      '%c ☧ CODEX CVSTODIS — IOANNES HELIVS ',
      'background:#141A2E;color:#E4C766;font-family:Georgia,serif;font-size:14px;padding:6px 10px;border:1px solid #C9A227;'
    );
    console.log(
      '%cEx silicio ad nubem — Atalhos de leitura:\n' +
        '  [1..9, 0, -, =]  Aciona as 12 tésseras esculpidas da Tabula Romana\n' +
        '  [Ctrl + K]       Abre o terminal de consulta do Codex\n' +
        '  [Pars II]        Rompa o lacre de cera para inspecionar os IOCs desarmados',
      'color:#B7AF9C;font-family:monospace;font-size:11px;line-height:1.6;'
    );
  } catch {
    // ignore
  }
}
