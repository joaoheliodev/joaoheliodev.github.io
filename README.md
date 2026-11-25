# Codex Custodis — Ex Silicio ad Nubem

Portfólio autoral de engenharia de **João Hélio dos Reis Souza (`@joaoheliodev`)**, desenvolvido em **React 19, TypeScript, Vite 8, React Three Fiber (`Three.js`) e Motion**.

Publicado em produção: **[https://joaoheliodev.github.io/](https://joaoheliodev.github.io/)**

---

## Direção Editorial e Arquitetura Visual

Concebido como um tratado técnico iluminado (*Codex Custodis*) em vez de um template SaaS convencional, o projeto combina:

- **Tipografia editorial:** `Fraunces` (`SOFT=100`, optical sizing) para cabeçalhos e glosas latinas, `Plus Jakarta Sans` para leitura contínua e `JetBrains Mono` reservada estritamente para código, registradores GPIO, sub-redes IPv4, estruturas SDNA e hashes `SHA-256`.
- **Duas edições cromáticas com troca instantânea (`0 ms`):** **Vigília Noturna** (`#111727` obsidiana/índigo e ouro envelhecido `#C8A446`) e **Pergaminho** (`#F6F0E2` marfim cálido e ouro umbra `#96721B`), texturizadas com grão sutil de papel velino em SVG estático.
- **Índice marginal em fio de prumo (`FolioMarginRail.tsx`) e costuras rasgadas (`TornPaperSeam.tsx`):** navegação lateral e divisórias de capítulos conduzidas por `MotionValues` (`useScroll` + `useSpring` + `useTransform`) animando exclusivamente `transform` e `opacity` no compositor, sem re-renderizações do React durante a rolagem.

---

## Santuário Romano 3D em PBR e Fluidez (`60/120 fps`)

Implementado em `src/components/CodexSanctuary3D.tsx` e `src/utils/sanctuaryTextures.ts`:

- **Iluminação Física (`PMREMGenerator`) + `THREE.NeutralToneMapping` + `PCFSoftShadowMap` (`2048×2048`):** mapa de ambiente HDR procedural cacheado por tema, normal maps em espaço tangente via operador de Sobel otimizado em `Float32Array`, `bumpMap` e `roughnessMap` em mármore veiado (`fBm` com *domain warping*) e bronze escovado.
- **Consolidação massiva em `InstancedMesh` e Zero Layout Reflow:**
  - Todas as métricas de página são medidas apenas via `ResizeObserver` fora do loop de animação (nenhuma leitura de `scrollHeight` ou `getBoundingClientRect` dentro de `useFrame`).
  - Colunata romana (bases áticas, fustes de 20 caneluras com êntase, astrágalos, capitéis compostos, ábacos, nervuras de abóbada, rosetas e chaves de arco), aros do astrolábio, pés torneados em latão, tríglifos, coroa de louros, colares das 12 teclas, partículas atmosféricas (`160` instâncias) e fios de incenso (`16` instâncias) são consolidados em `InstancedMesh`, reduzindo drasticamente as *draw calls* da GPU.
  - Pré-aquecimento assíncrono em *idle time* (`requestIdleCallback`) das texturas da edição oposta para alternância instantânea entre **Vigília** e **Pergaminho**.
- **Artefatos Esculpidos na `Tabula Romana`:**
  - **12 Tésseras táteis esculpidas** (numerais romanos `I`–`XII`, entalhe tipográfico sem reflexo especular cegante, amortecimento independente de taxa de quadros `THREE.MathUtils.damp`, teclas de atalho `1–9, 0, -, =` e ressonância harmônica opcional via Web Audio API).
  - **2 castiçais votivos torneados** (`LatheGeometry`) com cera de abelha translúcida, chama dupla pulsante e plumas suaves de incenso ascendente.
  - **Pergaminho enrolado (`Volumen`) com fita carmesim e estilete romano torneado em bronze (`Graphium`)** pousados na borda frontal, ao lado do lacre derretido `SIGILLVM` e do leitor de cristal `CVSTOS`.
  - **Abside romana em perspectiva:** 8 colunas caneladas, 7 arcos plenos, 2 lanternas votivas suspensas em pêndulo, rosácea `Rosa Vitrea` com feixes volumétricos sutis e pavimento *Opus Sectile*.

---

## Quatro Dossiês Interativos e `Index Codicum`

Todos os instrumentos refletem fielmente os artefatos verificados nos repositórios públicos de `@joaoheliodev`:

1. **Pars I — [`projeto-pi-estacionamento-inteligente`](https://github.com/joaoheliodev/projeto-pi-estacionamento-inteligente) (Camada L1):**
   - Planta interativa de **12 vagas**, espelho em tempo real do visor **LCD 16×2 I2C (`0x27`, `GPIO 21/22`)** com contador de escritas poupadas pela atualização diferencial, isolamento anti-crosstalk de `1,2 s` entre os dois sensores **HC-SR04** (`GPIO 4/2` e `GPIO 26/25`) e console MQTT sobre TLS (`HiveMQ Cloud`).
2. **Pars II — [`malicious-blend-analysis`](https://github.com/joaoheliodev/malicious-blend-analysis) (Camada L2):**
   - Mapa estrutural do binário `.blend` (`5.2.1`) sincronizado ao inspetor de 6 elos no **SDNA** (`Load UI` -> `SPACE_SEQ` -> `OB_RENDER` -> `fs_strip` -> `FRS_freestyle.cpp` sem `TXT_ISSCRIPT` -> loader `ChaCha20 + LZMA2`), referências ao **PR #165375**, ferramentas em `tools/` e envelope lacrado rasgável (`TearableWaxSeal`) guardando os IOCs desarmados.
3. **Pars III — [`infra_campus_feob`](https://github.com/joaoheliodev/infra_campus_feob) (Camada L3):**
   - Prancha topológica clicável em SVG com animação de fluxo nos troncos ativos, simulação de queda e *preempt* **HSRP** entre os dois **Catalyst 3650-24PS** (`Gi1/0/13`), perímetro **Cisco ASA 5506-X**, **12 switches Catalyst 2960** + **54 APs** (~389 estações em 6 prédios) e inspetor interativo de recortes **VLSM** (`192.168.[VLAN_ID].0`) e **20 ACLs estendidas**.
4. **Pars IV — [`Iosephus`](https://github.com/joaoheliodev/Iosephus) (Camada L7):**
   - Livro-razão aberto unindo **MongoDB 8.0** (`Factum Crudum`) e **MySQL 8.4** (`Decisio Signata`) por `ObjectId` + `SHA-256`, verificação criptográfica ao vivo, simulação de adulteração e **simulador interativo do protocolo de escrita em 3 fases + reconciliador idempotente de 5 minutos** (`UNIQUE(alerta_origem_id)`).
5. **Index Codicum e Terminal (`Ctrl+K`):**
   - Catálogo em formato de livro-razão aberto dos repositórios públicos, histórico acadêmico na **UNIFEOB**, terminal interativo (`whoami`, `ls`, `stack`, `stats`, `sha256`, `theme`, `goto`) e canais diretos (**GitHub**, **LinkedIn** e **E-mail**).

---

## Execução Local

```bash
git clone https://github.com/joaoheliodev/joaoheliodev.github.io.git
cd joaoheliodev.github.io
npm install
npm run dev
```

Build de verificação estática TypeScript e empacotamento de produção:

```bash
npm run build
npm run preview
```

---

## Publicação Contínua (GitHub Pages)

O workflow `.github/workflows/deploy.yml` executa `npm ci && npm run build` a cada *push* na branch `main` e publica o artefato estático `dist/` diretamente em `https://joaoheliodev.github.io/`.
