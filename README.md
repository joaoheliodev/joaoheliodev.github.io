# Portfólio Web — Codex Custodis × Ex Silicio ad Nubem

Portfólio interativo em **React 19 + TypeScript + Vite 8 + React Three Fiber (`Three.js`) + Motion**, combinando tipografia arredondada e acolhedora (**Fraunces `SOFT=100`** + **Plus Jakarta Sans** + **JetBrains Mono**) com estética clássica em dois temas (**Vigília Noturna** e **Pergaminho**), animações táteis de pergaminho rasgado e santuário romano em **3D PBR fotorrealista**.

🌐 **Site publicado (GitHub Pages):** [`https://joaoheliodev.github.io/`](https://joaoheliodev.github.io/)

## Destaques & Craft Técnico

- **Santuário Romano 3D em PBR (`src/components/CodexSanctuary3D.tsx` & `src/utils/sanctuaryTextures.ts`):**
  - **Iluminação baseada em imagem (`PMREMGenerator`) + `THREE.NeutralToneMapping` + sombras suaves `PCFSoftShadowMap` (`2048×2048`)** combinadas com **normal maps em espaço tangente** (Sobel), `bumpMap` e `roughnessMap` em mármore veiado e bronze escovado.
  - **Altar Isométrico `TABVLA ROMANA`:** 4 pés torneados em latão (`LatheGeometry`) sobre sombra de contato suave, lajes chanfradas arredondadas em mármore com *clearcoat*, **12 Tésseras esculpidas** separadas por grade em bronze escovado, clicáveis em 3D (ou pelas teclas `1–9, 0, -, =`) com micro-inclinação tátil, brilho dinâmico por camada (`L1–L7`) e áudio harmônico opcional em Web Audio.
  - **Detalhes Esculpidos:** 2 castiçais torneados com cera translúcida e chama em gota dupla, selo de lacre carmesim estampado (`SIGILLVM`), placa de contagem ao vivo (`CVSTOS`) coberta por lente de cristal e emblema Chi-Rho (`☧`) com coroa de louros.
  - **Abside da Catedral & Piso *Opus Sectile*:** 8 colunas caneladas de 20 sulcos com êntase clássica, bases áticas e capitéis compostos, arcos romanos com rosetas, nervuras radiais de abóbada, 2 lanternas votivas suspensas em movimento contínuo, rosácea `Rosa Vitrea` com feixes de luz suaves sob névoa atmosférica e **160 partículas em 1 único `InstancedMesh`** (zero `setState` em `useFrame` e fallback automático caso WebGL não esteja disponível).
- **Animações de Pergaminho Rasgado (`TornPaperSeam.tsx` & `TearableWaxSeal.tsx`):**
  - Divisórias de capítulo (`PARS I` a `PARS IV`) que se rasgam progressivamente com o scroll.
  - Envelope lacrado por selo de cera rompível na **Pars II** para revelar os IOCs desarmados.
- **4 Laboratórios Interativos Fiéis aos Repositórios Públicos + Aba GitHub (`#github-archive`):**
  - **Pars I ([`projeto-pi-estacionamento-inteligente`](https://github.com/joaoheliodev/projeto-pi-estacionamento-inteligente)):** planta arquitetônica interativa de **12 vagas** (pátio em matriz obsidiana e ouro), simulação dos sensores HC-SR04 (pinos GPIO, cooldown anti-crosstalk de `1,2 s`), log MQTT TLS em tempo real e tabela de pinagem/marcos.
  - **Pars II ([`malicious-blend-analysis`](https://github.com/joaoheliodev/malicious-blend-analysis)):** inspetor estático em 6 etapas no SDNA (Blender 5.2.1), símbolos `OB_RENDER`/`R_EDGE_FRS`/`TXT_ISSCRIPT`, scripts `tools/` e quarentena rasgável de IOCs desarmados.
  - **Pars III ([`infra_campus_feob`](https://github.com/joaoheliodev/infra_campus_feob)):** prancha topológica *Collapsed Core* Cisco em SVG clicável com simulação de failover HSRP (`Switch1-3` ↔ `Switch2-3`), tabela de dimensionamento para 6 prédios / 21 VLANs / ~389 hosts e documentação VLSM/ACLs.
  - **Pars IV ([`Iosephus`](https://github.com/joaoheliodev/Iosephus)):** livro-razão aberto ligando **MongoDB 8.0** (`Factum Crudum`) e **MySQL 8.4** (`Decisio Signata`) com recálculo real de hash **SHA-256**, simulação de adulteração, consistência em 3 fases, RBAC/Argon2 e IaC em AWS CDK v2.
  - **Arquivo & Colophon:** vitrine dedicada de repositórios públicos e formação acadêmica na **UNIFEOB**, console interativo (`Ctrl+K` / `Console`) e links diretos de contato (**GitHub**, **LinkedIn** e **E-mail**).

---

## Como rodar localmente

```bash
git clone https://github.com/joaoheliodev/joaoheliodev.github.io.git
cd joaoheliodev.github.io
npm install
npm run dev
```

Para gerar e pré-visualizar o build de produção:

```bash
npm run build
npm run preview
```

---

## Deploy automático (GitHub Pages)

O workflow em `.github/workflows/deploy.yml` compila o projeto com `npm ci && npm run build` a cada push na branch `main` e publica a pasta `dist/` diretamente no GitHub Pages (`base: './'` em `vite.config.ts`).
