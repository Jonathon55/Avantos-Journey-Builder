import { mockGraph } from "../data/mockGraph";
import type { ActionBlueprintGraph, FormField, FormNode, GraphEdge } from "../domain/types";

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const pickString = (record: UnknownRecord, keys: string[], fallback: string): string => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return fallback;
};

const normalizeField = (raw: unknown, index: number): FormField => {
  const field = isRecord(raw) ? raw : {};
  const id = pickString(field, ["id", "field_id", "fieldId", "name"], `field-${index}`);
  return {
    id,
    name: pickString(field, ["name", "label", "field_name", "fieldName", "id"], id),
    type: pickString(field, ["type", "field_type", "fieldType"], "text"),
  };
};

const normalizeJsonSchemaFields = (fieldSchema: unknown): FormField[] => {
  if (!isRecord(fieldSchema) || !isRecord(fieldSchema.properties)) {
    return [];
  }

  return Object.entries(fieldSchema.properties).map(([fieldKey, rawField]) => {
    const field = isRecord(rawField) ? rawField : {};
    return {
      id: fieldKey,
      name: fieldKey,
      type: pickString(field, ["avantos_type", "type", "format"], "text"),
    };
  });
};

const normalizeForm = (raw: unknown, index: number): FormNode => {
  const form = isRecord(raw) ? raw : {};
  const id = pickString(form, ["id", "form_id", "formId", "name"], `form-${index}`);
  const rawFields = Array.isArray(form.fields)
    ? form.fields
    : Array.isArray(form.form_fields)
      ? form.form_fields
      : Array.isArray(form.components)
        ? form.components
        : [];
  const schemaFields = normalizeJsonSchemaFields(form.field_schema);

  return {
    id,
    name: pickString(form, ["name", "label", "form_name", "formName", "id"], id),
    fields: rawFields.length > 0 ? rawFields.map(normalizeField) : schemaFields,
  };
};

const normalizeActionBlueprintNode = (
  rawNode: unknown,
  formDefinitionsById: Map<string, UnknownRecord>,
): FormNode | null => {
  if (!isRecord(rawNode)) {
    return null;
  }

  const type = pickString(rawNode, ["type"], "");
  if (type && type !== "form") {
    return null;
  }

  const data = isRecord(rawNode.data) ? rawNode.data : {};
  const componentId = pickString(data, ["component_id", "componentId"], "");
  const formDefinition = componentId ? formDefinitionsById.get(componentId) : undefined;
  const id = pickString(rawNode, ["id"], pickString(data, ["component_key", "componentKey"], componentId));

  if (!id) {
    return null;
  }

  return {
    id,
    name: pickString(data, ["name"], pickString(formDefinition ?? {}, ["name"], id)),
    fields: normalizeJsonSchemaFields(formDefinition?.field_schema),
  };
};

const normalizeEdge = (raw: unknown): GraphEdge | null => {
  if (!isRecord(raw)) {
    return null;
  }

  const source = pickString(raw, ["source", "source_id", "sourceId", "from", "parent"], "");
  const target = pickString(raw, ["target", "target_id", "targetId", "to", "child"], "");
  return source && target ? { source, target } : null;
};

const extractForms = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!isRecord(payload)) {
    return [];
  }

  for (const key of ["forms", "nodes", "form_nodes", "action_blueprint_forms"]) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  if (isRecord(payload.graph)) {
    return extractForms(payload.graph);
  }

  return [];
};

const extractActionBlueprintNodeForms = (payload: unknown): FormNode[] => {
  if (!isRecord(payload)) {
    return [];
  }

  const rawNodes = Array.isArray(payload.nodes) ? payload.nodes : [];
  const rawForms = Array.isArray(payload.forms) ? payload.forms : [];
  const formDefinitionsById = new Map<string, UnknownRecord>();

  for (const rawForm of rawForms) {
    if (!isRecord(rawForm)) {
      continue;
    }

    const id = pickString(rawForm, ["id"], "");
    if (id) {
      formDefinitionsById.set(id, rawForm);
    }
  }

  return rawNodes
    .map((node) => normalizeActionBlueprintNode(node, formDefinitionsById))
    .filter((form): form is FormNode => form !== null);
};

const extractEdges = (payload: unknown): unknown[] => {
  if (!isRecord(payload)) {
    return [];
  }

  for (const key of ["edges", "dependencies", "form_edges"]) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  if (isRecord(payload.graph)) {
    return extractEdges(payload.graph);
  }

  return [];
};

export const normalizeGraphResponse = (payload: unknown): ActionBlueprintGraph => {
  const nodeForms = extractActionBlueprintNodeForms(payload);
  const forms = nodeForms.length > 0 ? nodeForms : extractForms(payload).map(normalizeForm);
  const edges = extractEdges(payload).map(normalizeEdge).filter((edge): edge is GraphEdge => edge !== null);

  if (forms.length === 0) {
    throw new Error("Graph response did not include any forms.");
  }

  return { forms, edges };
};

export const fetchGraph = async (): Promise<ActionBlueprintGraph> => {
  const endpoint = import.meta.env.VITE_GRAPH_ENDPOINT as string | undefined;
  if (!endpoint) {
    return mockGraph;
  }

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Graph request failed with ${response.status}`);
    }

    return normalizeGraphResponse(await response.json());
  } catch (error) {
    console.warn("Falling back to local graph fixture.", error);
    return mockGraph;
  }
};
