export interface TesseraSkill {
  id: string;
  keyHint: string;
  code: string;
  layer: 'L1' | 'L2' | 'L3' | 'L7';
  latin: string;
  title: string;
  desc: string;
  targetHref: string;
  freqHz: number;
}

export const TESSERAE: TesseraSkill[] = [
  {
    id: 'c-cpp',
    keyHint: '1',
    code: 'C / C++',
    layer: 'L1',
    latin: 'Ex materia',
    title: 'Firmware C/C++ em Tempo Real',
    desc: 'Máquina de estados determinística, controle de pinos GPIO e baixa latência no ESP32.',
    targetHref: '#pars-i',
    freqHz: 293.66, // D4
  },
  {
    id: 'esp32',
    keyHint: '2',
    code: 'ESP32',
    layer: 'L1',
    latin: 'Signum physicum',
    title: 'ESP32 DevKit V1 & HC-SR04',
    desc: 'Leitura ultrassônica dupla com isolamento anti-crosstalk, cooldown de 1,2 s e LCD 16×2 I2C.',
    targetHref: '#pars-i',
    freqHz: 329.63, // E4
  },
  {
    id: 'mqtt',
    keyHint: '3',
    code: 'MQTT',
    layer: 'L1',
    latin: 'Nuntius tutus',
    title: 'Telemetria MQTT sobre TLS',
    desc: 'Publicação segura via WiFiClientSecure para HiveMQ Cloud com reconexão não-bloqueante.',
    targetHref: '#pars-i',
    freqHz: 349.23, // F4
  },
  {
    id: 'python',
    keyHint: '4',
    code: 'PYTHON',
    layer: 'L2',
    latin: 'Instrumentum',
    title: 'Python 3.12 · Forense & Backend',
    desc: 'Scripts de dissecação binária (SDNA/Zstd) e motores de correlação de incidentes.',
    targetHref: '#pars-ii',
    freqHz: 392.0, // G4
  },
  {
    id: 'sdna',
    keyHint: '5',
    code: 'SDNA',
    layer: 'L2',
    latin: 'Anatomia codicis',
    title: 'Análise Estática de .blend',
    desc: 'Inspeção de flags do Blender 5.2.1 (OB_RENDER, R_EDGE_FRS, TXT_ISSCRIPT) sem executar a amostra.',
    targetHref: '#pars-ii',
    freqHz: 440.0, // A4
  },
  {
    id: 'crypto',
    keyHint: '6',
    code: 'CRYPTO',
    layer: 'L2',
    latin: 'Arcanum solutum',
    title: 'ChaCha20 · HMAC-SHA256 · LZMA2',
    desc: 'Mapeamento estático da derivação de chaves, verificação de integridade e extração de IOCs desarmados.',
    targetHref: '#pars-ii',
    freqHz: 493.88, // B4
  },
  {
    id: 'cisco',
    keyHint: '7',
    code: 'CISCO',
    layer: 'L3',
    latin: 'Viae imperii',
    title: 'Cisco Catalyst 3650 & 2960',
    desc: 'Topologia Collapsed Core para 6 prédios, ~389 hosts, 21 VLANs segmentadas por VLSM e 54 APs.',
    targetHref: '#pars-iii',
    freqHz: 523.25, // C5
  },
  {
    id: 'asa',
    keyHint: '8',
    code: 'ASA',
    layer: 'L3',
    latin: 'Muri et portae',
    title: 'Firewall Cisco ASA 5506-X',
    desc: 'Inspeção stateful de borda, PAT na interface outside e 20 ACLs estendidas inter-VLAN.',
    targetHref: '#pars-iii',
    freqHz: 587.33, // D5
  },
  {
    id: 'hsrp',
    keyHint: '9',
    code: 'HSRP',
    layer: 'L3',
    latin: 'Duplex via',
    title: 'Alta Disponibilidade HSRP & PVST+',
    desc: 'Redundância de gateway (priority 110 preempt / 100 standby) com failover automático nas 21 SVIs.',
    targetHref: '#pars-iii',
    freqHz: 659.25, // E5
  },
  {
    id: 'fastapi',
    keyHint: '0',
    code: 'FASTAPI',
    layer: 'L7',
    latin: 'Custos datorum',
    title: 'Iosephus · SOC-as-a-Service',
    desc: 'Ingestão de logs de segurança, motor de correlação a cada 30 s, RBAC com Argon2 e gestão de SLA.',
    targetHref: '#pars-iv',
    freqHz: 698.46, // F5
  },
  {
    id: 'sql-nosql',
    keyHint: '-',
    code: 'SQL/NOSQL',
    layer: 'L7',
    latin: 'Hash manet',
    title: 'MySQL 8.4 + MongoDB 8.0 Poliglota',
    desc: 'MongoDB guarda o fato bruto; MySQL guarda a decisão ligada por ObjectId + SHA-256 em COMMIT ACID.',
    targetHref: '#pars-iv',
    freqHz: 783.99, // G5
  },
  {
    id: 'aws-cdk',
    keyHint: '=',
    code: 'AWS CDK',
    layer: 'L7',
    latin: 'Ad nubem',
    title: 'Docker Compose, CI & AWS CDK v2',
    desc: 'Infraestrutura como código, testes automatizados no GitHub Actions e arquitetura pronta para nuvem.',
    targetHref: '#pars-iv',
    freqHz: 880.0, // A5
  },
];
