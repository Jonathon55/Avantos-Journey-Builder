export type FormField = {
  id: string;
  name: string;
  type: string;
};

export type FormNode = {
  id: string;
  name: string;
  fields: FormField[];
};

export type GraphEdge = {
  source: string;
  target: string;
};

export type ActionBlueprintGraph = {
  forms: FormNode[];
  edges: GraphEdge[];
};

export type PrefillSourceKind = "form-field" | "global";

export type PrefillSource = {
  id: string;
  kind: PrefillSourceKind;
  label: string;
  description: string;
  sourceFormId?: string;
  sourceFormName?: string;
  fieldId?: string;
  fieldName?: string;
};

export type PrefillSourceGroup = {
  id: string;
  label: string;
  sources: PrefillSource[];
};

export type PrefillMapping = {
  targetFormId: string;
  targetFieldId: string;
  source: PrefillSource;
};

export type DataSourceProvider = {
  id: string;
  label: string;
  getSources: (graph: ActionBlueprintGraph, targetFormId: string) => PrefillSourceGroup;
};
