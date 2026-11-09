# Painel do Mestre

Central de comando **offline-first** para um Mestre (Keeper) de **Call of Cthulhu 7ª edição**
conduzindo uma **campanha sandbox** de mundo aberto em **Arkham** e **Innsmouth**.

Tudo roda localmente no navegador (IndexedDB). Nenhum servidor, nenhuma conta, nenhum dado sai
do seu computador. A interface e o conteúdo de exemplo são em **pt-BR**; o código é em inglês.

> **Direitos autorais:** o app **não** vem com mapas, textos ou handouts de produtos publicados.
> Todo o conteúdo de exemplo é 100% original. Você importa seus próprios arquivos para uso pessoal.

---

## Como rodar

Pré-requisitos: **Node 18+** e **pnpm** (ou npm).

```bash
pnpm install
pnpm dev        # abre em http://localhost:5173
```

Outros comandos:

```bash
pnpm build      # typecheck estrito + build de produção
pnpm test       # testes das regras de negócio (Vitest)
pnpm preview    # serve o build de produção
```

Na primeira execução, o app instala automaticamente um **conteúdo de exemplo** (seed) com dois
mapas, locais, NPCs, facções, tramas, pistas, uma mesa, investigadores e uma Sessão 0. Você pode
**recarregar o exemplo** ou **começar do zero** pela barra de ferramentas do mapa.

---

## Como usar (Fase 1)

1. A tela inicial é o **Mapa**. Use o seletor no canto superior esquerdo para alternar entre
   **Innsmouth** e **Arkham**.
2. **Clique num marcador** (ou num distrito) para abrir o **Dossiê** no painel direito.
3. No topo, escolha a **mesa**, o **período do dia** e **chuva/seco**. O texto de leitura do
   dossiê muda conforme esse contexto (primeira visita, retorno, dia, noite, chuva, genérico).
4. No dossiê você vê, em ordem fixa: leitura → quem está aqui agora → pistas → cartões de cena →
   camadas de trama (ativas/inativas) → handouts → detalhes sensoriais → histórico.
5. Botões de ação rápida: **copiar** a leitura, **modo apresentação** (tela cheia), **marcar pista
   como descoberta**, alternar **visível/oculto** do local.
6. **Importar imagem de mapa:** botão "Importar imagem" na barra do mapa (aceita PNG/JPG/SVG).

### Markdown do Mestre

Nos textos longos você pode usar blocos especiais:

- `> texto` → **leitura em voz alta** (destaque serifado grande)
- `:::segredo ... :::` → **apenas Mestre** (caixa vermelha; nunca aparece na Visão do Jogador)
- `:::teste ... :::` → **mecânica** (ex.: "Rastrear (Difícil)")
- `:::sanidade ... :::` → **perda de Sanidade** (ex.: "0/1d4")

---

## Arquitetura

- **Vite + React + TypeScript (strict)**
- **Dexie (IndexedDB)** como banco, com camada tipada e migrações versionadas (`src/db`)
- **Leaflet + react-leaflet** com `L.CRS.Simple` e `L.imageOverlay` (mapas são imagens)
- **Zustand** para o estado de UI (mesa ativa, período, clima, sessão)
- **react-markdown + remark-gfm** + plugin próprio para as diretivas do Mestre
- **Tailwind** com tema escuro por padrão (claro opcional); fontes empacotadas (`@fontsource`)
- **Vitest** para as regras de negócio

As **regras de negócio** ficam em `src/domain/` como funções puras e testadas:

| Arquivo | Regra |
|---|---|
| `readAloud.ts` | 5.1 — escolha da variante de leitura com cascata de fallback |
| `activation.ts` | 5.2 — avaliação das condições de ativação das camadas |
| `describeCondition.ts` | 5.2 — descrição legível (pt-BR) de uma condição |
| `dossier.ts` | 5.3 — resolução do dossiê do local em tempo de leitura |

### Decisões

- Gerenciador de pacotes: **pnpm**. Grafo: **React Flow** (planejado p/ Fase 4). Ícones: **lucide-react** (empacotado).
- IDs via `crypto.randomUUID()`. Export/import do mundo com blobs em **base64** (Fase 5).
- A store do Dexie para "mesas" é exposta como **`gameTables`** (o nome `tables` é reservado pelo Dexie).
- **Sessão 0** nunca terá rota, link ou canal para a Visão do Jogador (garantido por teste na Fase 7).

---

## Status por fase

### ✅ Fase 1 (atual)
- Projeto, banco Dexie com índices, migrações versionadas
- Mapa Leaflet (`CRS.Simple`) com marcadores por tipo, distritos (polígonos), badges de pistas
- Importar imagem de mapa por upload
- Dossiê do local completo com leitura por contexto, camadas ativas/inativas, pistas, cenas, handouts, histórico
- Modo apresentação e copiar leitura
- Markdown do Mestre com diretivas (`>`, `:::segredo`, `:::teste`, `:::sanidade`)
- Seed 100% original em pt-BR + "Começar do zero"
- Testes: resolução de leitura (5.1) e dossiê (5.3)

### ✅ Fase 2
- **Quadro de Tramas:** cards com relógio segmentado clicável, estado, ameaça, verdade oculta, marcos e conclusões. Mudar o estado/relógio de uma trama liga/desliga suas camadas nos locais e NPCs (o dossiê reavalia ao vivo).
- **NPCs:** grade com busca e filtro por status; ficha com abas (Geral, Ficha CoC, Agenda, Por trama, Relações); camadas por trama com **editor de condição de ativação por formulário** (E/OU aninhados, sem digitar código).
- **Facções:** ficha com objetivos, recursos, membros, locais e camadas de trama.
- **Gerenciador de Pistas:** tabela filtrável por trama/status/ponte, com edição inline de texto e status.
- Testes: avaliação (5.2) e descrição de condições de ativação, além dos anteriores (total: 21).

### ⏳ Pendente (próximas fases)
- **Fase 3:** handouts, cartões de cena editáveis, diário, modo sessão, ações rápidas → eventos
- **Fase 4:** relógios, "Avançar tempo", regra dos três, grafo e matriz de cruzamentos, múltiplas mesas
- **Fase 7:** Sessão 0 (roteiro, lore, rumores, tom, criação de investigadores, vínculos, cobertura)
- **Fase 5:** Visão do Jogador, busca global, exportar/importar mundo (backup)
- **Fase 6:** Importador (Cidade/Cenário), reconciliação, pacotes de exemplo, prompts

#### Pendências técnicas conhecidas
- O bundle ainda não é dividido em chunks (aviso de tamanho no build) — será resolvido com
  `import()` dinâmico nas telas pesadas (grafo, mapa) nas próximas fases.
