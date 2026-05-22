import { getDirectDependencies, getTransitiveDependencies } from "./graph";
import type { ActionBlueprintGraph, DataSourceProvider, FormNode, PrefillSource } from "./types";

const formFieldsToSources = (forms: FormNode[]): PrefillSource[] =>
  forms.flatMap((form) =>
    form.fields.map((field) => ({
      id: `form-field:${form.id}:${field.id}`,
      kind: "form-field" as const,
      label: field.name,
      description: `${form.name} - ${field.name}`,
      sourceFormId: form.id,
      sourceFormName: form.name,
      fieldId: field.id,
      fieldName: field.name,
    })),
  );

export const directDependencyProvider: DataSourceProvider = {
  id: "direct",
  label: "Direct dependencies",
  getSources: (graph: ActionBlueprintGraph, targetFormId: string) => ({
    id: "direct",
    label: "Direct dependencies",
    sources: formFieldsToSources(getDirectDependencies(graph, targetFormId)),
  }),
};

export const transitiveDependencyProvider: DataSourceProvider = {
  id: "transitive",
  label: "Earlier dependencies",
  getSources: (graph: ActionBlueprintGraph, targetFormId: string) => ({
    id: "transitive",
    label: "Earlier dependencies",
    sources: formFieldsToSources(getTransitiveDependencies(graph, targetFormId)),
  }),
};

const globalSources: PrefillSource[] = [
  {
    id: "global:organization-name",
    kind: "global",
    label: "organization.name",
    description: "Client organization name",
  },
  {
    id: "global:organization-id",
    kind: "global",
    label: "organization.id",
    description: "Client organization identifier",
  },
  {
    id: "global:current-user-email",
    kind: "global",
    label: "current_user.email",
    description: "Authenticated user's email",
  },
  {
    id: "global:submitted-at",
    kind: "global",
    label: "submission.timestamp",
    description: "Current submission timestamp",
  },
];

export const globalDataProvider: DataSourceProvider = {
  id: "global",
  label: "Global data",
  getSources: () => ({
    id: "global",
    label: "Global data",
    sources: globalSources,
  }),
};

export const defaultSourceProviders: DataSourceProvider[] = [
  directDependencyProvider,
  transitiveDependencyProvider,
  globalDataProvider,
];
