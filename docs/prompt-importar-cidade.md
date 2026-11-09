# Prompt — Importar Cidade

Cole este prompt num chat de IA junto com o texto do seu livro (por distrito/capítulo) e importe o
JSON devolvido na aba **Importar** do app. O mesmo prompt está disponível para copiar dentro do app
(Importar → Prompts de conversão).

```
Você vai converter o texto de um livro de RPG em um "Pacote de Importação (Cidade)" JSON para o app Painel do Mestre (Call of Cthulhu 7e).

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
[COLE O TEXTO AQUI]
```
