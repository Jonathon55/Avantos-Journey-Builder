# Challenge Alignment

Built around the requirements in the Journey Builder React Coding Challenge PDF.

## Required Behavior

- Renders a list of forms from an action blueprint graph source.
- Uses the mock-server graph endpoint when configured and falls back to bundled fixture data when it is not.
- Supports the mock-server URL through `VITE_GRAPH_ENDPOINT`.
- Shows a prefill configuration UI for the selected form.
- Lets users add, edit, and clear prefill mappings for form fields.
- Supports upstream form fields from direct dependencies.
- Supports upstream form fields from transitive dependencies.
- Includes global data as a third prefill source category.
- Does not implement a node-canvas graph UI because the prompt explicitly says that is not required.

## Extensibility

- Data sources implement the `DataSourceProvider` interface.
- The source picker reads from the provider registry, so new source types do not require modal or table rewrites.
- DAG traversal is isolated in the domain layer instead of being embedded in React components.
- Mapping updates are isolated in a small immutable helper module.

## Quality Bar

- React and TypeScript are used throughout the app.
- Components are split by responsibility: form list, mapping table, and source picker modal.
- Tests cover graph normalization, direct/transitive DAG traversal, provider aggregation, mapping updates, and core UI flows.
- `npm run test:coverage` enforces 90%+ coverage thresholds.
- `npm run lint` and `npm run build` are part of the documented final verification flow.

## Documentation Coverage

- `README.md` explains local setup, scripts, env configuration, and challenge notes.
- `docs/architecture.md` explains the app structure and why the main layers are separated.
- `.env.example` documents the optional graph endpoint without requiring local secrets.
