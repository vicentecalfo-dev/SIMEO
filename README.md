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
- Fluxo disponível em `/projects`: criar, abrir, renomear, duplicar e excluir projetos.
- No workspace (`/projects/[id]`), nome do projeto e tamanho da célula AOO possuem autosave local com debounce.
- Importação de ocorrências disponível no workspace para CSV (com mapeamento de colunas) e JSON simples.
- Ferramentas de qualidade no workspace: remover inválidas, remover duplicadas e limpar ocorrências.
- Persistência de ocorrências/resultados via IndexedDB será expandida nos próximos marcos.
- Mapa será implementado nos próximos marcos.
- O domínio terá testes auditáveis para cálculos de EOO/AOO nos próximos marcos.
