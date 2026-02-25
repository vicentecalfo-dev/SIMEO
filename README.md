# SIMEO

SIMEO (Sistema de Métricas de Extensão e Ocupação) é uma base institucional para evolução de funcionalidades de análise territorial.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- ESLint
- @codeworker.br/govbr-tw-react
- Leaflet
- React Leaflet
- Zustand
- Dexie
- PapaParse
- Turf.js

## Como rodar localmente

```bash
npm install
npm run dev
```

Acesse: `http://localhost:3000/projects`

## Testes

```bash
npm run test
npm run test:watch
npm run test:coverage
```

## Notas

- Projeto 100% client-side.
- Projetos são salvos localmente no navegador via IndexedDB (Dexie).
- Não existe backend neste marco.
- O Workspace possui módulo de **Sugestão (IUCN - Critério B)** baseado em EOO/AOO e subcritérios preenchidos pelo usuário.
- Limiar espacial adotado no Critério B (uso interno da sugestão):
  - `CR`: `EOO < 100 km²` e/ou `AOO < 10 km²`
  - `EN`: `EOO < 5.000 km²` e/ou `AOO < 500 km²`
  - `VU`: `EOO < 20.000 km²` e/ou `AOO < 2.000 km²`
- Limiar de número de localidades para subcritério `a`:
  - `CR <= 1`, `EN <= 5`, `VU <= 10`
- A sugestão automática **não** representa categoria final IUCN; a decisão final depende de julgamento técnico e de outros critérios/subcritérios.
- O conceito de “localidade” depende da ameaça mais séria e do julgamento do assessor.
- Marco 9: curadoria manual de ocorrências no workspace (adicionar no mapa, excluir e habilitar/desabilitar para cálculo).
- Ocorrências desabilitadas são preservadas no projeto, mas ficam fora dos cálculos/hashes de EOO/AOO e aparecem em amarelo no mapa.
- Fluxo disponível em `/projects`: criar, abrir, renomear, duplicar e excluir projetos.
- No workspace (`/projects/[id]`), nome do projeto e tamanho da célula AOO possuem autosave local com debounce.
- Importação de ocorrências disponível no workspace para CSV (com mapeamento de colunas) e JSON simples.
- Visualização de ocorrências no mapa (Leaflet) com toggle de camada e enquadramento de pontos.
- Ferramentas de qualidade no workspace: remover inválidas, remover duplicadas e limpar ocorrências.
- Persistência de ocorrências/resultados via IndexedDB será expandida nos próximos marcos.
- Mapa será implementado nos próximos marcos.
- O domínio terá testes auditáveis para cálculos de EOO/AOO nos próximos marcos.
