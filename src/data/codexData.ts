export type ThemeMode = 'dark' | 'light';

export const MANIFESTO_CANON =
  'JH-2026-CVSTOS|joaoheliodev|L1:ESP32-IoT|L2:Blend-SDNA|L3:UNIFEOB-Campus-VLAN|L7:Iosephus-SOC';

export interface BlendStage {
  numeral: string;
  label: string;
  symbol: string;
  desc: string;
  hex: string;
}

export const BLEND_STAGES: BlendStage[] = [
  {
    numeral: 'I',
    label: 'Load UI Padrão',
    symbol: 'G_FILE_COMPRESS (1 << 1) · Load UI ativo',
    desc: 'O cabeçalho do arquivo não habilita Auto Run (o Blender nunca restaura essa flag a partir de um .blend). Com Load UI ligado por padrão, a interface adulterada é carregada imediatamente ao abrir.',
    hex: 'tools/zstd_walk.py -> frame seekable zstd (~4,7 MB anexados ao fim, ignorados pelo Blender) | build 5.2.1 (9e2066aef7ef)',
  },
  {
    numeral: 'II',
    label: 'Outliner Adulterado',
    symbol: 'Area.spacetype -> SPACE_SEQ (Preview)',
    desc: 'No layout padrão "Layout", a janela do Outliner foi substituída por um preview do Sequencer. O simples desenho da tela inicial já solicita um frame renderizado sem nenhum clique.',
    hex: "tools/blend_sdna_dump.py -> Screen['Layout'].areabase | spacetype = SPACE_SEQ (preview)",
  },
  {
    numeral: 'III',
    label: 'Modo Rendered',
    symbol: 'seq_prev_type = OB_RENDER (6)',
    desc: 'Em vez do modo padrão Solid, o preview do sequencer da cena ativa foi salvo como OB_RENDER (6), obrigando o pipeline completo de render na abertura do documento.',
    hex: 'Scene.toolsettings.sequencer_tool_settings | seq_prev_type = 0x06 (OB_RENDER)',
  },
  {
    numeral: 'IV',
    label: 'Strip fs_strip',
    symbol: "Sequence['fs_strip'] -> STRIP_TYPE_SCENE (2)",
    desc: 'Uma strip de cena cobre todo o intervalo de frames e aponta para uma segunda cena oculta chamada FS_Scene (com câmera FS_Cam e objeto FS_Cube).',
    hex: "Sequence['fs_strip'].type = 2 (STRIP_TYPE_SCENE) | scene -> Pointer('FS_Scene')",
  },
  {
    numeral: 'V',
    label: 'Freestyle Script',
    symbol: 'R_EDGE_FRS (1 << 25) + SCRIPT_MODE = 1',
    desc: 'FS_Scene liga o Freestyle em modo script apontando para sim_cache_utils (flags = 0x405, sem TXT_ISSCRIPT). Até o PR #165375 (5.2.3 / 4.5.15 / 5.3.0), prepare() não verificava Auto Run.',
    hex: "ViewLayer.freestyle_settings.mode = 1 | Text['sim_cache_utils'].flags = 0x405 (sem 1 << 4)",
  },
  {
    numeral: 'VI',
    label: 'Loader ChaCha20',
    symbol: 'bpy.app.timers.register(_tick, 2) -> ChaCha20 + LZMA2',
    desc: 'Após 2 segundos, _validate() busca 32 bytes em GET /k ignorando proxy, valida HMAC-SHA256, decifra com ChaCha20 + XOR, descomprime LZMA2 e grava %TEMP%\\sim_cache.exe.',
    hex: 'const = (0x61000000 | 0x707865) | ProxyHandler({}) | FILTER_LZMA2 -> %TEMP%\\sim_cache.idx',
  },
];

export const DEFANGED_IOCS = [
  {
    kind: 'URL C2 (desarmada)',
    value: 'hxxp://31.76.102[.]218:8787/k',
    note: 'GET TCP 8787 sem TLS · User-Agent Python-urllib/3.x ignorando proxy',
  },
  {
    kind: 'Artefatos Windows',
    value: '%TEMP%\\sim_cache.exe  |  %TEMP%\\sim_cache.idx',
    note: 'Dropper gravado após decifragem ChaCha20 + marcador de execução única',
  },
  {
    kind: 'Datablock oculto',
    value: 'sim_cache_utils (flags = 0x405)',
    note: 'Ausência de TXT_ISSCRIPT (1 << 4) evita detectores de textos registrados',
  },
  {
    kind: 'Assinaturas do loader',
    value: '0x61000000 | 0x707865 · FILTER_LZMA2 · b85decode',
    note: 'Constante ChaCha20 montada com OR bit a bit + comentários de fachada',
  },
];

export const ESP32_MILESTONES = [
  '1–3. Definição de pinagem, leitura ultrassônica HC-SR04 e máquina de estados para contagem única',
  '4–5. Integração do display LCD 16×2 I2C com atualização diferencial anti-flickering',
  '6–7. Sensor de saída dedicado + isolamento de crosstalk entre canais ultrassônicos',
  '8–10. Conectividade WiFi e migração de WiFiClient para WiFiClientSecure + TLS (HiveMQ Cloud)',
  '11–13. Reconexão MQTT assíncrona não-bloqueante, cooldown físico e logs finais',
];

export const BLEND_TOOLS = [
  {
    name: 'tools/zstd_walk.py',
    role: 'Percorre blocos seekable zstd e identifica ~4,7 MB anexados após o índice.',
  },
  {
    name: 'tools/blend_sdna_dump.py',
    role: 'Extrai estruturas SDNA do Blender 5.2.1 (flags, cenas, strips e SpaceSeq) sem abrir a GUI.',
  },
  {
    name: 'tools/validate_chain.py',
    role: 'Valida estaticamente o encadeamento Layout → OB_RENDER → fs_strip → FS_Scene → R_EDGE_FRS.',
  },
  {
    name: 'tools/prng_tests.py',
    role: 'Analisa a entropia e valores gerados por cópia pelo builder do artefato.',
  },
];

export type CiscoNodeKey = 'isp' | 'asa' | 'sw1' | 'sw2' | 'swsrv' | 'access';

export const CISCO_NODES: Record<CiscoNodeKey, { title: string; role: string; detail: string }> = {
  isp: {
    title: 'Roteador ISP Cisco 2911 ISR',
    role: 'Borda externa · 8.8.8.1/24',
    detail:
      'Simula o roteamento público externo na interface Gig0/2 e entrega conectividade ao firewall pelo enlace ponto a ponto 200.0.0.0/30.',
  },
  asa: {
    title: 'Firewall Cisco ASA 5506-X',
    role: 'Perímetro Stateful · PAT',
    detail:
      'Inspeção stateful de protocolos na borda, tradução PAT na interface outside e dois links roteados independentes (192.168.210.0/30 e 192.168.220.0/30) rumo ao núcleo.',
  },
  sw1: {
    title: 'Switch1-3 (Catalyst 3650-24PS)',
    role: 'Collapsed Core Primário · HSRP Prio 110',
    detail:
      'Gateway ativo padrão com preempt nas 21 SVIs (grupos HSRP numerados conforme o ID da VLAN) e peering dedicado via tronco 802.1Q Gi1/0/13.',
  },
  sw2: {
    title: 'Switch2-3 (Catalyst 3650-24PS)',
    role: 'Collapsed Core Secundário · HSRP Prio 100',
    detail:
      'Permanece em espera passiva pronto para assumir todas as 21 VLANs sem perda de sessão em caso de falha do Switch1-3.',
  },
  swsrv: {
    title: 'Switch L2 Servidores (Catalyst 2960)',
    role: 'Agregação · VLAN 230 DHCP',
    detail:
      'Uplinks redundantes Gi1/0/23 conectados simultaneamente a Switch1-3 e Switch2-3, isolando o servidor DHCP dedicado (192.168.230.1).',
  },
  access: {
    title: '12× Acesso Catalyst 2960 + 54 APs Wi-Fi',
    role: 'Prédios A–F · ~389 Hosts',
    detail:
      'Dual-homing físico (Gi0/1 para Switch1-3, Gi0/2 para Switch2-3) com PVST+ e 20 ACLs estendidas filtrando matrizes interdepartamentais.',
  },
};

export interface IosephusEvent {
  _id: string;
  organizacao: string;
  ativo: string;
  ip_ativo: string;
  sistema_operacional: string;
  cve: string;
  regra: string;
  event_id: number;
  ip_origem: string;
  preservado: boolean;
}

export const CANONICAL_IOSEPHUS_EVENT: IosephusEvent = {
  _id: '6920f1a8c4e29b0014a91e07',
  organizacao: 'Prefeitura de Vale Verde',
  ativo: 'SRV-ARQUIVOS',
  ip_ativo: '10.20.0.15',
  sistema_operacional: 'Windows Server 2008 R2',
  cve: 'CVE-2019-0708',
  regra: 'T1110.001 · Força bruta RDP seguida de logon',
  event_id: 4624,
  ip_origem: '185.220.101.44',
  preservado: true,
};

export interface PublicRepoEntry {
  name: string;
  layer: string;
  language: string;
  url: string;
  labHref: string;
  summary: string;
  highlights: string[];
}

export const PUBLIC_REPOS: PublicRepoEntry[] = [
  {
    name: 'Iosephus',
    layer: 'L7 · SOC & Cloud',
    language: 'Python 3.12 · FastAPI · MySQL 8.4 · MongoDB 8.0 · AWS CDK v2',
    url: 'https://github.com/joaoheliodev/Iosephus',
    labHref: '#pars-iv',
    summary:
      'MVP de SOC-as-a-Service para prefeituras e PMEs com persistência poliglota, cálculo de SLA, Argon2 + RBAC, Docker Compose, Pytest no GitHub Actions e infraestrutura AWS CDK.',
    highlights: [
      'MongoDB guarda o fato bruto; MySQL guarda a decisão (ObjectId + SHA-256)',
      'Reconciliador idempotente a cada 5 min com UNIQUE(alerta_origem_id)',
      'Cenário demonstrativo Prefeitura de Vale Verde (CVE-2019-0708 / T1110.001)',
    ],
  },
  {
    name: 'malicious-blend-analysis',
    layer: 'L2 · Forense Estática',
    language: 'Python · SDNA · Seekable Zstd · ChaCha20 / LZMA2',
    url: 'https://github.com/joaoheliodev/malicious-blend-analysis',
    labHref: '#pars-ii',
    summary:
      'Análise estática (zero execução) de arquivo .blend capaz de executar Python no Blender 5.2.1 com Auto Run desligado via Freestyle em modo script e preview do sequencer.',
    highlights: [
      'Mapeamento completo das flags no fonte 5.2.1 (R_EDGE_FRS, OB_RENDER)',
      'Ferramentas em tools/ para percorrer seekable zstd e dump SDNA',
      'Publicação segura de IOCs de rede e host desarmados (IOCs.md / iocs.csv)',
    ],
  },
  {
    name: 'infra_campus_feob',
    layer: 'L3 · Redes & Perímetro',
    language: 'Cisco IOS · Cisco ASA 5506-X · HSRP · PVST+ · VLSM',
    url: 'https://github.com/joaoheliodev/infra_campus_feob',
    labHref: '#pars-iii',
    summary:
      'Arquitetura de rede corporativa para 6 prédios universitários, ~389 hosts e 21 VLANs em núcleo colapsado redundante com inspeção stateful e 20 ACLs inter-VLAN.',
    highlights: [
      '2× Catalyst 3650-24PS (HSRP prio 110 preempt / 100) + 12× Catalyst 2960',
      'Endereçamento VLSM mnemônico 192.168.[VLAN_ID].0 + 54 APs Wi-Fi',
      'Arquivos .cfg canônicos, scripts de ACLs e topologia Packet Tracer (.pkt)',
    ],
  },
  {
    name: 'projeto-pi-estacionamento-inteligente',
    layer: 'L1 · Hardware & IoT',
    language: 'C++ · ESP32 DevKit V1 · HC-SR04 · LCD I2C · MQTT/TLS',
    url: 'https://github.com/joaoheliodev/projeto-pi-estacionamento-inteligente',
    labHref: '#pars-i',
    summary:
      'Sistema de controle de vagas em tempo real com máquina de estados, dois sensores ultrassônicos, visor I2C sem flickering e publicação TLS para HiveMQ Cloud.',
    highlights: [
      'Isolamento anti-crosstalk entre sensores de entrada e saída',
      'Cooldown físico contra debouncing + reconexão MQTT não-bloqueante',
      'Evolução documentada em 13 marcos de engenharia (Equipe 13 — UNIFEOB)',
    ],
  },
];

export const CAPABILITIES_LEDGER = [
  {
    layer: 'L1 · Silício & Embarcados',
    latin: 'Ex materia',
    tools: 'C, C++, ESP32 DevKit V1, sensores HC-SR04, barramento I2C, WiFiClientSecure e MQTT TLS.',
  },
  {
    layer: 'L2 · Binário & Forense',
    latin: 'Sine executione',
    tools: 'Python, inspeção SDNA e frames seekable Zstd, extração de IOCs desarmados, análise de loaders ChaCha20/LZMA2.',
  },
  {
    layer: 'L3 · Redes & Perímetro',
    latin: 'Per fines',
    tools: 'Cisco IOS, Catalyst 3650/2960, Firewall ASA 5506-X, endereçamento VLSM, HSRP, PVST+ e ACLs estendidas.',
  },
  {
    layer: 'L7 · Custódia, Dados & Nuvem',
    latin: 'Ad nubem',
    tools: 'Python 3.12, FastAPI, MySQL 8.4, MongoDB 8.0, Argon2/RBAC, Docker Compose, GitHub Actions, AWS CDK v2 e Dart.',
  },
];
