import type { ActionBlueprintGraph, PrefillMapping } from "../domain/types";

export const mockGraph: ActionBlueprintGraph = {
  forms: [
    {
      id: "form-a",
      name: "Form A",
      fields: [
        { id: "a-email", name: "email", type: "email" },
        { id: "a-first-name", name: "first_name", type: "text" },
        { id: "a-company", name: "company", type: "text" },
      ],
    },
    {
      id: "form-b",
      name: "Form B",
      fields: [
        { id: "b-work-email", name: "work_email", type: "email" },
        { id: "b-role", name: "role", type: "text" },
      ],
    },
    {
      id: "form-c",
      name: "Form C",
      fields: [
        { id: "c-region", name: "region", type: "select" },
        { id: "c-plan", name: "plan", type: "select" },
      ],
    },
    {
      id: "form-d",
      name: "Form D",
      fields: [
        { id: "d-checkbox-group", name: "dynamic_checkbox_group", type: "checkbox-group" },
        { id: "d-object", name: "dynamic_object", type: "object" },
        { id: "d-email", name: "email", type: "email" },
      ],
    },
    {
      id: "form-e",
      name: "Form E",
      fields: [
        { id: "e-account-id", name: "account_id", type: "text" },
        { id: "e-owner", name: "owner", type: "text" },
      ],
    },
  ],
  edges: [
    { source: "form-a", target: "form-b" },
    { source: "form-a", target: "form-c" },
    { source: "form-b", target: "form-d" },
    { source: "form-c", target: "form-d" },
    { source: "form-d", target: "form-e" },
  ],
};

export const initialMappings: PrefillMapping[] = [
  {
    targetFormId: "form-d",
    targetFieldId: "d-email",
    source: {
      id: "form-field:form-a:a-email",
      kind: "form-field",
      label: "email",
      description: "Form A - email",
      sourceFormId: "form-a",
      sourceFormName: "Form A",
      fieldId: "a-email",
      fieldName: "email",
    },
  },
];
