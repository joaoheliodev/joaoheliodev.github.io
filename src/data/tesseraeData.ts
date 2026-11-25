export interface TesseraSkill {
  id: string;
  roman: string;
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
    roman: 'I',
    keyHint: '1',
    code: 'C / C++',
    layer: 'L1',
    latin: 'Ex materia',
    title: 'Firmware C e C++ em Tempo Real',
    desc: 'Máquina de estados determinística, leitura direta de registradores GPIO e controle previsível de latência no ESP32.',
    targetHref: '#pars-i',
    freqHz: 293.66, // D4
  },
  {
    id: 'esp32',
    roman: 'II',
    keyHint: '2',
    code: 'ESP32',
    layer: 'L1',
    latin: 'Signum physicum',
    title: 'ESP32 DevKit V1 e Sensores HC-SR04',
    desc: 'Amostragem ultrassônica dupla com isolamento de eco cruzado, janela física de 1,2 s e visor LCD 16×2 I2C diferencial.',
    targetHref: '#pars-i',
    freqHz: 329.63, // E4
  },
  {
    id: 'mqtt',
    roman: 'III',
    keyHint: '3',
    code: 'MQTT',
    layer: 'L1',
    latin: 'Nuntius tutus',
    title: 'Telemetria MQTT sobre TLS',
    desc: 'Publicação cifrada via WiFiClientSecure rumo ao HiveMQ Cloud com reconexão assíncrona que não bloqueia os sensores.',
    targetHref: '#pars-i',
    freqHz: 349.23, // F4
  },
  {
    id: 'python',
    roman: 'IV',
    keyHint: '4',
    code: 'PYTHON',
    layer: 'L2',
    latin: 'Instrumentum',
    title: 'Python 3.12 para Forense e Backend',
    desc: 'Ferramentas de dissecação binária (SDNA e Zstd seekable) e motores assíncronos de correlação de incidentes.',
    targetHref: '#pars-ii',
    freqHz: 392.0, // G4
  },
  {
    id: 'sdna',
    roman: 'V',
    keyHint: '5',
    code: 'SDNA',
    layer: 'L2',
    latin: 'Anatomia codicis',
    title: 'Engenharia Reversa Estática de .blend',
    desc: 'Auditoria das estruturas DNA do Blender 5.2.1 (OB_RENDER, R_EDGE_FRS, ausência de TXT_ISSCRIPT) sem abrir o binário.',
    targetHref: '#pars-ii',
    freqHz: 440.0, // A4
  },
  {
    id: 'crypto',
    roman: 'VI',
    keyHint: '6',
    code: 'CRYPTO',
    layer: 'L2',
    latin: 'Arcanum solutum',
    title: 'ChaCha20, HMAC-SHA256 e LZMA2',
    desc: 'Reconstrução estática da derivação de chaves do loader, validação criptográfica e extração segura de IOCs desarmados.',
    targetHref: '#pars-ii',
    freqHz: 493.88, // B4
  },
  {
    id: 'cisco',
    roman: 'VII',
    keyHint: '7',
    code: 'CISCO',
    layer: 'L3',
    latin: 'Viae imperii',
    title: 'Cisco Catalyst 3650 e 2960',
    desc: 'Arquitetura de núcleo colapsado para 6 edifícios universitários, ~389 estações, 21 VLANs em VLSM e 54 APs corporativos.',
    targetHref: '#pars-iii',
    freqHz: 523.25, // C5
  },
  {
    id: 'asa',
    roman: 'VIII',
    keyHint: '8',
    code: 'ASA',
    layer: 'L3',
    latin: 'Muri et portae',
    title: 'Perímetro Cisco ASA 5506-X',
    desc: 'Inspeção stateful na borda WAN, tradução PAT e 20 listas de controle de acesso estendidas aplicadas nas SVIs.',
    targetHref: '#pars-iii',
    freqHz: 587.33, // D5
  },
  {
    id: 'hsrp',
    roman: 'IX',
    keyHint: '9',
    code: 'HSRP',
    layer: 'L3',
    latin: 'Duplex via',
    title: 'Redundância HSRP e PVST+',
    desc: 'Continuidade de gateway entre Switch1-3 (prioridade 110 preempt) e Switch2-3 (standby 100) com troncos 802.1Q duplos.',
    targetHref: '#pars-iii',
    freqHz: 659.25, // E5
  },
  {
    id: 'fastapi',
    roman: 'X',
    keyHint: '0',
    code: 'FASTAPI',
    layer: 'L7',
    latin: 'Custos datorum',
    title: 'Iosephus — Plataforma SOC-as-a-Service',
    desc: 'Ingestão autenticada de telemetria, correlação a cada 30 segundos, RBAC com Argon2 e controle rigoroso de SLA.',
    targetHref: '#pars-iv',
    freqHz: 698.46, // F5
  },
  {
    id: 'sql-nosql',
    roman: 'XI',
    keyHint: '-',
    code: 'SQL/NOSQL',
    layer: 'L7',
    latin: 'Hash manet',
    title: 'Persistência Poliglota MySQL 8.4 e MongoDB 8.0',
    desc: 'Separação estrita entre evidência bruta imutável no documento NoSQL e decisão auditável ancorada por SHA-256 em ACID.',
    targetHref: '#pars-iv',
    freqHz: 783.99, // G5
  },
  {
    id: 'aws-cdk',
    roman: 'XII',
    keyHint: '=',
    code: 'AWS CDK',
    layer: 'L7',
    latin: 'Ad nubem',
    title: 'Docker Compose, CI e AWS CDK v2',
    desc: 'Orquestração de serviços reproduzível, suítes automatizadas no GitHub Actions e infraestrutura descrita em código Python.',
    targetHref: '#pars-iv',
    freqHz: 880.0, // A5
  },
];
