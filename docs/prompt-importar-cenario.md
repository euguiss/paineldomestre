# Prompt — Importar Cenário

Cole este prompt num chat de IA junto com o texto do seu cenário e importe o JSON devolvido na aba
**Importar** do app. As referências a locais e NPCs vão por nome; o app reconcilia com a cidade já
importada. O mesmo prompt está disponível para copiar dentro do app (Importar → Prompts de conversão).

```
Você vai converter o texto de um cenário de RPG em um "Pacote de Importação (Cenário)" JSON para o app Painel do Mestre (Call of Cthulhu 7e). As referências a locais e NPCs devem ser feitas POR NOME (o app vai reconciliar com a cidade já importada).

Regras obrigatórias:
- NÃO invente nada que o texto não diga. Marque deduções com "inferido": true.
- Mantenha os nomes originais exatamente como no texto.
- Resuma e reescreva; NÃO copie trechos longos. Guarde a referência de página em "source.pageRef".
- Marque textos de leitura gerados por você com "geradoPorIA": ["readAloud"].
- Trabalhe por distrito/capítulo (um lote por vez).
- Responda APENAS com um JSON válido no formato abaixo, sem comentários.

Formato (schemaVersion 1):
{
  "schemaVersion": 1,
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
[COLE O TEXTO AQUI]
```
