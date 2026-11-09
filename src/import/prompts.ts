import { IMPORT_SCHEMA_VERSION } from './packageSchema';

/**
 * Conversion prompts (section 6.1, mode A). The app generates ready-to-copy
 * prompts with the schema embedded. The Keeper pastes a prompt plus the book
 * text into any AI chat and imports the JSON that comes back — fully offline
 * from the app's point of view.
 */

const RULES = `Regras obrigatórias:
- NÃO invente nada que o texto não diga. Marque deduções com "inferido": true.
- Mantenha os nomes originais exatamente como no texto.
- Resuma e reescreva; NÃO copie trechos longos. Guarde a referência de página em "source.pageRef".
- Marque textos de leitura gerados por você com "geradoPorIA": ["readAloud"].
- Trabalhe por distrito/capítulo (um lote por vez).
- Responda APENAS com um JSON válido no formato abaixo, sem comentários.`;

export function cityPrompt(): string {
  return `Você vai converter o texto de um livro de RPG em um "Pacote de Importação (Cidade)" JSON para o app Painel do Mestre (Call of Cthulhu 7e).

${RULES}

Formato (schemaVersion ${IMPORT_SCHEMA_VERSION}):
{
  "schemaVersion": ${IMPORT_SCHEMA_VERSION},
  "mode": "cidade",
  "label": "Nome do lote (ex.: Innsmouth — Distrito do Porto)",
  "locations": [
    {
      "externalKey": "slug-estavel-do-local",
      "name": "Nome do local",
      "aliases": ["outro nome"],
      "kind": "casa|loja|igreja|porto|armazem|taverna|instituicao|outro",
      "district": "Bairro",
      "baseDescription": "Resumo em pt-BR (reescrito, não copiado)",
      "readAloud": { "generico": "> texto de leitura", "noite": "> ..." },
      "sensoryDetails": ["detalhe 1", "detalhe 2"],
      "geradoPorIA": ["readAloud"],
      "source": { "label": "Livro X, cap. 3", "pageRef": "p. 45" }
    }
  ],
  "npcs": [
    { "externalKey": "slug-do-npc", "name": "Nome", "appearance": "...", "voiceAndMannerisms": "...", "statBlockMarkdown": "...", "source": { "label": "...", "pageRef": "..." } }
  ],
  "factions": [
    { "externalKey": "slug-da-faccao", "name": "Nome", "goals": "...", "resources": "..." }
  ]
}

Cole o texto do capítulo/distrito a seguir e devolva só o JSON:
---
[COLE O TEXTO AQUI]`;
}

export function scenarioPrompt(): string {
  return `Você vai converter o texto de um cenário de RPG em um "Pacote de Importação (Cenário)" JSON para o app Painel do Mestre (Call of Cthulhu 7e). As referências a locais e NPCs devem ser feitas POR NOME (o app vai reconciliar com a cidade já importada).

${RULES}

Formato (schemaVersion ${IMPORT_SCHEMA_VERSION}):
{
  "schemaVersion": ${IMPORT_SCHEMA_VERSION},
  "mode": "cenario",
  "label": "Nome do cenário",
  "plot": {
    "externalKey": "slug-da-trama",
    "name": "Nome da trama",
    "sourceModule": "Nome do cenário publicado",
    "hiddenTruth": "A verdade oculta (resumida)",
    "antagonists": "Quem se opõe",
    "threatLevel": 3,
    "clockSegments": 6,
    "conclusions": [ { "externalKey": "con1", "title": "O que os jogadores precisam descobrir", "description": "..." } ]
  },
  "clues": [
    { "externalKey": "pista-1", "text": "A pista (reescrita)", "locationRef": "Nome do local na cidade", "npcRef": "Nome do NPC", "howToObtain": "Perceber (Difícil)", "difficulty": "Dificil", "isBridge": false, "revealsConclusion": "con1", "inferido": false }
  ],
  "scenes": [
    { "externalKey": "cena-1", "title": "Título", "locationRef": "Nome do local", "trigger": "...", "openingText": "> leitura", "whatHappens": "..." }
  ],
  "locationLayers": [
    { "locationRef": "Nome do local", "whatChanges": "O que muda quando a trama ativa", "readAloudAppend": "> texto adicional" }
  ],
  "npcLayers": [
    { "npcRef": "Nome do NPC", "knows": "...", "hides": "...", "revealsIfPressed": "..." }
  ]
}

Cole o texto do cenário a seguir e devolva só o JSON:
---
[COLE O TEXTO AQUI]`;
}
