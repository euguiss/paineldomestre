# Esquema do Pacote de Importação

Versão do esquema: **1** (`schemaVersion: 1`).

O importador (seção 6.1) carrega conteúdo dos **seus próprios livros**, por lotes, de modo que
**cidade e cenários se conectem**. Não confunda com o backup do mundo inteiro (Configurações).

- **Entrada:** JSON, `.md`, `.txt` ou texto colado. O app **não lê PDF** — extraia o texto antes.
- **Referências entre entidades vão por NOME/chave, nunca por id interno.**
- Cada entidade tem `externalKey` (slug estável). Reimportar **atualiza** em vez de duplicar.
- O que o texto-fonte não traz **não é inventado**: fica como pendência.

A validação é feita com **zod** em `src/import/packageSchema.ts`.

## Modo Cidade

Cria/atualiza **Locais, NPCs e Facções**. Locais entram **sem pino** (sem coordenadas); você os
arrasta da lista para o mapa depois.

```jsonc
{
  "schemaVersion": 1,
  "mode": "cidade",
  "label": "Innsmouth — Distrito do Porto",
  "locations": [
    {
      "externalKey": "armazem-enseada",   // slug estável (obrigatório)
      "name": "Armazém da Enseada",         // obrigatório
      "aliases": ["Galpão do Píer"],
      "kind": "armazem",                    // casa|loja|igreja|porto|armazem|taverna|instituicao|outro
      "district": "Porto",
      "baseDescription": "…",
      "readAloud": { "generico": "> …", "noite": "> …" },
      "sensoryDetails": ["…"],
      "geradoPorIA": ["readAloud"],         // textos gerados por IA
      "pending": ["agenda"],                // pendências declaradas
      "source": { "label": "Livro X, cap. 3", "pageRef": "p. 45" }
    }
  ],
  "npcs": [
    { "externalKey": "…", "name": "…", "appearance": "…", "voiceAndMannerisms": "…", "statBlockMarkdown": "…" }
  ],
  "factions": [
    { "externalKey": "…", "name": "…", "goals": "…", "resources": "…" }
  ]
}
```

## Modo Cenário

Cria **Trama** (verdade oculta, relógio, conclusões), **Pistas**, **Cartões de cena** e as
**camadas** (de local e de NPC). As referências a locais/NPCs vão por nome/chave e passam pela
**tela de reconciliação** antes de serem aplicadas.

```jsonc
{
  "schemaVersion": 1,
  "mode": "cenario",
  "label": "A Maré que Lembra",
  "plot": {
    "externalKey": "mare",
    "name": "A Maré que Lembra",
    "sourceModule": "Cenário publicado X",
    "hiddenTruth": "…",
    "antagonists": "…",
    "threatLevel": 3,
    "clockSegments": 6,                      // 4 | 6 | 8 | 12
    "conclusions": [ { "externalKey": "con1", "title": "…", "description": "…" } ]
  },
  "clues": [
    {
      "externalKey": "pista-1",
      "text": "…",
      "locationRef": "Armazém da Enseada",   // por NOME (reconciliado)
      "npcRef": "Teobaldo Marsh",
      "howToObtain": "Perceber (Difícil)",
      "difficulty": "Dificil",               // Regular | Dificil | Extremo
      "isBridge": false,
      "revealsConclusion": "con1",
      "inferido": false
    }
  ],
  "scenes": [
    { "externalKey": "cena-1", "title": "…", "locationRef": "…", "trigger": "…", "openingText": "> …", "whatHappens": "…" }
  ],
  "locationLayers": [
    { "locationRef": "…", "whatChanges": "…", "readAloudAppend": "> …", "readAloudOverride": "> …" }
  ],
  "npcLayers": [
    { "npcRef": "…", "knows": "…", "hides": "…", "revealsIfPressed": "…" }
  ]
}
```

## Reconciliação (o que conecta cenário e cidade)

Para cada `locationRef`/`npcRef`, o app sugere uma correspondência com nível de confiança:

1. **exata** — nome ou `externalKey` idêntico;
2. **alias** — bate com um `aliases`;
3. **aproximada** — similaridade de texto acima do limiar;
4. **nenhuma** — sem candidato.

Ações possíveis (nada é aplicado sem confirmação):

- **Casar com existente**
- **Mapear para outro** ("mover o palco": guarda o nome original em `aliases` e a nota "Originalmente: X")
- **Fundir com NPC existente** (mantém a ficha e acrescenta a camada da trama)
- **Criar novo** ou **Ignorar**

## Segurança do lote

Cada importação vira um `ImportBatch` com os ids criados e um snapshot do que foi atualizado,
permitindo **desfazer o lote inteiro**. Importação parcial é permitida com aviso.

## Exemplos

Veja `exemplos/pacote-cidade.json` e `exemplos/pacote-cenario.json`. O cenário referencia
três locais da cidade de propósito: um por **nome exato** (`Armazém da Enseada`), um por **alias**
(`Galpão do Terceiro Píer`) e um **inexistente** (`Observatório da Colina`), para demonstrar os
quatro resultados da reconciliação.
