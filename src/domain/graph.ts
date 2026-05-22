import type { ActionBlueprintGraph, DataSourceProvider, FormNode, PrefillSourceGroup } from "./types";

const byId = (forms: FormNode[]) => new Map(forms.map((form) => [form.id, form]));

export const getFormById = (graph: ActionBlueprintGraph, formId: string): FormNode | undefined =>
  graph.forms.find((form) => form.id === formId);

export const getDirectDependencies = (graph: ActionBlueprintGraph, targetFormId: string): FormNode[] => {
  const formsById = byId(graph.forms);
  return graph.edges
    .filter((edge) => edge.target === targetFormId)
    .map((edge) => formsById.get(edge.source))
    .filter((form): form is FormNode => Boolean(form));
};

export const getDirectDependents = (graph: ActionBlueprintGraph, sourceFormId: string): FormNode[] => {
  const formsById = byId(graph.forms);
  return graph.edges
    .filter((edge) => edge.source === sourceFormId)
    .map((edge) => formsById.get(edge.target))
    .filter((form): form is FormNode => Boolean(form));
};

export const getTransitiveDependencies = (graph: ActionBlueprintGraph, targetFormId: string): FormNode[] => {
  const formsById = byId(graph.forms);
  const directIds = new Set(graph.edges.filter((edge) => edge.target === targetFormId).map((edge) => edge.source));
  const visited = new Set<string>();
  const result: FormNode[] = [];
  const queue = Array.from(directIds);

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || visited.has(currentId)) {
      continue;
    }

    visited.add(currentId);
    const upstreamEdges = graph.edges.filter((edge) => edge.target === currentId);

    for (const edge of upstreamEdges) {
      if (!visited.has(edge.source)) {
        queue.push(edge.source);
      }

      if (!directIds.has(edge.source)) {
        const form = formsById.get(edge.source);
        if (form && !result.some((existing) => existing.id === form.id)) {
          result.push(form);
        }
      }
    }
  }

  return result;
};

export const getAvailablePrefillSources = (
  graph: ActionBlueprintGraph,
  targetFormId: string,
  providers: DataSourceProvider[],
): PrefillSourceGroup[] =>
  providers
    .map((provider) => provider.getSources(graph, targetFormId))
    .filter((group) => group.sources.length > 0);
