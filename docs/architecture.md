# Architecture

## Overview

The app separates data loading, graph/domain behavior, and React rendering so the prefill workflow is easy to test and extend.

## Data Flow

- `src/api/graphClient.ts` fetches and normalizes graph data into stable app types.
- `VITE_GRAPH_ENDPOINT` points to the mock-server graph URL.
- When endpoint configuration is absent or the request fails, the client falls back to local fixture data.
- The normalizer supports the Avantos graph shape where `nodes[]` contain form component keys and `forms[]` contain reusable form definitions with `field_schema.properties`.
- `src/data/mockGraph.ts` contains the bundled demo graph and initial prefill mapping.

## Domain Layer

- `src/domain/types.ts` defines forms, fields, edges, mappings, sources, and provider interfaces.
- `src/domain/graph.ts` owns DAG traversal and source aggregation.
- `src/domain/sourceProviders.ts` defines the provider registry for direct dependencies, transitive dependencies, and global data.
- `src/domain/prefillMappings.ts` owns immutable mapping updates.

## UI Layer

- `src/App.tsx` coordinates loading state, selected form state, mapping state, and modal state.
- `src/components/FormList.tsx` renders the selectable form list with dependency/mapping context.
- `src/components/PrefillTable.tsx` renders field-level mapping controls.
- `src/components/SourcePickerModal.tsx` renders source selection and search.

## Tooling

- `eslint.config.js` keeps React hooks, TypeScript, and refresh-safety checks consistent.
- The split `tsconfig` files follow Vite's app/node pattern: browser app files use DOM typings, while Vite/ESLint config files use Node-oriented compiler settings.
- `npm run test:coverage` enforces 90%+ coverage thresholds for lines, branches, functions, and statements.
