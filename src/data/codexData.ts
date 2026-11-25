export type ThemeMode = 'dark' | 'light';

export const MANIFESTO_CANON =
  'JH-2026-CVSTOS|joaoheliodev|L1:ESP32-IoT|L2:Blend-SDNA|L3:UNIFEOB-Campus-VLAN|L7:Iosephus-SOC';

export interface BlendStage {
  numeral: string;
  label: string;
  region: 'header' | 'sdna' | 'freestyle' | 'zstd';
  sourceRef: string;
  symbol: string;
  desc: string;
  hex: string;
}

export const BLEND_STAGES: BlendStage[] = [
  {
    numeral: 'I',
    label: 'Load UI Padrão',
    region: 'header',
    sourceRef: 'BKE_blendfile / Cabeçalho 5.2.1 (9e2066aef7ef)',
    symbol: 'G_FILE_COMPRESS (1 << 1) — Load UI habilitado na abertura',
    desc: 'O cabeçalho do arquivo jamais ativa Auto Run (o Blender ignora essa flag vinda do disco). Porém, como Load UI vem marcado por padrão, toda a geometria de janelas modificada pelo atacante é montada assim que o documento abre.',
    hex: 'tools/zstd_walk.py -> frames seekable zstd + ~4,7 MB anexados após o índice EOF (ignorados pelo parser do Blender)',
  },
  {
    numeral: 'II',
    label: 'Outliner Trocado',
    region: 'sdna',
    sourceRef: 'DNA_space_types.h / Screen["Layout"].areabase',
    symbol: 'Area.spacetype = SPACE_SEQ (modo Preview)',
    desc: 'Dentro do workspace inicial "Layout", a área originalmente ocupada pelo Outliner foi convertida em um visor Preview do Video Sequence Editor. Desenhar a tela inicial passa a exigir a avaliação imediata do frame.',
    hex: 'tools/blend_sdna_dump.py -> Screen["Layout"].areabase -> SpaceSeq.view = SEQ_VIEW_PREVIEW',
  },
  {
    numeral: 'III',
    label: 'Preview Rendered',
    region: 'sdna',
    sourceRef: 'DNA_scene_types.h / SequencerToolSettings',
    symbol: 'seq_prev_type = OB_RENDER (6)',
    desc: 'Em vez do sombreamento leve Solid, a configuração do preview do Sequencer foi gravada como OB_RENDER (6), obrigando o motor de renderização completo a rodar no primeiro redesenho da janela.',
    hex: 'Scene.toolsettings.sequencer_tool_settings.seq_prev_type = 0x06 (OB_RENDER)',
  },
  {
    numeral: 'IV',
    label: 'Strip fs_strip',
    region: 'sdna',
    sourceRef: 'DNA_sequence_types.h / Editing.seqbase',
    symbol: 'Sequence["fs_strip"] -> STRIP_TYPE_SCENE (2)',
    desc: 'Uma strip de cena cobre toda a linha do tempo ativa e redireciona silenciosamente a renderização do preview para uma segunda cena oculta denominada FS_Scene (equipada com câmera FS_Cam e malha FS_Cube).',
    hex: 'Sequence["fs_strip"].type = 2 (STRIP_TYPE_SCENE) | scene -> Pointer("FS_Scene")',
  },
  {
    numeral: 'V',
    label: 'Brecha Freestyle',
    region: 'freestyle',
    sourceRef: 'FRS_freestyle.cpp: prepare() — corrigido no PR #165375',
    symbol: 'R_EDGE_FRS (1 << 25) + SCRIPT_MODE = 1 (sem TXT_ISSCRIPT)',
    desc: 'FS_Scene aciona o pós-processador Freestyle em modo script apontando para sim_cache_utils (flags = 0x405, sem o bit TXT_ISSCRIPT). Até o PR #165375 (5.2.3, 4.5.15 e 5.3.0), prepare() executava o bloco Python sem consultar G_FLAG_SCRIPT_AUTOEXEC.',
    hex: 'ViewLayer.freestyle_settings.mode = 1 | Text["sim_cache_utils"].flags = 0x405 (bit 1<<4 ausente)',
  },
  {
    numeral: 'VI',
    label: 'Loader ChaCha20',
    region: 'zstd',
    sourceRef: 'Text["sim_cache_utils"] + cauda binária (~4,7 MB)',
    symbol: 'bpy.app.timers.register(_tick, 2) -> HMAC-SHA256 + ChaCha20 + LZMA2',
    desc: 'Dois segundos após abrir a cena, _validate() consulta %TEMP%\\sim_cache.idx, requisita 32 bytes em GET /k na porta 8787 contornando proxies do sistema, confere HMAC-SHA256, decifra o payload com ChaCha20 + XOR, descomprime LZMA2 e grava %TEMP%\\sim_cache.exe.',
    hex: 'const = (0x61000000 | 0x707865) | urllib.request.ProxyHandler({}) | lzma.FILTER_LZMA2 -> %TEMP%\\sim_cache.idx',
  },
];

export const DEFANGED_IOCS = [
  {
    kind: 'Endpoint C2 (desarmado)',
    value: 'hxxp://31.76.102[.]218:8787/k',
    note: 'Requisição GET TCP na porta 8787 sem TLS, User-Agent Python-urllib/3.x e ProxyHandler vazio',
  },
  {
    kind: 'Artefatos em disco (Windows)',
    value: '%TEMP%\\sim_cache.exe   |   %TEMP%\\sim_cache.idx',
    note: 'Executável reconstruído após decifragem ChaCha20 e arquivo de trava para execução única',
  },
  {
    kind: 'Bloco de texto camuflado',
    value: 'Text["sim_cache_utils"]  (flags = 0x405)',
    note: 'Omissão deliberada de TXT_ISSCRIPT (1 << 4) para escapar de varreduras por scripts registrados',
  },
  {
    kind: 'Assinaturas estáticas do loader',
    value: '(0x61000000 | 0x707865)   |   FILTER_LZMA2   |   b85decode',
    note: 'Constante "expa" do estado ChaCha20 montada por OR bit a bit em meio a comentários de simulação',
  },
];

export const ESP32_MILESTONES = [
  'Marcos 1–3: mapeamento de GPIOs, leitura de pulso ultrassônico HC-SR04 e máquina de estados determinística.',
  'Marcos 4–5: integração do visor LCD 16×2 via I2C (0x27) com escrita diferencial que elimina cintilação.',
  'Marcos 6–7: segundo canal ultrassônico dedicado à saída e isolamento temporal contra eco cruzado (crosstalk).',
  'Marcos 8–10: pilha Wi-Fi e migração de WiFiClient para WiFiClientSecure com TLS rumo ao HiveMQ Cloud.',
  'Marcos 11–13: reconexão MQTT não-bloqueante, janela física de cooldown de 1,2 s e telemetria JSON consolidada.',
];

export const BLEND_TOOLS = [
  {
    name: 'tools/zstd_walk.py',
    role: ' Enumera quadros seekable Zstd e isola os ~4,7 MB apensados após o fim lógico das estruturas DNA.',
  },
  {
    name: 'tools/blend_sdna_dump.py',
    role: 'Reconstrói o catálogo SDNA do Blender 5.2.1 (flags, cenas, strips e SpaceSeq) em Python puro, sem abrir a GUI.',
  },
  {
    name: 'tools/validate_chain.py',
    role: 'Prova estaticamente o grafo completo: Screen["Layout"] -> OB_RENDER -> fs_strip -> FS_Scene -> R_EDGE_FRS.',
  },
  {
    name: 'tools/prng_tests.py',
    role: 'Mede entropia e padrões determinísticos deixados pelo gerador do arquivo malicioso.',
  },
];

export type CiscoNodeKey = 'isp' | 'asa' | 'sw1' | 'sw2' | 'swsrv' | 'access';

export const CISCO_NODES: Record<
  CiscoNodeKey,
  { title: string; role: string; interfaces: string; detail: string }
> = {
  isp: {
    title: 'Roteador ISP Cisco 2911 ISR',
    role: 'Trânsito Público Simulado — 8.8.8.1/24',
    interfaces: 'Gig0/2 (loopback pública)  |  Serial/Gig WAN 200.0.0.0/30',
    detail:
      'Representa a operadora externa, originando rota pública para validação ponta a ponta de NAT/PAT e testes de conectividade a partir das 21 VLANs internas.',
  },
  asa: {
    title: 'Firewall Cisco ASA 5506-X',
    role: 'Perímetro Stateful e Tradução PAT',
    interfaces: 'outside: 200.0.0.2/30  |  inside-1: 192.168.210.0/30  |  inside-2: 192.168.220.0/30',
    detail:
      'Inspeciona estado de sessões TCP/UDP/ICMP na borda, executa PAT na saída WAN e mantém dois enlaces L3 independentes até os switches de núcleo colapsado.',
  },
  sw1: {
    title: 'Switch1-3 (Catalyst 3650-24PS)',
    role: 'Núcleo Colapsado Primário — HSRP Prioridade 110 (Preempt)',
    interfaces: 'Peer-link 802.1Q: Gi1/0/13  |  21 SVIs ativas  |  Uplink L3: 192.168.210.0/30',
    detail:
      'Concentra o roteamento inter-VLAN ativo para todo o campus, com grupos HSRP espelhando o ID de cada VLAN e retomada automática (preempt) após restabelecimento.',
  },
  sw2: {
    title: 'Switch2-3 (Catalyst 3650-24PS)',
    role: 'Núcleo Colapsado Secundário — HSRP Prioridade 100 (Standby)',
    interfaces: 'Peer-link 802.1Q: Gi1/0/13  |  21 SVIs em escuta  |  Uplink L3: 192.168.220.0/30',
    detail:
      'Monitora continuamente os hellos HSRP pelo tronco dedicado Gi1/0/13 e assume o IP virtual das 21 VLANs sem queda de encaminhamento se o Switch1-3 falhar.',
  },
  swsrv: {
    title: 'Switch L2 de Servidores (Catalyst 2960)',
    role: 'Agregação Dedicada — VLAN 230 (192.168.230.0)',
    interfaces: 'Uplinks redundantes Gi1/0/23  |  Servidor DHCP central: 192.168.230.1',
    detail:
      'Segmenta o serviço centralizado de concessão IP (ip helper-address nas SVIs do núcleo) com dupla subida física para evitar ponto único de falha.',
  },
  access: {
    title: '12 Switches Catalyst 2960-24TT e 54 APs',
    role: 'Camada de Acesso — Prédios A–F (~389 Estações)',
    interfaces: 'Gi0/1 -> Switch1-3  |  Gi0/2 -> Switch2-3  |  PVST+ e PortFast',
    detail:
      'Cada prédio conta com dupla subida física (dual-homing) rumo aos dois Catalyst 3650, convergência PVST+ alinhada ao HSRP ativo e 54 pontos de acesso distribuídos nas VLANs sem fio.',
  },
};

export interface CampusVlanSlice {
  id: string;
  label: string;
  subnet: string;
  scope: string;
  aclPolicy: string;
}

export const CAMPUS_VLAN_SLICES: CampusVlanSlice[] = [
  {
    id: 'wifi',
    label: 'VLANs 70, 80 e 100 — Malha Wi-Fi',
    subnet: '192.168.{70,80,100}.0 /24 (VLSM para alta densidade)',
    scope: '54 pontos de acesso corporativos cobrindo áreas acadêmicas e convivência nos 6 prédios.',
    aclPolicy: 'Permite DHCP (VLAN 230) e saída WAN via ASA; bloqueia acesso lateral às VLANs administrativas.',
  },
  {
    id: 'srv',
    label: 'VLAN 230 — Bloco de Servidores',
    subnet: '192.168.230.0 (Host DHCP canônico: 192.168.230.1)',
    scope: 'Switch L2 dedicado com uplinks duplos Gi1/0/23 recebendo relay ip helper-address das 21 SVIs.',
    aclPolicy: 'Aceita pacotes UDP 67/68 vindos das SVIs e restringe gerência apenas aos segmentos autorizados.',
  },
  {
    id: 'admin',
    label: 'Prédios A–F — Departamentos e Labs',
    subnet: '192.168.[VLAN_ID].0 (/26 a /29 dimensionados sob medida)',
    scope: 'Prédio A (Administração) e Prédios B–F distribuídos em 12 switches Catalyst 2960 (~389 hosts).',
    aclPolicy: '20 ACLs estendidas aplicadas em direção inbound nas SVIs: 1º DHCP, 2º Intra-VLAN, 3º Matriz departamental.',
  },
];

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
  regra: 'T1110.001 — Força bruta RDP seguida de logon',
  event_id: 4624,
  ip_origem: '185.220.101.44',
  preservado: true,
};

export interface PublicRepoEntry {
  folio: string;
  name: string;
  layerCode: string;
  domain: string;
  stackList: string[];
  url: string;
  labHref: string;
  labLabel: string;
  summary: string;
  highlights: string[];
}

export const PUBLIC_REPOS: PublicRepoEntry[] = [
  {
    folio: 'Codex I',
    name: 'Iosephus',
    layerCode: 'Camada L7',
    domain: 'SOC-as-a-Service e Persistência Poliglota',
    stackList: ['Python 3.12', 'FastAPI', 'MySQL 8.4', 'MongoDB 8.0', 'Docker Compose', 'AWS CDK v2'],
    url: 'https://github.com/joaoheliodev/Iosephus',
    labHref: '#pars-iv',
    labLabel: 'Inspecionar livro-razão na Pars IV',
    summary:
      'Plataforma enxuta de operações de segurança para prefeituras e PMEs com separação criptográfica entre evidência bruta e decisão, controle de SLA, autenticação Argon2 e infraestrutura como código.',
    highlights: [
      'MongoDB retém o evento original; MySQL grava o incidente com ObjectId e hash SHA-256 em transação ACID.',
      'Reconciliador periódico a cada 5 minutos apoiado em UNIQUE(alerta_origem_id) contra falhas parciais.',
      'Cenário auditável Prefeitura de Vale Verde (CVE-2019-0708 e técnica MITRE T1110.001) validado no GitHub Actions.',
    ],
  },
  {
    folio: 'Codex II',
    name: 'malicious-blend-analysis',
    layerCode: 'Camada L2',
    domain: 'Engenharia Reversa Estática e Inteligência de Ameaças',
    stackList: ['Python', 'Blender 5.2.1 SDNA', 'Seekable Zstd', 'ChaCha20', 'LZMA2'],
    url: 'https://github.com/joaoheliodev/malicious-blend-analysis',
    labHref: '#pars-ii',
    labLabel: 'Percorrer cadeia SDNA na Pars II',
    summary:
      'Dissecação 100% estática (sem abrir o Blender nem executar código da amostra) de um arquivo .blend capaz de disparar Python com Auto Run desativado por meio do Freestyle e do preview do Sequencer.',
    highlights: [
      'Rastreamento exato da falha em FRS_freestyle.cpp (R_EDGE_FRS + OB_RENDER, corrigida no PR #165375).',
      'Quatro utilitários autorais em tools/ para varredura de frames Zstd, dump SDNA e prova da cadeia.',
      'Inventário completo de indicadores de rede e host devidamente desarmados (IOCs.md e iocs.csv).',
    ],
  },
  {
    folio: 'Codex III',
    name: 'infra_campus_feob',
    layerCode: 'Camada L3',
    domain: 'Arquitetura de Rede Corporativa e Segurança de Borda',
    stackList: ['Cisco IOS', 'Catalyst 3650-24PS', 'Catalyst 2960', 'ASA 5506-X', 'HSRP', 'VLSM'],
    url: 'https://github.com/joaoheliodev/infra_campus_feob',
    labHref: '#pars-iii',
    labLabel: 'Testar failover HSRP na Pars III',
    summary:
      'Projeto físico e lógico de rede universitária cobrindo 6 edifícios, ~389 hosts e 21 VLANs sobre núcleo colapsado redundante, inspeção stateful na borda e filtragem interdepartamental.',
    highlights: [
      'Par Catalyst 3650-24PS em HSRP (prioridade 110 preempt / 100 standby) com peering 802.1Q em Gi1/0/13.',
      'Plano VLSM mnemônico 192.168.[VLAN_ID].0 aliado a 12 switches de acesso em dual-homing e 54 APs.',
      'Configurações .cfg completas, 20 ACLs estendidas documentadas e simulação campus_network_v1.0.pkt.',
    ],
  },
  {
    folio: 'Codex IV',
    name: 'projeto-pi-estacionamento-inteligente',
    layerCode: 'Camada L1',
    domain: 'Sistemas Embarcados em C++ e Telemetria Segura',
    stackList: ['C++', 'ESP32 DevKit V1', 'HC-SR04', 'LCD 16×2 I2C', 'WiFiClientSecure', 'MQTT TLS'],
    url: 'https://github.com/joaoheliodev/projeto-pi-estacionamento-inteligente',
    labHref: '#pars-i',
    labLabel: 'Operar matriz de vagas na Pars I',
    summary:
      'Controlador embarcado de pátio automotivo em tempo real com máquina de estados finitos, par ultrassônico dedicado, escrita diferencial em barramento I2C e publicação TLS na nuvem.',
    highlights: [
      'Isolamento temporal entre os canais GPIO 4/2 (entrada) e GPIO 26/25 (saída) contra eco cruzado.',
      'Janela física de cooldown contra repique e reconexão MQTT assíncrona rumo ao HiveMQ Cloud.',
      'Engenharia documentada passo a passo ao longo de 13 marcos de evolução (Equipe 13 — UNIFEOB).',
    ],
  },
];

export const CAPABILITIES_LEDGER = [
  {
    folio: 'I',
    layer: 'Camada Física e Embarcados (L1)',
    latin: 'Ex materia',
    tools: 'C, C++, ESP32 DevKit V1, temporização de sensores HC-SR04, barramento I2C sem cintilação, WiFiClientSecure e telemetria MQTT sobre TLS.',
  },
  {
    folio: 'II',
    layer: 'Anatomia Binária e Forense (L2)',
    latin: 'Sine executione',
    tools: 'Python aplicado à engenharia reversa estática, leitura de estruturas SDNA, inspeção de frames seekable Zstd, análise ChaCha20/LZMA2 e curadoria de IOCs desarmados.',
  },
  {
    folio: 'III',
    layer: 'Comutação, Roteamento e Perímetro (L3)',
    latin: 'Per fines',
    tools: 'Cisco IOS, switches L3 Catalyst 3650 e L2 2960, firewall stateful ASA 5506-X, sub-redes VLSM, alta disponibilidade HSRP, PVST+ e ACLs estendidas.',
  },
  {
    folio: 'IV',
    layer: 'Custódia Criptográfica, Dados e Nuvem (L7)',
    latin: 'Ad nubem',
    tools: 'Python 3.12, FastAPI, MySQL 8.4, MongoDB 8.0, Argon2 e RBAC, Docker Compose, integração contínua em GitHub Actions, AWS CDK v2 e POO em Dart.',
  },
];
