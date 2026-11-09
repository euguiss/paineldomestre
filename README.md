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
7. **Modo sessão:** clique em **"Iniciar sessão"** no topo. Com a sessão ativa, as ações rápidas
   (marcar pista, "morreu", revelar local, desfechos de cena, entregar handout) viram eventos no
   **Diário** automaticamente. Pressione **`N`** para uma nota rápida vinculada ao item em foco.

### Markdown do Mestre

Nos textos longos você pode usar blocos especiais:

- `> texto` → **leitura em voz alta** (destaque serifado grande)
- `:::segredo ... :::` → **apenas Mestre** (caixa vermelha; fica escondido na pré-visualização "como o jogador vê" dos handouts)
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
| `effects.ts` | Effects + `recordEvent` — aplica mudanças e registra o evento (5.7) |
| `clocks.ts` | 5.4 — quais beats sugerir ao avançar o relógio de cada trama |
| `threeCluesRule.ts` | 5.5 — cobertura de pistas por conclusão (regra dos três) |
| `consistency.ts` | 5.6 — avisos entre mesas ("esta mesa ainda não sabe disso") |
| `graph.ts` | 6.8 — grafo de conexões e matriz de cruzamentos (nós de cruzamento) |
| `cocRules.ts` | 13 — cálculos CoC 7e (derivados, metade/quinto, pontos) |
| `coverage.ts` | 13 — cobertura investigadores × tramas, alertas |
| `search.ts` | 6.11 — busca global em nome/texto/tags |
| `import/reconcile.ts` | 6.1 — reconciliação (exata/alias/aproximada) |
| `import/applyBatch.ts` | 6.1 — aplicar lote (idempotente), snapshot e desfazer |

### Decisões

- Gerenciador de pacotes: **pnpm**. Grafo: **React Flow** (planejado p/ Fase 4). Ícones: **lucide-react** (empacotado).
- IDs via `crypto.randomUUID()`. Export/import do mundo com blobs em **base64**.
- A store do Dexie para "mesas" é exposta como **`gameTables`** (o nome `tables` é reservado pelo Dexie).
- **App exclusivo do Mestre e offline.** Por decisão de projeto, **não existe Visão do Jogador**: nenhuma rota, janela ou canal para jogadores. A única superfície voltada ao jogador é a pré-visualização "como o jogador vê" dos handouts (que esconde segredos via `hideSecrets` no renderizador de markdown).

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

### ✅ Fase 3
- **Biblioteca de Handouts:** grade com prévia, upload por botão **ou arrastar-e-soltar** (imagem/PDF) e handouts de texto; vínculo a pista/local; botão **"entregar à mesa X"**; pré-visualização **"como o jogador vê"** (sem notas do Mestre).
- **Cartões de cena** no dossiê com **desfechos clicáveis** que aplicam `Effect` e registram o evento.
- **Diário / Linha do Tempo:** eventos por data de jogo, filtro por mesa e tipo, nota editável inline.
- **Modo sessão:** iniciar/encerrar sessão na barra superior; com sessão ativa, toda ação rápida (pista descoberta, NPC morreu, local revelado, desfecho de cena, entrega de handout) **gera um Event** automaticamente com a mesa e a data de jogo corretas.
- **Nota rápida (atalho `N`)** vira um Event do tipo "nota" vinculado à entidade em foco.
- Testes: aplicação de cada `Effect` e `recordEvent` (total: **32**).

### ✅ Fase 4
- **"Avançar tempo":** diálogo para escolher quantos dias passam e quanto cada trama avança. Beats que ficam devidos entram na fila **"Acontecendo no mundo"**; o Mestre **confirma, edita ou descarta** cada um (nada é aplicado sozinho). Confirmar aplica os `Effect` e cria um Event.
- **Regra dos três (5.5):** alerta amarelo no Quadro de Tramas para conclusões com menos de 3 pistas disponíveis.
- **Grafo de Conexões (React Flow):** nós de tramas/NPCs/locais/facções, arestas de pertence/aparece-em/pista-ponte/controla, filtros por tipo e trama, **nós de cruzamento destacados**; clicar num nó abre a entidade.
- **Matriz de cruzamentos:** linhas = NPCs/locais/facções, colunas = tramas, com ✦ nos cruzamentos.
- **Múltiplas mesas (5.6):** avisos de consistência na ficha do NPC ("esta mesa ainda não sabe disso") quando outra mesa alterou a entidade.
- Testes: regra dos três, sugestão de beats, consistência e grafo/matriz (total: **45**).

### ✅ Fase 7 — Sessão 0 (exclusiva do Mestre)
- **Roteiro:** blocos ordenáveis com tempo estimado, notas, concluído e cronômetro.
- **Guia de ambientação:** cartões de lore separando "conhecimento comum" (`>`) de "segredo do Mestre" (`:::segredo`), com prévia; **rumores** com marcação de "contado à mesa X" e **"virar pista-semente" em 1 clique**.
- **Tom e segurança:** linhas, véus, X-card, nível de horror; **regras da casa** ativáveis.
- **Criação de investigadores:** assistente CoC 7e com **valores derivados automáticos** (PV, PM, SAN, MOV, Corpo, Bônus de Dano), **metade/quinto** de cada perícia e **contador de pontos** (ocupação EDU×4 / interesse INT×2) com aviso de excesso. Sempre lembra de conferir o livro.
- **Vínculos com o mundo:** cada investigador liga-se a local/NPC/facção/trama; o vínculo aparece como nota **no dossiê do local e na ficha do NPC** ("ligado ao investigador X").
- **Painel de cobertura:** matriz investigador × trama + alertas de "investigador sem vínculo" e "trama sem nenhum investigador ligado".
- **Modo leitura** em tela cheia (local, sem sincronização) e **ficha para impressão** (HTML/PDF, sem notas do Mestre).
- **Privacidade:** a Sessão 0 é uma aba interna do app do Mestre. Como o app não possui Visão do Jogador nem qualquer canal de sincronização, não há como esse conteúdo chegar aos jogadores.
- Testes: cálculos CoC 7e e cobertura (total: **58**).

### ✅ Fase 5 (ajustada)
- **Busca global** (`Ctrl/Cmd+K`): procura em locais, NPCs, facções, tramas, pistas e handouts (nome, texto e tags), com navegação por teclado.
- **Backup do mundo (Configurações):** exportar/importar tudo em JSON com imagens em **base64** (roundtrip idêntico, coberto por teste), com aviso de direitos autorais. Também: alternar tema, recarregar exemplo e "Começar do zero".
- _A Visão do Jogador foi removida do escopo — app exclusivo do Mestre e offline._

### ✅ Fase 6 — Importador (Cidade e Cenário)
- **Pacote e schema** versionados, validados com **zod**; documentado em `docs/import-schema.md`.
- **Modo Cidade:** cria/atualiza Locais, NPCs e Facções por `externalKey`; locais entram **"sem pino"** (vão ao Painel de Pendências para você arrastar ao mapa); o que o texto não traz vira pendência, não é inventado.
- **Modo Cenário:** cria Trama, Pistas, Cartões de cena e camadas, com **tela de reconciliação** (casar / mapear-mover-o-palco / fundir NPC / criar / ignorar). Nada é aplicado sem confirmação.
- **Idempotência** por `externalKey` (reimportar atualiza, não duplica), **ImportBatch** com snapshot e **Desfazer lote**.
- **Painel de Pendências:** locais sem pino, leituras pendentes, NPCs sem agenda, pistas sem local, conclusões com poucas pistas.
- **Modo A (padrão, offline):** o app gera/copia os **prompts de conversão** (Cidade e Cenário) com o schema embutido; também salvos em `docs/prompt-importar-*.md`.
- **Pacotes de exemplo:** `exemplos/pacote-cidade.json` e `exemplos/pacote-cenario.json` — o cenário referencia um local por **nome exato**, um por **alias** e um **inexistente**, demonstrando a reconciliação.
- Testes: reconciliação, idempotência, desfazer lote, fusão de NPC preservando a ficha, validação dos exemplos (total: **78**).

#### Fora do escopo entregue
- **Modo B do importador (IA dentro do app, com chave de API):** deliberadamente **não implementado**. É opcional e desligado por padrão na especificação; o app continua 100% funcional e offline sem ele. O Modo A (prompts) cobre o mesmo fluxo sem depender de internet.

#### Pendências técnicas conhecidas
- O bundle ainda não é dividido em chunks (aviso de tamanho no build) — será resolvido com
  `import()` dinâmico nas telas pesadas (grafo, mapa) nas próximas fases.
